import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import SubdomainClient from './SubdomainClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: config, error } = await supabase
    .from('web_configs')
    .select('*')
    .eq('subdomain', slug)
    .single();

  if (error || !config) return notFound();

  const { data: vehicles } = await supabase
    .from('inventario')
    .select('*')
    .eq('owner_user_id', config.user_id)
    .eq('inventory_status', 'activo')
    .eq('show_on_web', true)
    .order('web_order', { ascending: true });

  return <SubdomainClient config={config} initialVehicles={vehicles || []} />;
}
