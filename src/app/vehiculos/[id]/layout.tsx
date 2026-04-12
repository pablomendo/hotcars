// app/vehiculos/[id]/layout.tsx
// Este archivo se encarga del Open Graph metadata dinámico para cada vehículo.
// Como page.tsx usa 'use client', la metadata debe ir acá en un Server Component.

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: paramId } = await params;

  // El slug puede tener el id al final (ej: "ford-ranger-2022-<uuid>")
  // Extraemos el uuid real (últimos 36 caracteres)
  const realId = paramId.length > 36 ? paramId.slice(-36) : paramId;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: vehicle } = await supabase
    .from('inventario')
    .select('marca, modelo, anio, pv, moneda, fotos, descripcion, localidad, provincia, version, km')
    .eq('id', realId)
    .single();

  if (!vehicle) {
    return {
      title: 'Vehículo | HotCars',
      description: 'Encontrá los mejores autos en HotCars Argentina.',
    };
  }

  const precio = `${vehicle.moneda === 'USD' ? 'U$S' : '$'} ${Number(vehicle.pv).toLocaleString('de-DE')}`;
  const titulo = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} — ${precio}`;
  const subtitulo = vehicle.version ? ` ${vehicle.version}` : '';
  const ubicacion = vehicle.localidad && vehicle.provincia ? ` · ${vehicle.localidad}, ${vehicle.provincia}` : '';
  const km = vehicle.km ? ` · ${Number(vehicle.km).toLocaleString('de-DE')} km` : '';

  const description =
    vehicle.descripcion?.slice(0, 160) ||
    `${vehicle.marca} ${vehicle.modelo}${subtitulo} ${vehicle.anio}${km}${ubicacion}. Encontralo en HotCars Argentina.`;

  // Usamos la primera foto del vehículo para el Open Graph
  const ogImage = vehicle.fotos?.[0] || 'https://hotcars.com.ar/og-default.jpg';

  return {
    title: titulo,
    description,
    openGraph: {
      title: titulo,
      description,
      url: `https://hotcars.com.ar/vehiculos/${paramId}`,
      siteName: 'HotCars',
      locale: 'es_AR',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description,
      images: [ogImage],
    },
  };
}

export default function VehicleDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}