'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  MessageCircle, MapPin, Clock, Phone,
  Instagram, Facebook, Share2, ChevronLeft, ChevronRight,
  X, Car, CheckCircle2,
} from 'lucide-react';

const supabase = createClient(
  'https://xkwkgcjgxjvidiwthwbr.supabase.co',
  'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'
);

interface WebConfig {
  user_id: string;
  subdomain: string;
  title: string | null;
  subtitle: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  direccion: string | null;
  horarios: string | null;
  telefono: string | null;
  show_socials_footer: boolean;
}

interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  pv: number;
  moneda: string;
  fotos: any;
  is_featured: boolean;
  is_new: boolean;
  inventory_status: string;
  categoria: string | null;
  localidad: string | null;
  provincia: string | null;
  descripcion: string | null;
  acepta_permuta: boolean;
  financiacion: boolean;
  created_at: string;
  show_on_web: boolean;
  created_by_user_id: string;
  web_order?: number;
}

const CATEGORY_CONFIG = [
  { key: 'AUTO',       label: 'Autos',       img: '/slider_front/vw_gol.jpeg' },
  { key: 'PICKUP',     label: 'Pickups',     img: '/slider_front/hilux1.jpg' },
  { key: 'SUV',        label: 'SUVs',        img: '/slider_front/corolla_cross1.jpg' },
  { key: 'UTILITARIO', label: 'Utilitarios', img: '/slider_front/kangoo.jpeg' },
  { key: 'CAMION',     label: 'Camiones',    img: '/slider_front/iveco1.jpg' },
  { key: 'MOTO',       label: 'Motos',       img: '/slider_front/moto.jpg' },
];

const fmtPrice = (v: Vehicle) =>
  `${v.moneda === 'USD' ? 'U$S ' : '$ '}${Number(v.pv || 0).toLocaleString('es-AR')}`;

const waLink = (phone: string | null, vehicle?: Vehicle) => {
  if (!phone) return '#';
  const num = phone.replace(/\D/g, '');
  const text = vehicle
    ? `Hola! Me interesa el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`
    : 'Hola! Quiero más información.';
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

const waVenderLink = (phone: string | null, form: { marca: string; modelo: string; anio: string; descripcion: string }) => {
  if (!phone) return '#';
  const num = phone.replace(/\D/g, '');
  const text = `Hola! Quiero vender mi auto.\n\nMarca: ${form.marca}\nModelo: ${form.modelo}\nAño: ${form.anio}\nDescripción: ${form.descripcion}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

const waBuscarLink = (phone: string | null, form: { marca: string; modelo: string; anio: string; presupuesto: string }) => {
  if (!phone) return '#';
  const num = phone.replace(/\D/g, '');
  const text = `Hola! Estoy buscando mi nuevo auto.\n\nMarca: ${form.marca}\nModelo: ${form.modelo}\nAño: ${form.anio}\nPresupuesto: ${form.presupuesto}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

function normalizeFotosClient(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f: any) => typeof f === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((f: any) => typeof f === 'string');
    } catch { return []; }
  }
  return [];
}

export default function SubdomainClient({ config, initialVehicles }: { config: WebConfig; initialVehicles: Vehicle[] }) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showVenderModal, setShowVenderModal] = useState(false);
  const [showBuscarModal, setShowBuscarModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [venderForm, setVenderForm] = useState({ marca: '', modelo: '', anio: '', descripcion: '' });
  const [buscarForm, setBuscarForm] = useState({ marca: '', modelo: '', anio: '', presupuesto: '' });

  useEffect(() => {
    import('aos').then(AOS => {
      AOS.default.init({
        duration: 500,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60,
        delay: 0,
      });
    });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel(`sub-${config.subdomain}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setVehicles(p => p.filter(v => v.id !== (payload.old as Vehicle).id));
          return;
        }
        const upd = payload.new as Vehicle;
        const isOwn = upd.created_by_user_id === config.user_id;
        setVehicles(p => {
          const known = p.some(v => v.id === upd.id);
          if (!isOwn && !known) return p;
          if (upd.inventory_status === 'pausado' || !upd.show_on_web) return p.filter(v => v.id !== upd.id);
          if (known) return p.map(v => v.id === upd.id ? upd : v);
          return [upd, ...p];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [config.user_id, config.subdomain]);

  const filteredVehicles = useMemo(() => {
    let r = [...vehicles];
    if (search) {
      const q = search.toLowerCase().trim();
      r = r.filter(v => `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(q));
    }
    if (activeCategory) {
      r = r.filter(v => v.categoria?.toUpperCase().trim() === activeCategory.toUpperCase().trim());
    }
    return r;
  }, [vehicles, search, activeCategory]);

  const featuredVehicles = useMemo(() => filteredVehicles.filter(v => v.is_featured), [filteredVehicles]);
  const newVehicles      = useMemo(() => filteredVehicles.filter(v => v.is_new), [filteredVehicles]);

  const handleSelectVehicle = (v: Vehicle) => {
    router.push(`/agencia/${config.subdomain}/vehiculo/${v.id}`);
  };

  const heroImage = config.cover_image_url || '/hero-subdomain.jpg';

  return (
    <div className="min-h-screen bg-[#e2e8f0]" style={{ fontFamily: "'Inter', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:wght@300;400;500;600;700;900&family=Libre+Franklin:wght@400;500;700;900&display=swap');

        [data-aos] { backface-visibility: hidden; }

        .hdr-btn {
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.75);
          font-weight: 900; font-size: 9px;
          text-transform: uppercase; letter-spacing: 1.8px;
          padding: 8px 20px;
          background: rgba(255,255,255,0.05);
          border: none; cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none; white-space: nowrap;
        }
        .hdr-btn:first-child { border-radius: 6px 0 0 6px; border-right: 1px solid rgba(255,255,255,0.12); }
        .hdr-btn:last-child  { border-radius: 0 6px 6px 0; }
        .hdr-btn:hover {
          color: #fff;
          background: rgba(40,139,85,0.18);
          box-shadow: 0 0 16px 2px rgba(40,139,85,0.45), inset 0 0 8px rgba(40,139,85,0.15);
        }

        .vehicle-card {
          transition: transform 0.28s ease-in-out, box-shadow 0.28s ease-in-out;
        }
        .vehicle-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.14);
        }

        .banner-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;
          padding: 10px 22px; border-radius: 4px;
          cursor: pointer; border: none;
          transition: all 0.18s ease;
          text-decoration: none;
        }
        @media (max-width: 640px) {
          .banner-btn { padding: 5px 14px; font-size: 10px; gap: 4px; }
        }
        .banner-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 6px 20px rgba(0,0,0,0.22);
        }
        .banner-btn-outline {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.6) !important;
          color: white;
        }
        .banner-btn-outline:hover { background: rgba(255,255,255,0.1); }
        .banner-btn-solid {
          background: white; color: #1a1a1a;
        }
        .banner-btn-solid:hover { background: #f0f0f0; }

        .franklin-left { 
          font-family: 'Libre Franklin', sans-serif; 
          font-weight: 900;
          display: inline-block;
          transform: scaleX(0.85);
          transform-origin: left;
          letter-spacing: -0.02em;
          line-height: 1.15;
          text-shadow: none;
        }
        .franklin-right { 
          font-family: 'Libre Franklin', sans-serif; 
          font-weight: 900;
          display: inline-block;
          transform: scaleX(0.85);
          transform-origin: right;
          letter-spacing: -0.02em;
          line-height: 1.15;
          text-shadow: none;
        }
        .genos { 
          font-family: 'Genos', sans-serif; 
          font-weight: 500; 
        }

        .banner-overlay-left {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          text-align: left;
          padding-left: 6%;
          padding-right: 6%;
          padding-top: 0;
        }
        @media (min-width: 640px) {
          .banner-overlay-left {
            padding-top: 180px;
            justify-content: center;
          }
        }

        .banner-overlay-right {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          text-align: right;
          padding-left: 6%;
          padding-right: 6%;
          padding-top: 0;
        }
        @media (min-width: 640px) {
          .banner-overlay-right {
            padding-top: 180px;
            justify-content: center;
          }
        }

        .banner-title-left {
          font-size: clamp(22px, 5.5vw, 53px);
        }
        @media (min-width: 640px) {
          .banner-title-left {
            font-size: clamp(24px, 4.5vw, 53px);
          }
        }

        .banner-title-right {
          font-size: clamp(22px, 5.5vw, 53px);
        }
        @media (min-width: 640px) {
          .banner-title-right {
            font-size: clamp(24px, 4.5vw, 53px);
          }
        }

        .banner-subtitle {
          font-size: clamp(17px, 4vw, 26px);
        }
        @media (min-width: 640px) {
          .banner-subtitle {
            font-size: clamp(20px, 2.1vw, 26px);
          }
        }
      `}</style>

      <AnimatePresence>
        {showVenderModal && (
          <VenderModal
            whatsapp={config.whatsapp}
            form={venderForm}
            setForm={setVenderForm}
            onClose={() => setShowVenderModal(false)}
          />
        )}
        {showBuscarModal && (
          <BuscarModal
            whatsapp={config.whatsapp}
            form={buscarForm}
            setForm={setBuscarForm}
            onClose={() => setShowBuscarModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ══ HEADER ══ */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ${
          scrolled
            ? 'bg-[#0b1114]/95 backdrop-blur-md border-b border-white/5 shadow-lg'
            : 'bg-black sm:bg-black/40 backdrop-blur-sm'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 sm:px-8 relative">
          
          <div className="flex sm:hidden">
            <a href="#top" className="hdr-btn !rounded-md !border-none">
              HOME
            </a>
          </div>

          <a href="#top" className="hidden sm:flex items-center shrink-0">
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="h-9 w-auto object-contain" style={{ maxWidth: '140px' }} />
            ) : (
              <span className="text-white/70 text-[11px] font-black uppercase tracking-[3px]">{config.subdomain}</span>
            )}
          </a>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <button onClick={() => setShowVenderModal(true)} className="hdr-btn">Vender mi auto</button>
            <a href={waLink(config.whatsapp)} target="_blank" rel="noopener noreferrer" className="hdr-btn">Contacto</a>
          </div>
          
          <div className="w-[130px] hidden sm:block" />
        </div>
      </motion.header>

      {/* ══ HERO ══ */}
      <section id="top" className="pt-16 sm:pt-0" style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
        <img src={heroImage} alt="Portada" style={{ display: 'block', width: '100%', height: 'auto' }} />
        <div className="hidden sm:block" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to bottom, transparent, #288b55)',
          pointerEvents: 'none',
        }} />
        <div className="block sm:hidden" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to bottom, transparent, #288b55)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* ══ CATEGORÍAS ══ */}
      <div className="bg-[#288b55]">
        <div className="grid grid-cols-3 sm:grid-cols-6 max-w-7xl mx-auto">
          {CATEGORY_CONFIG.map((cat) => {
            const isActive = activeCategory?.toUpperCase() === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(isActive ? null : cat.key);
                  if (!isActive) setTimeout(() => document.getElementById('inventario')?.scrollIntoView({ behavior: 'smooth' }), 150);
                }}
                className={`relative flex flex-col items-center justify-end h-24 sm:h-28 transition-all ${isActive ? 'brightness-75' : 'group'}`}
              >
                <div className="absolute inset-0 bg-[#288b55]" />
                <div className={`absolute inset-0 flex items-center justify-center pb-5 transition-transform duration-500 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}>
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-contain p-3 sm:p-4" />
                </div>
                <div className="relative z-10 pb-2 flex flex-col items-center gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-white tracking-widest drop-shadow-md">{cat.label}</span>
                  {isActive && <div className="w-5 h-0.5 bg-white rounded-full" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ DESTACADOS ══ */}
      {featuredVehicles.length > 0 && (
        <section className="pt-14 pb-2 max-w-7xl mx-auto px-4 sm:px-6" data-aos="fade-up">
          <SectionHeader title="Destacados" accent="#22c55e" />
          <HorizontalSlider vehicles={featuredVehicles} onSelect={handleSelectVehicle} />
        </section>
      )}

      {/* BANNER 1 */}
      <div className="relative w-full overflow-hidden" data-aos="fade-up">
        <picture>
          <source media="(max-width: 640px)" srcSet="/banner_subdomain_2_mobile.png" />
          <img src="/Banner_subdomain_1.png" alt="Banner vender auto" className="w-full h-auto block" />
        </picture>
        <div className="banner-overlay-left">
          <h2 className="franklin-left banner-title-left text-white leading-tight" style={{ marginBottom: 0 }}>
            Vende tu auto más fácil<br />
            ¡Aceptamos financiación!<br />
            Vos cobrás al contado!
          </h2>
          <p className="genos banner-subtitle text-white/90 tracking-wide leading-[1.1] mb-[1%]">
            Nos encargamos de todo el proceso<br />
            y acercamos compradores<br />
            reales listos para cerrar.
          </p>
          <div className="flex gap-3 mt-1 sm:mt-0">
            <button onClick={() => setShowVenderModal(true)} className="banner-btn banner-btn-solid">Vender mi auto</button>
            <button onClick={() => document.getElementById('inventario')?.scrollIntoView({ behavior: 'smooth' })} className="banner-btn banner-btn-outline">Ver autos disponibles</button>
          </div>
        </div>
      </div>

      {/* NUEVOS INGRESOS */}
      {newVehicles.length > 0 && (
        <section className="pt-10 pb-2 max-w-7xl mx-auto px-4 sm:px-6" data-aos="fade-up">
          <SectionHeader title="Nuevos Ingresos" accent="#2596be" />
          <HorizontalSlider vehicles={newVehicles} onSelect={handleSelectVehicle} />
        </section>
      )}

      {/* BANNER 2 */}
      <div className="relative w-full overflow-hidden" data-aos="fade-up">
        <picture>
          <source media="(max-width: 640px)" srcSet="/banner_subdomain_1_mobile.png" />
          <img src="/Banner_subdomain_2.png" alt="Banner buscar auto" className="w-full h-auto block" />
        </picture>
        <div className="banner-overlay-right">
          <h2 className="franklin-right banner-title-right text-white mb-[1.5%]">
            <span className="sm:hidden">
              Tenemos más opciones para<br />
              ayudarte a encontrar<br />
              tu próximo vehículo.
            </span>
            <span className="hidden sm:inline">
              Tenemos más opciones para ayudarte<br />
              a encontrar tu próximo vehículo.
            </span>
          </h2>
          <p className="genos banner-subtitle text-white/90 tracking-wide leading-[1.1] mb-[2%]">
            <span className="sm:hidden">
              Si no ves lo que buscas, dejanos los detalles<br />
              y nos encargamos de encontrar opciones<br />
              a tu medida, sin compromiso.
            </span>
            <span className="hidden sm:inline">
              Si no ves lo que buscas, dejanos los detalles<br />
              y nos encargamos de encontrar opciones<br />
              a tu medida, sin compromiso.
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-1">
            <button onClick={() => setShowBuscarModal(true)} className="banner-btn banner-btn-solid">Buscar mi próximo auto</button>
            <button onClick={() => document.getElementById('inventario')?.scrollIntoView({ behavior: 'smooth' })} className="banner-btn banner-btn-outline">Ver autos disponibles</button>
          </div>
        </div>
      </div>

      {/* INVENTARIO */}
      <section id="inventario" className="pt-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8" data-aos="fade-up">
          <div>
            <h2 className="text-2xl font-black uppercase text-[#0f172a]">
              {activeCategory
                ? CATEGORY_CONFIG.find(c => c.key === activeCategory)?.label ?? 'Inventario'
                : 'Todo el inventario'}
            </h2>
            <p className="text-xs text-gray-500 font-bold">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'unidad disponible' : 'unidades disponibles'}
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-[10px] font-black uppercase px-5 py-2.5 bg-[#0b1114] text-white hover:bg-[#1a1a1a] rounded-sm shadow-md transition-all"
            >
              × Quitar filtro
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredVehicles.map((v, i) => (
            <div key={v.id} data-aos="fade-up" data-aos-delay={Math.min(i % 4, 3) * 60}>
              <VehicleCard vehicle={v} onSelect={handleSelectVehicle} />
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b1114] text-white pt-16 pb-12 border-t border-white/5" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-left">
            
            <div className="bg-[#1a232e] rounded-2xl p-8 border border-white/5 flex flex-col gap-6">
              {config.title && <h3 className="text-2xl font-bold text-white mb-2">{config.title}</h3>}
              <div className="flex flex-col gap-5">
                {config.direccion && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-gray-300 text-[15px] pt-1">{config.direccion}</span>
                  </div>
                )}
                {config.telefono && (
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-gray-300 text-[15px]">{config.telefono}</span>
                  </div>
                )}
                {config.horarios && (
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-gray-300 text-[15px]">{config.horarios}</span>
                  </div>
                )}
                {config.instagram && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#288b55]/20 border border-white/5 transition-all">
                      <Instagram className="w-4 h-4 text-gray-400 group-hover:text-[#288b55]" />
                    </div>
                    <a href={`https://instagram.com/${config.instagram}`} className="text-gray-300 text-[15px] hover:text-[#288b55]">@{config.instagram}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1a232e] rounded-2xl p-8 border border-white/5 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="text-[17px] font-semibold text-gray-200">Web gestionada a través de HotCars</h4>
                <p className="text-sm text-gray-500 font-medium">Plataforma digital para la publicación y gestión de vehículos.</p>
              </div>
              <div className="flex flex-col gap-5 mt-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#288b55] shrink-0" />
                  <span className="text-gray-300 text-sm">Publicación automatizada de tus vehículos en HotCars.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#288b55] shrink-0" />
                  <span className="text-gray-300 text-sm">Gestión multicanal de inventario de vehículos.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#288b55] shrink-0" />
                  <span className="text-gray-300 text-sm">Reportes detallados de rendimiento de vehículos.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-[#1a232e] rounded-2xl p-8 border border-white/5 flex flex-col gap-8 items-center text-center h-full justify-center">
                <h4 className="text-xl font-bold text-white tracking-tight">¿Querés publicar tus vehículos en HotCars?</h4>
                <a 
                  href="https://hotcars.com.ar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#288b55] hover:bg-[#1e6e42] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-[#288b55]/20"
                >
                  Publicar en HotCars →
                </a>
              </div>
              <div className="bg-[#1a232e] rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-2 text-center">
                <span className="text-xs font-bold uppercase tracking-[2px] text-gray-500">Impulsado por HotCars</span>
                <span className="text-[11px] font-medium text-gray-600">Tecnologia para la gestion y venta automotriz</span>
              </div>
            </div>

          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
             <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[2px]">© 2026 {config.subdomain} - Todos los derechos reservados</p>
             <a href="https://hotcars.com.ar" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-[3px] text-gray-700 hover:text-[#288b55] transition-colors">Powered by HotCars</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function VehicleCard({ vehicle: v, onSelect }: { vehicle: Vehicle; onSelect: (v: Vehicle) => void }) {
  const fotos = normalizeFotosClient(v.fotos);
  const mainPhoto = fotos[0] || null;

  return (
    <div
      onClick={() => onSelect(v)}
      className="vehicle-card group bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden shrink-0">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={v.modelo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Car className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow text-left">
        <h3 className="font-black uppercase text-[12px] sm:text-[14px] text-[#0f172a] truncate leading-tight mb-0.5">{v.marca} {v.modelo}</h3>
        {v.version && <p className="text-[9px] sm:text-[10px] font-bold text-[#3483fa] uppercase tracking-wide truncate mb-1">{v.version}</p>}
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-2">{v.anio} • {v.km?.toLocaleString('de-DE')} KM</p>
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="font-black text-[#288b55] text-base sm:text-lg leading-none">{fmtPrice(v)}</span>
          <span className="text-[8px] sm:text-[9px] font-black uppercase bg-[#0f172a] text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors group-hover:bg-[#288b55]">Ver detalle</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accent }} />
      <h2 className="text-xl font-black uppercase tracking-tight text-[#0f172a]">{title}</h2>
    </div>
  );
}

function HorizontalSlider({ vehicles, onSelect }: { vehicles: Vehicle[]; onSelect: (v: Vehicle) => void }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    sliderRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group/slider">
      <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-100 shadow-md items-center justify-center text-gray-600 hover:text-[#288b55] transition-all opacity-0 group-hover/slider:opacity-100 hidden md:flex">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div ref={sliderRef} className="flex gap-4 sm:gap-6 overflow-x-auto pb-6" style={{ scrollbarWidth: 'none' }}>
        {vehicles.map((v) => (
          <div key={v.id} className="min-w-[240px] sm:min-w-[280px] max-w-[280px] shrink-0">
            <VehicleCard vehicle={v} onSelect={onSelect} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-600 hover:text-[#288b55] transition-all opacity-0 group-hover/slider:opacity-100 hidden md:flex">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function VenderModal({ whatsapp, form, setForm, onClose }: {
  whatsapp: string | null;
  form: { marca: string; modelo: string; anio: string; descripcion: string };
  setForm: (f: any) => void;
  onClose: () => void;
}) {
  const valid = form.marca.trim() && form.modelo.trim() && form.anio.trim();
  const send = () => {
    if (!valid || !whatsapp) return;
    window.open(waVenderLink(whatsapp, form), '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0b1114] rounded-xl w-full max-w-md p-8 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black uppercase tracking-widest text-white">Vender mi auto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="flex flex-col gap-4 text-left">
          {[
            { label: 'Marca *', key: 'marca', placeholder: 'Ej: Toyota' },
            { label: 'Modelo *', key: 'modelo', placeholder: 'Ej: Corolla' },
            { label: 'Año *', key: 'anio', placeholder: 'Ej: 2022' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">{label}</label>
              <input
                className="w-full border border-white/10 p-4 rounded-lg outline-none focus:border-[#288b55] transition-all bg-white/5 font-bold uppercase text-[11px] text-white placeholder:text-gray-700"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">Descripción</label>
            <textarea
              className="w-full border border-white/10 p-4 rounded-lg outline-none focus:border-[#288b55] transition-all bg-white/5 font-bold uppercase text-[11px] text-white placeholder:text-gray-700 resize-none"
              placeholder="Estado general, kms, etc..."
              rows={3}
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <button
            onClick={send}
            disabled={!valid || !whatsapp}
            className="w-full bg-[#288b55] py-4 rounded-lg font-black uppercase text-[11px] text-white tracking-[2px] transition-all hover:bg-[#1e6e42] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#288b55]/20 mt-4 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function BuscarModal({ whatsapp, form, setForm, onClose }: {
  whatsapp: string | null;
  form: { marca: string; modelo: string; anio: string; presupuesto: string };
  setForm: (f: any) => void;
  onClose: () => void;
}) {
  const valid = form.marca.trim() && form.modelo.trim() && form.anio.trim();
  const send = () => {
    if (!valid || !whatsapp) return;
    window.open(waBuscarLink(whatsapp, form), '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0b1114] rounded-xl w-full max-w-md p-8 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black uppercase tracking-widest text-white">Buscar mi nuevo auto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="flex flex-col gap-4 text-left">
          {[
            { label: 'Marca *', key: 'marca', placeholder: 'Ej: Toyota' },
            { label: 'Modelo *', key: 'modelo', placeholder: 'Ej: Corolla' },
            { label: 'Año *', key: 'anio', placeholder: 'Ej: 2022' },
            { label: 'Presupuesto *', key: 'presupuesto', placeholder: 'Ej: U$S 15.000' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">{label}</label>
              <input
                className="w-full border border-white/10 p-4 rounded-lg outline-none focus:border-[#288b55] transition-all bg-white/5 font-bold uppercase text-[11px] text-white placeholder:text-gray-700"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <button
            onClick={send}
            disabled={!valid || !whatsapp}
            className="w-full bg-[#288b55] py-4 rounded-lg font-black uppercase text-[11px] text-white tracking-[2px] transition-all hover:bg-[#1e6e42] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#288b55]/20 mt-4 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}