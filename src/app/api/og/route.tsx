import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new Response("ID no proporcionado", { status: 400 });

    const { data: v, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !v) return new Response("Vehículo no encontrado", { status: 404 });

    const marca = v.marca || '';
    const modelo = v.modelo || '';
    const version = v.version || '';
    const precio = Number(v.pv || 0).toLocaleString('de-DE');
    const moneda = v.moneda === 'USD' ? 'U$S' : '$';
    const km = v.km?.toLocaleString('de-DE') || '0';
    const anio = v.anio?.toString() || '';
    const fotoUrl = v.fotos?.[0] || '';

    // CORRECCIÓN DE CAMPOS: Verificamos los nombres reales de las columnas
    // Se agregan varias opciones por si el campo es boolean o string
    const aceptaPermuta = v.acepta_permuta === true || v.acepta_permuta === 'true' || v.permuta === true;
    const esFinanciable = v.financiacion === true || v.financiacion === 'true' || v.financia === true;

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          padding: '50px 50px 220px 50px',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ display: 'flex', width: '100%', height: '58%', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '35px', flexGrow: 1 }}>
            
            <h1 style={{ color: 'white', fontSize: '82px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '-3px', lineHeight: '1' }}>
              {marca} {modelo} <span style={{ color: '#64748b', marginLeft: '20px' }}>{anio}</span>
            </h1>
            
            {/* AZUL HOTCARS ORIGINAL: #2596be */}
            <p style={{ color: '#2596be', fontSize: '36px', fontWeight: '700', margin: '10px 0 25px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {version}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '30px' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#64748b', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Kilometraje</span>
                  <span style={{ color: 'white', fontSize: '32px', fontWeight: '800' }}>{km} KM</span>
               </div>

               {/* ETIQUETAS COMERCIALES - Solo se muestran si el valor es TRUE en Supabase */}
               <div style={{ display: 'flex', gap: '15px' }}>
                  {aceptaPermuta && (
                    <div style={{ backgroundColor: '#2596be', padding: '12px 25px', borderRadius: '15px', display: 'flex' }}>
                      <span style={{ color: 'white', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Acepta Permuta</span>
                    </div>
                  )}
                  {esFinanciable && (
                    <div style={{ backgroundColor: '#288b55', padding: '12px 25px', borderRadius: '15px', display: 'flex' }}>
                      <span style={{ color: 'white', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Financiación</span>
                    </div>
                  )}
               </div>
            </div>

            <div style={{ display: 'flex', backgroundColor: '#288b55', padding: '25px 50px', borderRadius: '30px', marginTop: 'auto', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <span style={{ color: 'white', fontSize: '90px', fontWeight: '900', letterSpacing: '-4px' }}>
                {moneda} {precio}
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  } catch (e: any) {
    return new Response(`Error`, { status: 500 });
  }
}