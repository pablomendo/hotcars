import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import CategoryStrip from "@/components/CategoryStrip";
import FeaturedSlider from "@/components/FeaturedSlider";
import SiteFooter from "@/components/SiteFooter";
// Importación corregida: VehicleGrid está en la misma carpeta
import VehicleGrid from "./VehicleGrid";

interface SubdomainPageProps {
  params: { subdomain: string };
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = await params;

  // Lógica de obtención de datos de producción
  const { data: config, error: configError } = await supabase
    .from('web_configs')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (configError || !config) {
    return notFound();
  }

  const { data: vehicles } = await supabase
    .from('inventario')
    .select('*')
    .eq('created_by_user_id', config.user_id)
    .eq('show_on_web', true)
    .neq('inventory_status', 'pausado')
    .order('is_featured', { ascending: false });

  const currentVehicles = vehicles || [];
  const newVehicles = currentVehicles.filter((v) => v.is_new);
  const featuredVehicles = currentVehicles.filter((v) => v.is_featured);

  return (
    <div className="min-h-screen bg-[#0b1114]">
      <SiteHeader 
        whatsapp={config.whatsapp} 
      />

      <HeroSection
        coverImage={config.cover_image_url}
        title={config.title}
        subtitle={config.subtitle}
      />

      <CategoryStrip />

      {newVehicles.length > 0 && (
        <FeaturedSlider
          title="Recién Llegados"
          vehicles={newVehicles}
          whatsapp={config.whatsapp}
        />
      )}

      {featuredVehicles.length > 0 && (
        <FeaturedSlider
          title="Destacados"
          vehicles={featuredVehicles}
          whatsapp={config.whatsapp}
        />
      )}

      <VehicleGrid
        vehicles={currentVehicles}
        whatsapp={config.whatsapp}
      />

      <SiteFooter config={config} />
    </div>
  );
}