// app/vehiculos/[id]/page.tsx
// SERVER Component — genera OG metadata dinámico por vehículo

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import VehicleDetailPage from './VehicleDetailPage';

const supabase = createClient(
  'https://xkwkgcjgxjvidiwthwbr.supabase.co',
  'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'
);

function normalizeFotos(raw: unknown): string[] {
  if (!raw) return [];
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return []; }
  } else {
    return [];
  }
  return arr.filter((f): f is string => typeof f === 'string' && f.startsWith('http'));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const realId = id.length > 36 ? id.slice(-36) : id;

  const { data: vehicle } = await supabase
    .from('inventario')
    .select('marca, modelo, version, anio, km, pv, moneda, fotos, owner_user_id')
    .eq('id', realId)
    .single();

  if (!vehicle) return { title: 'Vehículo | HotCars PRO' };

  const fotos = normalizeFotos(vehicle.fotos);
  const imageUrl = fotos[0] || 'https://hotcars.com.ar/hero1-desktop-hotcars.jpg';
  const titulo = `${vehicle.marca} ${vehicle.modelo}${vehicle.version ? ' ' + vehicle.version : ''} ${vehicle.anio}`;
  const precio = `${vehicle.moneda === 'USD' ? 'U$S' : '$'} ${Number(vehicle.pv).toLocaleString('de-DE')}`;
  const km = `${Number(vehicle.km).toLocaleString('de-DE')} km`;
  const description = `${titulo} — ${km} — ${precio}. Publicado en HotCars PRO.`;
  const pageUrl = `https://hotcars.com.ar/vehiculos/${id}`;

  return {
    title: `${titulo} | HotCars PRO`,
    description,
    openGraph: {
      title: `${titulo} — ${precio}`,
      description,
      url: pageUrl,
      siteName: 'HotCars PRO',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: titulo,
        },
      ],
      locale: 'es_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} — ${precio}`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const realId = id.length > 36 ? id.slice(-36) : id;

  const { data: vehicle, error } = await supabase
    .from('inventario')
    .select('id')
    .eq('id', realId)
    .single();

  if (error || !vehicle) return notFound();

  return <VehicleDetailPage />;
}