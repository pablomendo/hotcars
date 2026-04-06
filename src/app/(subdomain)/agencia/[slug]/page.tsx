import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import SubdomainClient from './SubdomainClient';

const supabase = createClient(
  'https://xkwkgcjgxjvidiwthwbr.supabase.co',
  'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'
);

const FIELDS = 'id, marca, modelo, version, anio, km, pv, moneda, fotos, is_featured, is_new, inventory_status, categoria, localidad, provincia, descripcion, acepta_permuta, financiacion, created_at, show_on_web, created_by_user_id, web_order';

export default async function SubdomainPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: config, error } = await supabase
    .from('web_configs')
    .select('*')
    .eq('subdomain', slug)
    .single();

  if (error || !config) return notFound();

  const [propiosRes, flipsRes] = await Promise.all([
    supabase
      .from('inventario')
      .select(FIELDS)
      .eq('created_by_user_id', config.user_id)
      .eq('show_on_web', true)
      .neq('inventory_status', 'pausado')
      .order('web_order', { ascending: true }),

    // show_on_web vive en inventario, no en flip_compartido — se filtra en JS abajo
    supabase
      .from('flip_compartido')
      .select(`inventario:auto_id(${FIELDS})`)
      .eq('vendedor_user_id', config.user_id)
      .eq('status', 'approved'),
  ]);

  const propios = (propiosRes.data || []).map((v: any) => ({
    ...v,
    fotos: normalizeFotos(v.fotos),
  }));

  const flips = (flipsRes.data || [])
    .map((f: any) => f.inventario)
    .filter((v: any) =>
      v !== null &&
      v.show_on_web === true &&
      v.inventory_status?.toLowerCase() !== 'pausado'
    )
    .map((v: any) => ({
      ...v,
      fotos: normalizeFotos(v.fotos),
    }));

  const seen = new Set<string>();
  const vehicles = [...propios, ...flips]
    .filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
    .sort((a, b) => (a.web_order || 0) - (b.web_order || 0));

  return <SubdomainClient config={config} initialVehicles={vehicles} />;
}

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