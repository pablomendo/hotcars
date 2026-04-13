import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import VehicleDetailPage from './VehicleDetailPage';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;

  const [{ data: vehicle }, { data: webConfig }] = await Promise.all([
    supabase.from('inventario').select('marca, modelo, version, anio, km, pv, moneda, fotos').eq('id', id).single(),
    supabase.from('web_configs').select('title').eq('subdomain', slug).single(),
  ]);

  if (!vehicle) return { title: 'Vehículo' };

  const fotos = normalizeFotos(vehicle.fotos);
  const imageUrl = fotos[0] || 'https://hotcars.com.ar/hero1-desktop-hotcars.jpg';
  const titulo = `${vehicle.marca} ${vehicle.modelo}${vehicle.version ? ' ' + vehicle.version : ''} ${vehicle.anio}`;
  const precio = `${vehicle.moneda === 'USD' ? 'U$S' : '$'} ${Number(vehicle.pv).toLocaleString('de-DE')}`;
  const km = `${Number(vehicle.km).toLocaleString('de-DE')} km`;
  const agencia = webConfig?.title || slug;
  const description = `${titulo} — ${km} — ${precio}.`;
  const pageUrl = `https://${slug}.hotcars.com.ar/agencia/${slug}/vehiculo/${id}`;

  return {
    title: `${titulo} | ${agencia}`,
    description,
    openGraph: {
      title: `${titulo} — ${precio}`,
      description,
      url: pageUrl,
      siteName: agencia,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: titulo }],
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
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;

  const { data: vehicle, error } = await supabase
    .from('inventario')
    .select('id')
    .eq('id', id)
    .single();

  if (error || !vehicle) return notFound();

  return <VehicleDetailPage />;
}
