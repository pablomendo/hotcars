import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Phone, Instagram, Facebook, MessageCircle, Share2, Search } from 'lucide-react';
import VehicleGrid from './VehicleGrid';

interface SubdomainPageProps {
  params: { subdomain: string };
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = await params;

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

  return (
    <div className="min-h-screen bg-[#0b1114] text-white font-sans text-left">

      {/* HEADER ÚNICO */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0b1114]/90 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <a href="#" className="font-black uppercase tracking-tighter text-base md:text-lg text-white hover:text-[#22c55e] transition-colors flex-shrink-0">
            INICIO
          </a>
        </div>

        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Buscar vehículo..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#22c55e]/50 transition-all text-white placeholder:text-white/20"
          />
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {config?.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#22c55e] text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#16a34a] transition-all"
            >
              <MessageCircle size={14} /> CONTACTO
            </a>
          )}
        </div>
      </header>

      {/* PORTADA - Pantalla completa, sin estirar */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img
          src={config?.cover_image_url || '/portada_mi_web.jpg'}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Portada"
        />
        
        {(config?.title || config?.subtitle) && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        <div className="relative z-10 text-center px-6">
          {config?.title && (
            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-2 drop-shadow-2xl text-white">
              {config.title}
            </h2>
          )}
          {config?.subtitle && (
            <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 border border-white/10">
              <p className="text-sm md:text-lg font-bold tracking-[0.4em] text-white uppercase italic">
                {config.subtitle}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* GRILLA DIRECTA (Sin la franja de categorías que molestaba) */}
      <VehicleGrid vehicles={vehicles || []} whatsapp={config?.whatsapp} />

      {/* FOOTER */}
      <footer className="bg-black py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h3 className="text-4xl font-black uppercase tracking-tighter">{config?.title || 'HOTCARS'}</h3>
            <div className="space-y-5">
              {config?.direccion && (
                <div className="flex items-start gap-4 text-slate-400">
                  <MapPin size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.direccion}</span>
                </div>
              )}
              {config?.horarios && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Clock size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.horarios}</span>
                </div>
              )}
              {config?.telefono && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Phone size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.telefono}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:items-end justify-center gap-10">
            {config?.show_socials_footer && (
              <div className="flex gap-8">
                {config?.instagram && (
                  <a href={`https://instagram.com/${config.instagram}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1">
                    <Instagram size={28} />
                  </a>
                )}
                {config?.whatsapp && (
                  <a href={`https://wa.me/${config.whatsapp}`} target="_blank" className="text-[#22c55e] hover:scale-110 transition-transform">
                    <MessageCircle size={34} />
                  </a>
                )}
              </div>
            )}
            <div className="pt-10 opacity-20">
              <span className="text-[9px] font-black uppercase tracking-widest">Powered by HotCars</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}