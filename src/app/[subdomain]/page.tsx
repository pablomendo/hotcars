import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Phone, Instagram, Facebook, MessageCircle, Share2 } from 'lucide-react';

interface SubdomainPageProps {
  params: { subdomain: string };
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  // En Next.js 15, params es una Promise, por eso se usa await.
  const { subdomain } = await params;

  // 1. Buscamos la configuración estética de este subdominio
  const { data: config, error: configError } = await supabase
    .from('web_configs')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  // Si el subdominio no existe en la tabla web_configs, 404
  if (configError || !config) {
    return notFound();
  }

  // 2. Buscamos el inventario que pertenece al dueño de esta web
  // Filtramos por su user_id y que el tilde 'show_on_web' esté activo
  const { data: vehicles } = await supabase
    .from('inventario')
    .select('*')
    .eq('created_by_user_id', config.user_id)
    .eq('show_on_web', true)
    .neq('inventory_status', 'pausado')
    .order('is_featured', { ascending: false });

  return (
    <div className="min-h-screen bg-[#0b1114] text-white font-sans text-left">
      {/* SECCIÓN HERO: Refleja el título y portada de /miweb */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img 
          src={config.cover_image_url || '/portada_mi_web.jpg'} 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          alt="Portada Agencia"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1114] via-transparent to-transparent" />
        
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {config.title || 'MI AGENCIA'}
          </h1>
          <p className="text-lg md:text-2xl font-light tracking-[0.3em] text-slate-300 uppercase opacity-80">
            {config.subtitle || 'CONCESIONARIO OFICIAL'}
          </p>
        </div>
      </section>

      {/* GRILLA DE VEHÍCULOS: Espejo del inventario del usuario */}
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-3xl font-black uppercase tracking-widest border-l-8 border-[#22c55e] pl-6">
            Stock Disponible
          </h2>
          <span className="text-slate-500 font-mono text-sm uppercase">
            {vehicles?.length || 0} Unidades
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {vehicles?.map((v) => (
            <div key={v.id} className="bg-[#141b1f] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#22c55e]/40 transition-all duration-300 shadow-2xl">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={v.fotos?.[0] || '/placeholder-car.jpg'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={`${v.marca} ${v.modelo}`}
                />
                
                {/* Badges dinámicos */}
                <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                    {v.is_featured && (
                      <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg">
                        Destacado
                      </span>
                    )}
                    {v.is_new && (
                      <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg">
                        Nuevo
                      </span>
                    )}
                    {v.inventory_status === 'reservado' && (
                      <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg">
                        Reservado
                      </span>
                    )}
                </div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase leading-none mb-2">{v.marca}</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">{v.modelo}</p>
                  </div>
                  <span className="text-[11px] font-black bg-white/5 px-2 py-1 rounded text-slate-500 uppercase">
                    {v.anio}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>{v.km?.toLocaleString()} KM</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span>{v.tipo_combustible || 'Nafta'}</span>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <span className="text-3xl font-black text-[#22c55e] tracking-tighter">
                    {v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('es-AR')}
                  </span>
                  <button className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#22c55e] transition-colors">
                    Consultar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!vehicles || vehicles.length === 0) && (
          <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[40px]">
            <p className="text-slate-600 uppercase font-black tracking-[0.3em]">No hay unidades publicadas</p>
          </div>
        )}
      </main>

      {/* FOOTER: Datos de contacto dinámicos de la tabla web_configs */}
      <footer className="bg-black py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h3 className="text-4xl font-black uppercase tracking-tighter">{config.title}</h3>
            <div className="space-y-5">
              {config.direccion && (
                <div className="flex items-start gap-4 text-slate-400">
                  <MapPin size={22} className="text-[#22c55e] shrink-0"/> 
                  <span className="text-sm uppercase font-bold tracking-tight">{config.direccion}</span>
                </div>
              )}
              {config.horarios && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Clock size={22} className="text-[#22c55e] shrink-0"/> 
                  <span className="text-sm uppercase font-bold tracking-tight">{config.horarios}</span>
                </div>
              )}
              {config.telefono && (
                <div className="flex items-start gap-4 text-slate-400">
                  <Phone size={22} className="text-[#22c55e] shrink-0"/> 
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
                  {config.instagram && <a href={`https://instagram.com/${config.instagram}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Instagram size={28}/></a>}
                  {config.facebook && <a href={`https://facebook.com/${config.facebook}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Facebook size={28}/></a>}
                  {config.tiktok && <a href={`https://tiktok.com/@${config.tiktok}`} target="_blank" className="text-white hover:text-[#22c55e] transition-all transform hover:-translate-y-1"><Share2 size={28}/></a>}
                  {config.whatsapp && <a href={`https://wa.me/${config.whatsapp}`} target="_blank" className="text-[#22c55e] hover:scale-110 transition-transform"><MessageCircle size={34}/></a>}
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