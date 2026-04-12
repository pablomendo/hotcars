'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Handshake, ChevronLeft, ChevronRight,
  X, Loader2, Link, Phone, Navigation, Share2, Car
} from 'lucide-react';

// ─── Mapa ─────────────────────────────────────────────────────────────────────

function VehicleMapInner({ localidad, provincia }: { localidad: string; provincia: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = `${localidad}, ${provincia}, Argentina`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'HotCars/1.0' },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        else setError(true);
      })
      .catch(() => setError(true));
  }, [localidad, provincia]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then(L => {
      const Leaflet = L.default;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); }
      const map = Leaflet.map(mapRef.current!, { scrollWheelZoom: false, zoomControl: true, attributionControl: false })
        .setView([coords.lat, coords.lng], 13);
      mapInstanceRef.current = map;
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      Leaflet.marker([coords.lat, coords.lng]).addTo(map);
      setTimeout(() => map.invalidateSize(), 300);
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [coords]);

  if (error) return <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 text-sm">No se pudo cargar el mapa</div>;
  if (!coords) return <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl"><Loader2 className="animate-spin text-gray-300 w-6 h-6" /></div>;
  return <div ref={mapRef} className="relative z-10" style={{ height: '100%', width: '100%' }} />;
}

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.428a.5.5 0 00.609.61l5.71-1.494A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.51-5.17-1.4l-.37-.22-3.389.887.896-3.293-.242-.381A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
);

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ vehicle, onClose }: { vehicle: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea');
      el.value = url; el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black uppercase text-[13px] tracking-widest text-gray-400">Compartir publicación</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank')} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all text-left">
            <span className="text-[#25d366]"><WhatsAppIcon /></span>
            <span className="font-bold text-[14px] text-[#1e293b]">WhatsApp</span>
          </button>
          <button onClick={copyLink} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all text-left">
            <span className="text-[#1e293b]"><Link size={20} /></span>
            <span className="font-bold text-[14px] text-[#1e293b]">{copied ? '¡Copiado!' : 'Copiar link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ rv, onClick }: { rv: any; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-[200px] sm:w-[220px] text-left rounded-[8px] overflow-hidden border border-gray-200 bg-white shadow-sm transition-all flex flex-col cursor-pointer"
      style={{ boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-full h-[130px] bg-gray-100 overflow-hidden">
        <img src={rv.fotos?.[0]} alt={rv.modelo} className="w-full h-full object-cover transition-transform duration-500" style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <p className="text-[12px] font-black text-[#1e293b] leading-tight truncate uppercase">{rv.marca} {rv.modelo}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#333] font-bold">{rv.anio}</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] text-[#333] font-bold">{Number(rv.km).toLocaleString('de-DE')} km</span>
        </div>
        <p className="text-[15px] font-black text-[#1e293b] mt-auto pt-2">{rv.moneda === 'USD' ? 'U$S' : '$'} {Number(rv.pv).toLocaleString('de-DE')}</p>
      </div>
    </button>
  );
}

// ─── Horizontal Slider ────────────────────────────────────────────────────────

function HorizontalSlider({ title, vehicles, router, slug }: { title: string; vehicles: any[]; router: any; slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (ref.current) ref.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };
  if (!vehicles.length) return null;
  return (
    <div className="bg-white md:border md:border-gray-200 md:rounded-md md:shadow-sm px-4 md:px-6 pt-5 pb-5 relative group">
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">{title}</p>
      <div className="relative">
        <button onClick={() => scroll('left')} className="absolute left-[-18px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-100 rounded-full hidden md:flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all">
          <ChevronLeft size={20} className="text-[#3483fa]" />
        </button>
        <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
          {vehicles.map(rv => (
            <div key={rv.id} className="snap-start flex-shrink-0">
              <VehicleCard rv={rv} onClick={() => router.push(`/agencia/${slug}/vehiculo/${rv.id}`)} />
            </div>
          ))}
        </div>
        <button onClick={() => scroll('right')} className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-100 rounded-full hidden md:flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all">
          <ChevronRight size={20} className="text-[#3483fa]" />
        </button>
      </div>
    </div>
  );
}

// ─── Mobile Image Carousel ────────────────────────────────────────────────────

function MobileCarousel({ fotos, onOpenGallery }: { fotos: string[]; onOpenGallery: (idx: number) => void }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setCurrent(c => (c - 1 + fotos.length) % fotos.length);
  const next = () => setCurrent(c => (c + 1) % fotos.length);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!fotos.length) return (
    <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
      <Car className="w-12 h-12 text-gray-300" />
    </div>
  );

  return (
    <div
      className="relative w-full bg-black overflow-hidden"
      style={{ aspectRatio: '4/3' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={fotos[current]}
        alt=""
        className="w-full h-full object-contain"
        onClick={() => onOpenGallery(current)}
      />
      {fotos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {current + 1}/{fotos.length}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [ownerVehicles, setOwnerVehicles] = useState<any[]>([]);
  const [webConfig, setWebConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showVenderModal, setShowVenderModal] = useState(false);
  const [venderForm, setVenderForm] = useState({ marca: '', modelo: '', anio: '', descripcion: '' });
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: cv, error: vErr } = await supabase.from('inventario').select('*').eq('id', vehicleId).single();
      if (vErr) throw vErr;
      setVehicle(cv);
      if (cv) {
        const [webRes, ownedRes] = await Promise.all([
          supabase.from('web_configs').select('*').eq('subdomain', slug).single(),
          supabase.from('inventario').select('*', { count: 'exact' }).eq('owner_user_id', cv.owner_user_id).eq('inventory_status', 'activo').neq('id', vehicleId).order('created_at', { ascending: false })
        ]);
        setWebConfig(webRes.data);
        setOwnerVehicles(ownedRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, slug]);

  useEffect(() => { if (vehicleId) fetchData(); }, [fetchData, vehicleId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
      <Loader2 className="animate-spin text-[#288b55] w-8 h-8" />
    </div>
  );
  if (!vehicle) return null;

  const fotos = vehicle.fotos || [];
  const waUrl = `https://wa.me/${webConfig?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Me interesa el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} que vi en tu web.`)}`;
  const waVenderUrl = `https://wa.me/${webConfig?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Quiero vender mi auto.\n\nMarca: ${venderForm.marca}\nModelo: ${venderForm.modelo}\nAño: ${venderForm.anio}\nDescripción: ${venderForm.descripcion}`)}`;
  const mapsQuery = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vehicle.localidad}, ${vehicle.provincia}, Argentina`)}`;

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333] pb-24 md:pb-12 font-sans overflow-x-hidden relative">
      {isShareOpen && <ShareModal vehicle={vehicle} onClose={() => setIsShareOpen(false)} />}

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-[100] h-16 flex items-center justify-between px-4 sm:px-8 transition-all duration-500 ${scrolled ? 'bg-[#0b1114]/95 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-[#0b1114]/80 backdrop-blur-sm'}`}>
        <div className="flex items-center shrink-0 cursor-pointer" onClick={() => router.push(`/agencia/${slug}`)}>
          {webConfig?.logo_url ? (
            <img src={webConfig.logo_url} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <span className="text-white font-black uppercase text-[11px] tracking-[3px] opacity-70">{slug}</span>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button onClick={() => setShowVenderModal(true)} className="flex items-center justify-center text-white font-black text-[9px] uppercase tracking-[1.5px] px-4 sm:px-6 py-2.5 border border-white/20 hover:border-[#288b55] transition-all bg-transparent hover:bg-[#288b55]/10 rounded-sm">
            Vender mi auto
          </button>
          <a href={`https://wa.me/${webConfig?.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-white font-black text-[9px] uppercase tracking-[1.5px] px-4 sm:px-6 py-2.5 border border-white/20 hover:border-[#288b55] transition-all bg-transparent hover:bg-[#288b55]/10 rounded-sm">
            Contacto
          </a>
        </div>
        <div className="w-[80px] sm:w-[130px] hidden sm:block" />
      </header>

      {/* MODAL VENDER */}
      <AnimatePresence>
        {showVenderModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVenderModal(false)}>
            <div className="bg-[#0b1114] rounded-xl w-full max-w-md p-8 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase tracking-widest text-white">Vender mi auto</h3>
                <button onClick={() => setShowVenderModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex flex-col gap-4">
                <input className="w-full border border-white/10 p-4 rounded-lg bg-white/5 text-white text-[11px] uppercase outline-none focus:border-[#288b55]" placeholder="Marca" onChange={e => setVenderForm({...venderForm, marca: e.target.value})} />
                <input className="w-full border border-white/10 p-4 rounded-lg bg-white/5 text-white text-[11px] uppercase outline-none focus:border-[#288b55]" placeholder="Modelo" onChange={e => setVenderForm({...venderForm, modelo: e.target.value})} />
                <input className="w-full border border-white/10 p-4 rounded-lg bg-white/5 text-white text-[11px] uppercase outline-none focus:border-[#288b55]" placeholder="Año" onChange={e => setVenderForm({...venderForm, anio: e.target.value})} />
                <textarea className="w-full border border-white/10 p-4 rounded-lg bg-white/5 text-white text-[11px] uppercase outline-none focus:border-[#288b55] resize-none" rows={3} placeholder="Descripción" onChange={e => setVenderForm({...venderForm, descripcion: e.target.value})} />
                <button onClick={() => { window.open(waVenderUrl, '_blank'); setShowVenderModal(false); }} className="w-full bg-[#288b55] py-4 rounded-lg font-black uppercase text-[11px] text-white tracking-[2px] hover:bg-[#1e6e42]">Enviar por WhatsApp</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MOBILE LAYOUT (< md) ══ */}
      <div className="block md:hidden">

        {/* Carousel full width pegado al header */}
        <div className="mt-16">
          <MobileCarousel
            fotos={fotos}
            onOpenGallery={(idx) => { setSelectedImageIndex(idx); setIsGalleryOpen(true); }}
          />
        </div>

        {/* Info card */}
        <div className="bg-white px-4 pt-5 pb-6">
          <p className="text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
            {vehicle.anio} · {Number(vehicle.km).toLocaleString('de-DE')} km
          </p>
          <h1 className="text-[22px] font-black text-[#0f172a] leading-tight uppercase">
            {vehicle.marca} {vehicle.modelo}
          </h1>
          {vehicle.version && (
            <p className="text-[12px] font-bold text-[#3483fa] uppercase mt-0.5">{vehicle.version}</p>
          )}
          <p className="text-[30px] font-black text-[#0f172a] mt-3 leading-none">
            {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicle.acepta_permuta && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-[10px] font-black uppercase tracking-wider">
                <RefreshCw size={11} /> Acepta Permuta
              </div>
            )}
            {vehicle.financiacion && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-green-700 text-[10px] font-black uppercase tracking-wider">
                <Handshake size={11} /> Apto Financiación
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white mt-2 px-4 py-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Descripción</h3>
          <p className="text-[15px] text-[#555] whitespace-pre-line leading-relaxed">
            {vehicle.descripcion || 'Sin descripción adicional.'}
          </p>
        </div>

        {/* Ubicación */}
        {vehicle.localidad && (
          <div className="bg-white mt-2 px-4 py-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Ubicación</h3>
            <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: '200px' }}>
              <VehicleMapInner localidad={vehicle.localidad} provincia={vehicle.provincia} />
            </div>
            <p className="text-[10px] font-bold text-center mt-2 text-gray-400 uppercase">
              {vehicle.localidad}, {vehicle.provincia}
            </p>
            <a href={mapsQuery} target="_blank" rel="noopener noreferrer"
              className="mt-3 w-full py-3 flex items-center justify-center gap-2 text-white font-black uppercase text-[12px] tracking-widest rounded-xl bg-[#1e293b] hover:bg-[#334155]">
              <Navigation size={15} /> Cómo llegar
            </a>
          </div>
        )}

        {/* Más unidades */}
        {ownerVehicles.length > 0 && (
          <div className="mt-2">
            <HorizontalSlider title="Más unidades de esta agencia" vehicles={ownerVehicles} router={router} slug={slug} />
          </div>
        )}
      </div>

      {/* ══ DESKTOP LAYOUT (>= md) ══ */}
      <div className="hidden md:block max-w-[1200px] mx-auto mt-[80px] px-4">
        <div className="flex items-center gap-2 py-4 text-[13px] text-[#3483fa]">
          <button onClick={() => router.push(`/agencia/${slug}`)} className="hover:underline">Volver al listado</button>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-500 uppercase">{vehicle.marca} {vehicle.modelo}</span>
        </div>

        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden grid grid-cols-12">
          {/* Galería */}
          <section className="col-span-8 p-4 flex flex-row gap-4">
            <div className="flex flex-col gap-2 w-16">
              {fotos.map((foto: string, idx: number) => (
                <button key={idx} onClick={() => setSelectedImageIndex(idx)}
                  className={`w-12 h-12 rounded border-2 overflow-hidden ${selectedImageIndex === idx ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                  <img src={foto} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
            <div
              className="flex-1 bg-gray-50 flex items-center justify-center rounded-lg overflow-hidden cursor-crosshair h-[500px] relative"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsGalleryOpen(true)}
            >
              <img src={fotos[selectedImageIndex]} className="w-full h-full object-cover" alt="" />
            </div>
          </section>

          {/* Info lateral */}
          <section className="col-span-4 border-l border-gray-100 p-6 flex flex-col relative">
            <p className="text-[13px] font-bold text-gray-400 mb-1">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</p>
            <h1 className="text-2xl font-bold text-[#333] leading-tight mb-4">{vehicle.marca} {vehicle.modelo}</h1>
            <div className="mb-8">
              <span className="text-4xl font-black text-[#1e293b]">
                {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="w-full py-4 bg-[#288b55] text-white rounded-[10px] font-black text-[14px] uppercase text-center flex items-center justify-center gap-2 shadow-lg shadow-[#288b55]/20 transition-all hover:bg-[#1e6e42]">
                <Phone size={18} /> WhatsApp
              </a>
              <button onClick={() => setIsShareOpen(true)}
                className="w-full py-4 border border-gray-200 rounded-[10px] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                <Share2 size={18} /> Compartir
              </button>
            </div>
            <div className="mt-6 flex-grow flex flex-col overflow-hidden">
              <AnimatePresence>
                {isZooming && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full aspect-square rounded-xl border border-gray-200 shadow-2xl bg-gray-100 overflow-hidden sticky top-20"
                    style={{
                      backgroundImage: `url(${fotos[selectedImageIndex]})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Descripción + Mapa */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-8 bg-white p-8 rounded-md shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter text-[#0f172a]">Descripción</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {vehicle.acepta_permuta && <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-[10px] font-black uppercase tracking-widest"><RefreshCw size={14} /> Acepta Permuta</div>}
              {vehicle.financiacion && <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-lg text-green-700 text-[10px] font-black uppercase tracking-widest"><Handshake size={14} /> Apto Financiación</div>}
            </div>
            <p className="text-[16px] text-[#666] whitespace-pre-line leading-relaxed font-medium">{vehicle.descripcion || 'Sin descripción adicional.'}</p>
          </div>
          <div className="col-span-4 flex flex-col">
            {vehicle.localidad && (
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter text-[#0f172a]">UBICACIÓN</h3>
                <div className="relative z-0 rounded-xl overflow-hidden flex-grow min-h-[300px] w-full border border-gray-100 shadow-inner">
                  <VehicleMapInner localidad={vehicle.localidad} provincia={vehicle.provincia} />
                </div>
                <p className="text-[10px] font-bold text-center mt-3 text-gray-400 uppercase">{vehicle.localidad}, {vehicle.provincia}</p>
                <a href={mapsQuery} target="_blank" rel="noopener noreferrer"
                  className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-white font-black uppercase text-[13px] tracking-widest rounded-[10px] bg-[#1e293b] hover:bg-[#334155] shadow-[0_2px_0_#0f172a]">
                  <Navigation size={16} /> CÓMO LLEGAR
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <HorizontalSlider title="Más unidades de esta agencia" vehicles={ownerVehicles} router={router} slug={slug} />
        </div>
      </div>

      {/* ══ MOBILE CTA FIJO (bottom bar) ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] flex md:hidden bg-white border-t border-gray-200 px-4 py-3 gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 py-3.5 bg-[#288b55] text-white rounded-xl font-black text-[13px] uppercase text-center flex items-center justify-center gap-2 shadow-lg shadow-[#288b55]/20">
          <Phone size={16} /> WhatsApp
        </a>
        <button onClick={() => setIsShareOpen(true)}
          className="w-14 py-3.5 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all">
          <Share2 size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Gallery fullscreen */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer">
            <X size={32} />
          </button>
          {fotos.length > 1 && (
            <>
              <button onClick={() => setSelectedImageIndex(i => (i - 1 + fotos.length) % fotos.length)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full">
                <ChevronLeft size={32} />
              </button>
              <button onClick={() => setSelectedImageIndex(i => (i + 1) % fotos.length)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full">
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img src={fotos[selectedImageIndex]} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="Gallery View" />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold">
            {selectedImageIndex + 1} / {fotos.length}
          </p>
        </div>
      )}
    </main>
  );
}