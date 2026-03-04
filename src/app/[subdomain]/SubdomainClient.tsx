'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageCircle, MapPin, Clock, Phone,
  Instagram, Facebook, Share2, ChevronLeft, ChevronRight, ChevronDown,
  X, RefreshCw, Handshake, ShieldAlert, AlertCircle
} from 'lucide-react';

/* ─────────────── SUPABASE CLIENT (browser) ─────────────── */
const supabase = createClient(
  'https://xkwkgcjgxjvidiwthwbr.supabase.co',
  'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'
);

/* ─────────────── TYPES ─────────────── */
interface WebConfig {
  user_id: string;
  subdomain: string;
  title: string | null;
  subtitle: string | null;
  cover_image_url: string | null;
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
  fotos: string[];
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
}

/* ─────────────── CATEGORY CONFIG ─────────────── */
const CATEGORY_CONFIG = [
  { key: 'Autos',       label: 'Autos',       img: '/slider_front/vw_gol.jpeg' },
  { key: 'Pickups',     label: 'Pickups',     img: '/slider_front/hilux1.jpg' },
  { key: 'SUVs',        label: 'SUVs',        img: '/slider_front/corolla_cross1.jpg' },
  { key: 'Utilitarios', label: 'Utilitarios', img: '/slider_front/kangoo.jpeg' },
  { key: 'Camiones',    label: 'Camiones',    img: '/slider_front/iveco1.jpg' },
  { key: 'Motos',       label: 'Motos',       img: '/slider_front/moto.jpg' },
];

/* ─────────────── HELPERS ─────────────── */
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

/* ─────────────── MAIN CLIENT COMPONENT ─────────────── */
export default function SubdomainClient({
  config,
  initialVehicles,
}: {
  config: WebConfig;
  initialVehicles: Vehicle[];
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const categoryStripRef = useRef<HTMLDivElement>(null);

  /* ── Realtime: escucha cambios en inventario del dueño ── */
  useEffect(() => {
    const channel = supabase
      .channel(`subdomain-${config.subdomain}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventario',
          filter: `created_by_user_id=eq.${config.user_id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setVehicles(prev => prev.filter(v => v.id !== payload.old.id));
            return;
          }

          const updated = payload.new as Vehicle;

          // Si se pausó o se ocultó de la web → quitar
          if (
            updated.inventory_status === 'pausado' ||
            updated.show_on_web === false
          ) {
            setVehicles(prev => prev.filter(v => v.id !== updated.id));
            return;
          }

          // INSERT o UPDATE visible
          setVehicles(prev => {
            const exists = prev.find(v => v.id === updated.id);
            if (exists) {
              return prev.map(v => v.id === updated.id ? updated : v);
            }
            return [updated, ...prev];
          });

          // Si el vehículo seleccionado en el modal fue modificado → actualizar
          setSelectedVehicle(prev =>
            prev?.id === updated.id ? updated : prev
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [config.user_id, config.subdomain]);

  /* ── Click fuera del strip → deselect categoría ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (categoryStripRef.current && !categoryStripRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Lock scroll cuando modal abierto ── */
  useEffect(() => {
    document.body.style.overflow = selectedVehicle ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedVehicle]);

  const newVehicles      = useMemo(() => vehicles.filter(v => v.is_new), [vehicles]);
  const featuredVehicles = useMemo(() => vehicles.filter(v => v.is_featured), [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (search) result = result.filter(v =>
      `${v.marca} ${v.modelo}`.toLowerCase().includes(search.toLowerCase())
    );
    if (activeCategory) result = result.filter(v =>
      (v.categoria || '').toLowerCase() === activeCategory.toLowerCase()
    );
    return result;
  }, [vehicles, search, activeCategory]);

  const hasHeroText = !!(config.title || config.subtitle);
  const heroImage   = config.cover_image_url || '/hero-subdomain.jpg';

  return (
    <div className="min-h-screen bg-[#ebebeb]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ════ VEHICLE DETAIL MODAL ════ */}
      <AnimatePresence>
        {selectedVehicle && (
          <VehicleDetailModal
            vehicle={selectedVehicle}
            whatsapp={config.whatsapp}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </AnimatePresence>

      {/* ════ HEADER ════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b1114]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <a href="#top" className="shrink-0 flex items-center gap-2">
            <div className="w-7 h-7 bg-[#22c55e] rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm"/>
            </div>
            <span className="text-white font-black text-xs uppercase tracking-[4px] hidden sm:block">Inicio</span>
          </a>
          <div className="flex-1 max-w-sm mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"/>
            <input
              type="text"
              placeholder="Buscar marca o modelo..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (e.target.value) setTimeout(() => document.getElementById('inventario')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="w-full bg-white/6 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#22c55e]/60 transition-all"
            />
          </div>
          <a
            href={waLink(config.whatsapp)}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-black font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full transition-all shadow-lg shadow-[#22c55e]/25 hover:shadow-[#22c55e]/40"
          >
            <MessageCircle className="w-3.5 h-3.5"/>
            <span className="hidden sm:block">Contacto</span>
          </a>
        </div>
      </header>

      {/* ════ HERO ════ */}
      <section id="top" className="relative w-full h-screen overflow-hidden">
        <motion.div
          initial={{ scale: 1.07 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover"/>
        </motion.div>
        {hasHeroText && <div className="absolute inset-0 bg-black/42"/>}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#ebebeb] to-transparent"/>
        {hasHeroText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {config.title && (
              <motion.h1
                initial={{ opacity: 0, y: 55 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-white font-black italic uppercase leading-[0.88] text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight drop-shadow-2xl"
              >
                {config.title}
              </motion.h1>
            )}
            {config.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/80 text-base sm:text-lg mt-4 max-w-xl tracking-wide font-medium"
              >
                {config.subtitle}
              </motion.p>
            )}
            <motion.a
              href="#inventario"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-8 inline-flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase text-xs tracking-widest px-8 py-3.5 rounded-full transition-all shadow-xl shadow-[#22c55e]/30 hover:shadow-[#22c55e]/50"
            >
              Ver inventario <ChevronDown className="w-4 h-4"/>
            </motion.a>
          </div>
        )}
        {!hasHeroText && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.6 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2"
          >
            <motion.div animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
              <ChevronDown className="w-6 h-6 text-white"/>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ════ CATEGORY STRIP ════ */}
      <div ref={categoryStripRef} className="bg-[#288b54] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex sm:grid sm:grid-cols-6 min-w-max sm:min-w-0 max-w-7xl mx-auto">
          {CATEGORY_CONFIG.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(isActive ? null : cat.key);
                  if (!isActive) setTimeout(() => document.getElementById('inventario')?.scrollIntoView({ behavior: 'smooth' }), 150);
                }}
                className={`relative flex flex-col items-center justify-end overflow-hidden min-w-[130px] sm:min-w-0 h-28 transition-all duration-300 outline-none group ${isActive ? 'brightness-[0.8]' : ''}`}
              >
                <div className="absolute inset-0 bg-[#288b54]"/>
                <div className={`absolute inset-0 flex items-center justify-center pb-5 transition-transform duration-500 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}>
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-contain" style={{ padding: '6px 8px 24px' }}/>
                </div>
                <div className={`absolute inset-0 bg-[#288b54] transition-opacity duration-300 ${isActive ? 'opacity-45' : 'opacity-10 group-hover:opacity-0'}`}/>
                <div className="relative z-10 pb-2.5 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[2.5px] text-white drop-shadow-md">{cat.label}</span>
                  {isActive && <div className="w-5 h-0.5 bg-white rounded-full"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════ DESTACADOS ════ */}
      {featuredVehicles.length > 0 && (
        <section className="pt-14 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader title="Destacados" accent="#22c55e" />
            <HorizontalSlider vehicles={featuredVehicles} whatsapp={config.whatsapp} large onSelect={setSelectedVehicle} />
          </div>
        </section>
      )}

      {/* ════ NUEVOS INGRESOS ════ */}
      {newVehicles.length > 0 && (
        <section className="pt-12 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader title="Nuevos Ingresos" accent="#3b82f6" />
            <HorizontalSlider vehicles={newVehicles} whatsapp={config.whatsapp} onSelect={setSelectedVehicle} />
          </div>
        </section>
      )}

      {/* ════ INVENTARIO GRID ════ */}
      <section id="inventario" className="pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#111]">
                {activeCategory ?? 'Todo el inventario'}
              </h2>
              <p className="text-xs text-[#888] font-semibold mt-0.5">
                {filteredVehicles.length} {filteredVehicles.length === 1 ? 'unidad disponible' : 'unidades disponibles'}
              </p>
            </div>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-[10px] font-black uppercase tracking-wider text-[#555] border border-[#ccc] px-3 py-1.5 rounded-full hover:border-[#22c55e] hover:text-[#22c55e] transition-all"
              >
                × Quitar filtro
              </button>
            )}
          </div>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-3">🚗</div>
              <p className="text-[#aaa] font-black uppercase tracking-widest text-xs">Sin unidades disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredVehicles.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} whatsapp={config.whatsapp} index={i} onSelect={setSelectedVehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="bg-[#0b1114] text-white">
        <div className="h-1 bg-[#22c55e]"/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500 mb-5">Contacto</p>
            <div className="flex flex-col gap-4">
              {config.direccion && <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5"/><span className="text-sm text-slate-300">{config.direccion}</span></div>}
              {config.telefono  && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#22c55e] shrink-0"/><span className="text-sm text-slate-300">{config.telefono}</span></div>}
              {config.horarios  && <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-[#22c55e] shrink-0"/><span className="text-sm text-slate-300">{config.horarios}</span></div>}
              {config.whatsapp  && (
                <a href={waLink(config.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-full w-fit transition-all shadow-lg shadow-[#22c55e]/20">
                  <MessageCircle className="w-3.5 h-3.5"/> WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-8">
            {config.show_socials_footer && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500 mb-4">Seguinos</p>
                <div className="flex gap-3">
                  {config.instagram && <SocialBtn href={`https://instagram.com/${config.instagram}`} icon={<Instagram className="w-4 h-4"/>}/>}
                  {config.facebook  && <SocialBtn href={`https://facebook.com/${config.facebook}`}  icon={<Facebook className="w-4 h-4"/>}/>}
                  {config.tiktok    && <SocialBtn href={`https://tiktok.com/@${config.tiktok}`}     icon={<Share2 className="w-4 h-4"/>}/>}
                  {config.whatsapp  && <SocialBtn href={waLink(config.whatsapp)} icon={<MessageCircle className="w-4 h-4"/>} green/>}
                </div>
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-700">
              Powered by{' '}
              <a href="https://hotcars.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-[#22c55e] transition-colors">HotCars</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── SECTION HEADER ─────────────── */
function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accent }}/>
      <h2 className="text-xl font-black uppercase tracking-tight text-[#111]">{title}</h2>
    </div>
  );
}

/* ─────────────── HORIZONTAL SLIDER ─────────────── */
function HorizontalSlider({
  vehicles, whatsapp, large = false, onSelect
}: {
  vehicles: Vehicle[]; whatsapp: string | null; large?: boolean; onSelect: (v: Vehicle) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * (large ? 900 : 620), behavior: 'smooth' });

  return (
    <div className="relative group/slider">
      <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-white border border-[#ddd] shadow-md flex items-center justify-center text-[#444] hover:border-[#22c55e] hover:text-[#22c55e] transition-all opacity-0 group-hover/slider:opacity-100">
        <ChevronLeft className="w-4 h-4"/>
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {vehicles.map((v, i) => (
          <div key={v.id} className={large ? 'min-w-[calc(33.333%-11px)] max-w-[calc(33.333%-11px)] shrink-0' : 'min-w-[270px] max-w-[270px] shrink-0'}>
            <VehicleCard vehicle={v} whatsapp={whatsapp} index={i} large={large} onSelect={onSelect} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-white border border-[#ddd] shadow-md flex items-center justify-center text-[#444] hover:border-[#22c55e] hover:text-[#22c55e] transition-all opacity-0 group-hover/slider:opacity-100">
        <ChevronRight className="w-4 h-4"/>
      </button>
    </div>
  );
}

/* ─────────────── VEHICLE CARD ─────────────── */
function VehicleCard({
  vehicle: v, whatsapp, index, large = false, onSelect
}: {
  vehicle: Vehicle; whatsapp: string | null; index: number; large?: boolean; onSelect: (v: Vehicle) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.35) }}
      onClick={() => onSelect(v)}
      className="group bg-white rounded-xl overflow-hidden border border-[#e0e0e0] hover:border-[#22c55e]/40 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className={`relative overflow-hidden bg-[#f5f5f5] ${large ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        {!imgLoaded && <div className="absolute inset-0 bg-[#ececec] animate-pulse"/>}
        <img
          src={v.fotos?.[0] || '/placeholder.jpg'}
          alt={`${v.marca} ${v.modelo}`}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <h3 className="font-black uppercase text-[13px] tracking-tight text-[#1a1a1a] leading-tight truncate">{v.marca} {v.modelo}</h3>
          <span className="text-[12px] font-bold text-[#555] shrink-0">{v.anio}</span>
        </div>
        <p className="text-[11px] font-bold text-[#888] uppercase tracking-tight mb-1">{v.km?.toLocaleString('es-AR')} KM</p>
        {v.version && <p className="text-[10px] font-bold text-[#3483fa] uppercase tracking-wide truncate mb-1">{v.version}</p>}
        {v.localidad && (
          <div className="flex items-center gap-1 text-[#aaa] mb-2">
            <MapPin className="w-3 h-3 shrink-0"/>
            <span className="text-[10px] font-semibold truncate">{v.localidad}</span>
          </div>
        )}
        <div className="border-t border-[#f0f0f0] my-2"/>
        <div className="flex items-center justify-between">
          <span className={`font-black text-[#22c55e] leading-none ${large ? 'text-xl' : 'text-lg'}`}>{fmtPrice(v)}</span>
          <button
            onClick={e => { e.stopPropagation(); onSelect(v); }}
            className="text-[9px] font-black uppercase tracking-widest bg-[#0b1114] hover:bg-[#22c55e] text-white hover:text-black px-3 py-1.5 rounded transition-all duration-200"
          >
            Ver detalle
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── VEHICLE DETAIL MODAL ─────────────── */
function VehicleDetailModal({
  vehicle: v, whatsapp, onClose
}: {
  vehicle: Vehicle; whatsapp: string | null; onClose: () => void;
}) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const publishDate = new Date(v.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const wa = waLink(whatsapp, v);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all">
          <X className="w-4 h-4 text-[#333]"/>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Galería */}
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row p-4 gap-3 md:h-[500px]">
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-14 shrink-0" style={{ scrollbarWidth: 'none' }}>
              {v.fotos?.map((foto, idx) => (
                <button key={idx} onClick={() => setSelectedImg(idx)}
                  className={`shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${selectedImg === idx ? 'border-[#22c55e]' : 'border-[#e5e5e5] hover:border-[#aaa]'}`}>
                  <img src={foto} className="w-full h-full object-cover" alt=""/>
                </button>
              ))}
            </div>
            <div
              className="flex-1 relative flex items-center justify-center bg-[#f8f8f8] rounded-xl overflow-hidden cursor-zoom-in min-h-[220px]"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img src={v.fotos?.[selectedImg]} alt={`${v.marca} ${v.modelo}`} className="max-w-full max-h-full object-contain"/>
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#f0f0f0] p-6 flex flex-col gap-4">
            <div className="text-[11px] text-[#aaa] font-bold uppercase tracking-wide">{v.categoria} · Publicado el {publishDate}</div>
            <div>
              <h2 className="text-2xl font-black text-[#1a1a1a] leading-tight">{v.marca} {v.modelo}</h2>
              {v.version && <p className="text-[#3483fa] font-bold text-sm uppercase tracking-wide mt-0.5">{v.version}</p>}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#666] uppercase">
              <span className="bg-[#f5f5f5] px-2.5 py-1 rounded">{v.anio}</span>
              <span className="bg-[#f5f5f5] px-2.5 py-1 rounded">{v.km?.toLocaleString('es-AR')} km</span>
              {v.localidad && <span className="bg-[#f5f5f5] px-2.5 py-1 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/>{v.localidad}</span>}
            </div>
            {(v.inventory_status === 'reservado' || v.inventory_status === 'vendido') && (
              <div className="flex gap-2">
                {v.inventory_status === 'reservado' && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-2.5 py-1 rounded uppercase">Reservado</span>}
                {v.inventory_status === 'vendido'   && <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded uppercase">Vendido</span>}
              </div>
            )}
            <div className="py-3 border-y border-[#f0f0f0]">
              <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">{fmtPrice(v)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-tight ${v.acepta_permuta ? 'border-[#ddd] text-[#333]' : 'border-[#f0f0f0] text-[#ccc]'}`}>
                <RefreshCw className="w-3.5 h-3.5"/> Permuta
              </div>
              <div className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-tight ${v.financiacion ? 'border-[#ddd] text-[#333]' : 'border-[#f0f0f0] text-[#ccc]'}`}>
                <Handshake className="w-3.5 h-3.5"/> Financiación
              </div>
            </div>
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#22c55e]/20 hover:shadow-[#22c55e]/40">
              <MessageCircle className="w-4 h-4"/> Contactar por WhatsApp
            </a>
          </div>
        </div>

        {/* Descripción + Características + Seguridad */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 border-t border-[#f0f0f0]">
          <div className="md:col-span-8 flex flex-col gap-5">
            {v.descripcion && (
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-[#111] mb-3">Descripción</h3>
                <p className="text-sm text-[#555] leading-relaxed whitespace-pre-line font-medium">{v.descripcion}</p>
              </div>
            )}
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-[#111] mb-3">Características</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {[
                  { l: 'Marca',      v: v.marca },
                  { l: 'Modelo',     v: v.modelo },
                  { l: 'Año',        v: String(v.anio) },
                  { l: 'Kilómetros', v: `${v.km?.toLocaleString('es-AR')} km` },
                  { l: 'Versión',    v: v.version || '—' },
                  { l: 'Categoría',  v: v.categoria || '—' },
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-[#f0f0f0] pb-2">
                    <span className="text-[10px] font-black text-[#aaa] uppercase tracking-widest block">{item.l}</span>
                    <span className="text-[13px] font-bold text-[#333] mt-0.5 block">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-5">
              <h4 className="font-black text-sm uppercase tracking-tight text-[#111] mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500"/> Consejos de seguridad
              </h4>
              <ul className="flex flex-col gap-3 text-[12px] text-[#666] font-medium">
                <li className="flex gap-2"><div className="w-1 h-1 bg-[#aaa] rounded-full mt-1.5 shrink-0"/>Nunca pagues anticipos sin ver el vehículo.</li>
                <li className="flex gap-2"><div className="w-1 h-1 bg-[#aaa] rounded-full mt-1.5 shrink-0"/>Verificá la documentación antes de cerrar.</li>
                <li className="flex gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                  <span>Ante cualquier duda, contactá directamente a la agencia.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setIsGalleryOpen(false)}
          >
            <button onClick={() => setIsGalleryOpen(false)} className="absolute top-5 right-5 text-white p-2 hover:bg-white/10 rounded-full z-[210]">
              <X className="w-7 h-7"/>
            </button>
            <img src={v.fotos?.[selectedImg]} alt="Galería" className="max-w-full max-h-[90vh] object-contain shadow-2xl" onClick={e => e.stopPropagation()}/>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────── SOCIAL BUTTON ─────────────── */
function SocialBtn({ href, icon, green }: { href: string; icon: React.ReactNode; green?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
        green ? 'border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/10' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'
      }`}>
      {icon}
    </a>
  );
}
