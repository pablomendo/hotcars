import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import SubdomainClient from './SubdomainClient';

const supabase = createClient(
  'https://xkwkgcjgxjvidiwthwbr.supabase.co',
  'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'
);

export default async function SubdomainPage({ params }: { params: { subdomain: string } }) {
  const { subdomain } = await params;

  const { data: config, error } = await supabase
    .from('web_configs')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (error || !config) return notFound();

  const { data: vehicles } = await supabase
    .from('inventario')
    .select('id, marca, modelo, version, anio, km, pv, moneda, fotos, is_featured, is_new, inventory_status, categoria, localidad, provincia, descripcion, acepta_permuta, financiacion, created_at, show_on_web, created_by_user_id')
    .eq('created_by_user_id', config.user_id)
    .eq('show_on_web', true)
    .neq('inventory_status', 'pausado')
    .order('created_at', { ascending: false });

  return (
    <SubdomainClient
      config={config}
      initialVehicles={vehicles || []}
    />
  );
}