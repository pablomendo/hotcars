import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Phone, Instagram, Facebook, MessageCircle, Share2 } from 'lucide-react';
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

      {/* HEADER: solo nombre de la agencia */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b1114]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h1 className="font-black uppercase tracking-tighter text-xl text-white">
          {config.title || 'MI AGENCIA'}
        </h1>
        {config.whatsapp && (
          <a
            href={`https://wa.me/${config.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#22c55e] text-black px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#16a34a] transition-colors"
          >
            <MessageCircle size={14} /> Contactar
          </a>
        )}
      </header>

      {/* SECCIÓN HERO CON FRANJA VERDE */}
      <section className="relative h-[65vh] flex items-center justify-center overflow-hidden pt-16">
        <img
          src={config.cover_image_url || '/portada_mi_web.jpg'}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          alt="Portada Agencia"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1114] via-[#0b1114]/20 to-transparent" />
        
        {/* Franja Verde Estilo HotCars */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#22c55e] z-20 flex items-center overflow-hidden rotate-0">
          <div className="flex whitespace-nowrap animate-pulse">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="text-black font-black text-xl md:text-2xl uppercase italic tracking-tighter mx-6 flex-shrink-0">
                {config.title || 'HOTCARS'} • {config.title || 'HOTCARS'} •
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center px-6 mb-12">
          <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-4 drop-shadow-2xl">
            {config.title || 'MI AGENCIA'}
          </h2>
          <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 border border-white/10">
            <p className="text-sm md:text-lg font-bold tracking-[0.4em] text-white uppercase italic">
              {config.subtitle || 'CONCESIONARIO OFICIAL'}
            </p>
          </div>
        </div>
      </section>

      {/* GRILLA CON FILTROS — Client Component */}
      <VehicleGrid vehicles={vehicles || []} whatsapp={config.whatsapp} />

      {/* FOOTER */}
      <footer className="bg-black py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h3 className="text-4xl font-black uppercase tracking-tighter">{config.title}</h3>
            <div className="space-y-5">
              {config.direccion && (
                <div className="flex items-start gap-4 text-slate-400">
                  <MapPin size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.direccion}</span>
                </div>
              )}
              {config.horarios && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Clock size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.horarios}</span>
                </div>
              )}
              {config.telefono && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Phone size={22} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm uppercase font-bold tracking-tight">{config.telefono}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col md:items-end justify-center gap-10">
            {config.show_socials_footer && (
              <>
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">Nuestras Redes</span>
                <div className="flex gap-8">
                  {config.instagram && <a href={`https://instagram.com/${config.instagram}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Instagram size={28} /></a>}
                  {config.facebook && <a href={`https://facebook.com/${config.facebook}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Facebook size={28} /></a>}
                  {config.tiktok && <a href={`https://tiktok.com/@${config.tiktok}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Share2 size={28} /></a>}
                  {config.whatsapp && <a href={`https://wa.me/${config.whatsapp}`} target="_blank" className="text-[#22c55e] hover:scale-110 transition-transform"><MessageCircle size={34} /></a>}
                </div>
              </>
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