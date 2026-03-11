// app/api/sync-ml-base-autos/route.ts
// Llamar UNA SOLA VEZ desde el browser: GET /api/sync-ml-base-autos
// Llena la tabla base_autos con datos de MercadoLibre Argentina

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Categorías de ML que nos interesan y su equivalente en base_autos
const CATEGORIAS = [
  { mlId: 'MLA1744', nombre: 'AUTO' },        // Autos y Camionetas
  { mlId: 'MLA3937', nombre: 'CAMION' },      // Camiones y Micros
  { mlId: 'MLA1384', nombre: 'MOTO' },        // Motos
  { mlId: 'MLA5656', nombre: 'PICKUP' },      // Pickups y 4x4 — dentro de MLA1744
];

async function fetchML(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HotCars/1.0' },
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`ML API error ${res.status}: ${url}`);
  return res.json();
}

async function getMarcas(categoriaId: string): Promise<string[]> {
  try {
    const data = await fetchML(`https://api.mercadolibre.com/categories/${categoriaId}/attributes`);
    const marcaAttr = data.find((a: any) => a.id === 'BRAND');
    if (!marcaAttr?.values) return [];
    return marcaAttr.values.map((v: any) => v.name.toUpperCase());
  } catch {
    return [];
  }
}

async function getModelos(categoriaId: string, marca: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(marca);
    const data = await fetchML(
      `https://api.mercadolibre.com/sites/MLA/search?category=${categoriaId}&BRAND=${encoded}&limit=0`
    );
    // Extraer modelos de los filtros disponibles
    const filters = data.available_filters || data.filters || [];
    const modelFilter = filters.find((f: any) => f.id === 'MODEL');
    if (!modelFilter?.values) return [];
    return modelFilter.values.map((v: any) => v.name.toUpperCase());
  } catch {
    return [];
  }
}

async function getVersiones(categoriaId: string, marca: string, modelo: string): Promise<string[]> {
  try {
    const encodedMarca = encodeURIComponent(marca);
    const encodedModelo = encodeURIComponent(modelo);
    const data = await fetchML(
      `https://api.mercadolibre.com/sites/MLA/search?category=${categoriaId}&BRAND=${encodedMarca}&MODEL=${encodedModelo}&limit=0`
    );
    const filters = data.available_filters || data.filters || [];
    const versionFilter = filters.find((f: any) => f.id === 'VERSION' || f.id === 'TRIM');
    if (!versionFilter?.values) return [];
    return versionFilter.values.map((v: any) => v.name.toUpperCase());
  } catch {
    return [];
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET() {
  const logs: string[] = [];
  let totalInserted = 0;
  let totalErrors = 0;

  try {
    // Limpiar tabla antes de repoblar (opcional — comentar si querés hacer merge)
    logs.push('Limpiando tabla base_autos...');
    const { error: deleteError } = await supabase.from('base_autos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw new Error('Error limpiando tabla: ' + deleteError.message);
    logs.push('Tabla limpiada OK');

    for (const categoria of CATEGORIAS) {
      logs.push(`\n=== Procesando categoría: ${categoria.nombre} (${categoria.mlId}) ===`);

      const marcas = await getMarcas(categoria.mlId);
      logs.push(`Marcas encontradas: ${marcas.length}`);

      for (const marca of marcas) {
        await sleep(200); // Respetar rate limit de ML

        const modelos = await getModelos(categoria.mlId, marca);

        if (modelos.length === 0) {
          // Si no hay modelos, insertar solo marca
          const { error } = await supabase.from('base_autos').insert({
            marca,
            modelo: '',
            version: '',
            categoria: categoria.nombre
          });
          if (error) totalErrors++;
          else totalInserted++;
          continue;
        }

        for (const modelo of modelos) {
          await sleep(150);

          const versiones = await getVersiones(categoria.mlId, marca, modelo);

          if (versiones.length === 0) {
            // Sin versiones — insertar marca + modelo
            const { error } = await supabase.from('base_autos').insert({
              marca,
              modelo,
              version: '',
              categoria: categoria.nombre
            });
            if (error) totalErrors++;
            else totalInserted++;
          } else {
            // Insertar una fila por versión
            const rows = versiones.map(version => ({
              marca,
              modelo,
              version,
              categoria: categoria.nombre
            }));

            const { error } = await supabase.from('base_autos').insert(rows);
            if (error) {
              totalErrors += rows.length;
              logs.push(`Error insertando ${marca} ${modelo}: ${error.message}`);
            } else {
              totalInserted += rows.length;
            }
          }
        }

        logs.push(`✓ ${marca}: ${modelos.length} modelos procesados`);
      }
    }

    return NextResponse.json({
      ok: true,
      totalInserted,
      totalErrors,
      logs
    });

  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      totalInserted,
      totalErrors,
      logs
    }, { status: 500 });
  }
}
