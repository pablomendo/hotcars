'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Zap, Facebook, MessageCircle, Share2,
  RefreshCw, Heart, Handshake, User, ChevronLeft, ChevronRight,
  TrendingUp, X, ShieldAlert, AlertCircle,
  Loader2, MapPin, Mail, Link, Phone, CornerDownLeft, Navigation,
  Check, Play
} from 'lucide-react';

const ChevronRightIcon = ChevronRight;

// ─── Embed helper ─────────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`;
  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
  // URL directa de video (.mp4, etc.)
  return url;
}

function VideoEmbed({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const embedUrl = getEmbedUrl(src);
  const isEmbed = embedUrl?.includes('youtube.com/embed') || embedUrl?.includes('tiktok.com/embed');
  if (isEmbed) {
    return (
      <iframe
        src={embedUrl!}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    );
  }
  return (
    <video src={src} controls muted playsInline preload="auto" poster={poster} className={className} />
  );
}

// ─── Leaflet map con geocoding via Nominatim ──────────────────────────────────
function VehicleMapInner({ localidad, provincia }: { localidad: string; provincia: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState(false);

  const address = `${localidad}, ${provincia}, Argentina`;
  const mapsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  useEffect(() => {
    const query = `${localidad}, ${provincia}, Argentina`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'HotCars/1.0' },
    })
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [localidad, provincia]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-attribution-style')) {
      const style = document.createElement('style');
      style.id = 'leaflet-attribution-style';
      style.textContent = `.leaflet-control-attribution { font-size: 8px !important; opacity: 0.35 !important; background: transparent !important; box-shadow: none !important; padding: 0 3px !important; }`;
      document.head.appendChild(style);
    }

    import('leaflet').then(L => {
      const Leaflet = L.default;
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = Leaflet.map(mapRef.current!, { scrollWheelZoom: false }).setView([coords.lat, coords.lng], 13);
      mapInstanceRef.current = map;

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = Leaflet.marker([coords.lat, coords.lng]).addTo(map);
      marker.on('click', () => window.open(mapsUrl, '_blank'));
      marker.bindPopup(
        `<strong style="color:#1e293b">${localidad}, ${provincia}</strong><br/><a href="${mapsUrl}" target="_blank" style="color:#3483fa;font-size:12px">Abrir en Google Maps</a>`
      );
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords, mapsUrl, localidad, provincia]);

  if (error) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 text-sm">
      No se pudo cargar el mapa
    </div>
  );

  if (!coords) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <Loader2 className="animate-spin text-gray-300 w-6 h-6" />
    </div>
  );

  return <div ref={mapRef} style={{ height: '300px', width: '100%' }} />;
}

// ─── Acepta Permuta Badge ─────────────────────────────────────────────────────
function AceptaPermutaBadge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      border: '2px solid #1a7a3c',
      borderRadius: '999px',
      padding: '7px 18px',
      background: 'white',
    }}>
      <Handshake size={18} color="#1a7a3c" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#1e293b', fontSize: '14px', fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.02em',
        }}>
          Acepta Permuta
        </div>
      </div>
    </div>
  );
}

// ─── Financiacion Badge ───────────────────────────────────────────────────────
function FinanciacionBadge({ anticipo, moneda }: { anticipo: number; moneda: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '2px solid #1a7a3c',
      borderRadius: '999px',
      padding: '5px 18px',
      background: 'white',
      gap: '1px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: '#1a7a3c', fontSize: '10px', fontWeight: 900,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Financiación
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        color: '#1e293b', fontSize: '14px', fontWeight: 900,
        textTransform: 'uppercase', letterSpacing: '0.02em',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a7a3c" stroke="none">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
        </svg>
        Retira con {moneda === 'USD' ? 'U$S' : '$'} {Number(anticipo).toLocaleString('de-DE')}
      </div>
    </div>
  );
}

// ─── Verified Badge ───────────────────────────────────────────────────────────
function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-label="Verificado"
    >
      <g>
        <path
          fill="#1d9bf0"
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.08s-2.47-1.49-3.89-1.27c-.82-1.13-2.11-1.81-3.56-1.81s-2.74.68-3.56 1.81c-1.42-.22-2.88.16-3.89 1.27s-1.27 2.69-.81 4.08c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.08s2.47 1.49 3.89 1.27c.82 1.13 2.11 1.81 3.56 1.81s2.74-.68 3.56-1.81c1.42.22 2.88-.16 3.89-1.27s1.27-2.69.81-4.08c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.5-3.5 1.41-1.42 2.09 2.08 4.58-4.59 1.41 1.41-5.99 6.02z"
        />
      </g>
    </svg>
  );
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
  const text = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} — ${vehicle.moneda === 'USD' ? 'U$S' : '$'} ${Number(vehicle.pv).toLocaleString('de-DE')}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea');
      el.value = url; el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  const opts = [
    { label: 'WhatsApp', color: '#25d366', icon: <WhatsAppIcon />, action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank'), close: true },
    { label: 'Facebook', color: '#1877F2', icon: <Facebook size={20} />, action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'), close: true },
    { label: 'Email', color: '#6b7280', icon: <Mail size={20} />, action: () => window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank'), close: true },
    { label: copied ? '¡Copiado!' : 'Copiar link', color: copied ? '#288b55' : '#1e293b', icon: <Link size={20} />, action: copyLink, close: false },
  ];
  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black uppercase text-[13px] tracking-widest text-gray-400">Compartir publicación</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2">
          {opts.map(opt => (
            <button key={opt.label} onClick={() => { opt.action(); if (opt.close) onClose(); }}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-[0.98] transition-all text-left">
              <span style={{ color: opt.color }}>{opt.icon}</span>
              <span className="font-bold text-[14px] text-[#1e293b]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Card para slider ─────────────────────────────────────────────────
function VehicleCard({ rv, onClick }: { rv: any; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-[220px] text-left rounded-[8px] overflow-hidden border border-gray-200 bg-white shadow-sm active:scale-95 transition-all flex flex-col cursor-pointer"
      style={{ boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-full h-[143px] bg-gray-100 overflow-hidden">
        <img src={rv.fotos?.[0]} alt={`${rv.marca} ${rv.modelo}`}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <p className="text-[12px] font-black text-[#1e293b] leading-tight truncate uppercase">{rv.marca} {rv.modelo}</p>
        {rv.version && <p className="text-[#3483fa] text-[10px] font-bold uppercase tracking-tight truncate mt-0.5">{rv.version}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#333] font-bold">{rv.anio}</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] text-[#333] font-bold">{Number(rv.km).toLocaleString('de-DE')} km</span>
        </div>
        <div className="flex items-center gap-1 text-[#2596be] mt-1 font-bold uppercase text-[10px] truncate">
          <MapPin size={10} /> {rv.localidad || 'Ubicación'}
        </div>
        <p className="text-[16px] font-black text-[#1e293b] mt-auto pt-2">{rv.moneda === 'USD' ? 'U$S' : '$'} {Number(rv.pv).toLocaleString('de-DE')}</p>
      </div>
    </button>
  );
}

// ─── Owner Vehicle Card para slider ──────────────────────────────────────────
function OwnerVehicleCard({ rv, onClick }: { rv: any; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-[220px] text-left rounded-[8px] overflow-hidden border border-gray-200 bg-white shadow-sm active:scale-95 transition-all flex flex-col cursor-pointer"
      style={{ boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-full h-[143px] bg-gray-100 overflow-hidden">
        <img src={rv.fotos?.[0] || '/placeholder.jpg'} alt={`${rv.marca} ${rv.modelo}`}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <p className="text-[12px] font-black text-[#1e293b] leading-tight truncate uppercase">{rv.marca} {rv.modelo}</p>
        {rv.version && <p className="text-[#3483fa] text-[10px] font-bold uppercase tracking-tight truncate mt-0.5">{rv.version}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#333] font-bold">{rv.anio}</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] text-[#333] font-bold">{Number(rv.km).toLocaleString('de-DE')} km</span>
        </div>
        <div className="flex items-center gap-1 text-[#2596be] mt-1 font-bold uppercase text-[10px] truncate">
          <MapPin size={10} /> {rv.localidad || 'Ubicación'}
        </div>
        <p className="text-[16px] font-black text-[#1e293b] mt-auto pt-2">{rv.moneda === 'USD' ? 'U$S' : '$'} {Number(rv.pv).toLocaleString('de-DE')}</p>
      </div>
    </button>
  );
}

// ─── Horizontal Slider ────────────────────────────────────────────────────────
function HorizontalSlider({ title, vehicles, getSlug, router, ownerMode = false, headerRight }: {
  title: string; vehicles: any[]; getSlug: (v: any) => string; router: any;
  ownerMode?: boolean; headerRight?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };
  if (!vehicles.length) return null;
  return (
    <div className="bg-white md:border md:border-gray-200 md:rounded-md md:shadow-sm px-4 md:px-6 pt-5 pb-5 relative group">
      <style>{`
        .hc-slider::-webkit-scrollbar { display: none; }
        .hc-slider { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</p>
        {headerRight}
      </div>
      <div className="relative">
        <button onClick={() => scroll('left')} className="hidden md:flex absolute left-[-18px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-100 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
          <ChevronLeft size={20} className="text-[#3483fa]" />
        </button>
        <div ref={ref} className="hc-slider flex gap-4 overflow-x-auto snap-x snap-mandatory">
          {vehicles.map(rv => (
            <div key={rv.id} className="snap-start flex-shrink-0">
              {ownerMode
                ? <OwnerVehicleCard rv={rv} onClick={() => router.push(`/vehiculos/${getSlug(rv)}`)} />
                : <VehicleCard rv={rv} onClick={() => router.push(`/vehiculos/${getSlug(rv)}`)} />
              }
            </div>
          ))}
        </div>
        <button onClick={() => scroll('right')} className="hidden md:flex absolute right-[-18px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-gray-100 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
          <ChevronRight size={20} className="text-[#3483fa]" />
        </button>
      </div>
    </div>
  );
}

// ─── Botones con hover ────────────────────────────────────────────────────────
function HoverLink({ href, bg, shadow, hoverBg, className, children }: {
  href: string; bg: string; shadow: string; hoverBg: string; className?: string; children: React.ReactNode;
}) {
  const [h, setH] = useState(false);
  const strokeColor: Record<string, string> = { '#128C7E': '#1aaa9a', '#1e293b': '#2d3f56' };
  const border = '1px solid ' + (strokeColor[bg] ?? 'rgba(255,255,255,0.18)');
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className={className}
      style={{ background: h ? hoverBg : bg, boxShadow: h ? (shadow + ', inset 0 1px 0 rgba(255,255,255,0.12)') : shadow, border, transition: 'all 0.15s ease' }}>
      {children}
    </a>
  );
}

function HoverButton({ onClick, bg, shadow, hoverBg, className, children, disabled }: {
  onClick?: () => void; bg: string; shadow: string; hoverBg: string;
  className?: string; children: React.ReactNode; disabled?: boolean;
}) {
  const [h, setH] = useState(false);
  const strokeColor: Record<string, string> = { '#128C7E': '#1aaa9a', '#1e293b': '#2d3f56' };
  const border = '1px solid ' + (strokeColor[bg] ?? 'rgba(255,255,255,0.18)');
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className={className}
      style={{ background: h ? hoverBg : bg, boxShadow: h ? (shadow + ', inset 0 1px 0 rgba(255,255,255,0.08)') : shadow, border, transition: 'all 0.15s ease' }}>
      {children}
    </button>
  );
}

function HoverFlipButton({ onClick, disabled, flipActive, children }: {
  onClick: () => void; disabled: boolean; flipActive: boolean; children: React.ReactNode;
}) {
  const [h, setH] = useState(false);
  const base = flipActive
    ? { bg: '#fff1f2', hoverBg: '#ffe4e6', border: '1.5px solid #f87171', color: '#ef4444' }
    : { bg: '#f0f9ff', hoverBg: '#e0f2fe', border: '1.5px solid #38bdf8', color: '#0284c7' };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="w-full flex items-center justify-center gap-2 cursor-pointer font-black uppercase tracking-widest active:scale-95"
      style={{
        background: h ? base.hoverBg : base.bg, color: base.color, border: base.border,
        borderRadius: '10px', padding: '14px 0',
        boxShadow: h ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: h ? 'translateY(-1px)' : 'translateY(0)', transition: 'all 0.15s ease', fontSize: '12px',
      }}>
      {children}
    </button>
  );
}

// ─── Q&A estilo MercadoLibre ──────────────────────────────────────────────────
function QASection({
  vehicle, user, isOwner, questions, loadingQuestions,
  directQuestionText, setDirectQuestionText, sendingDirect, handleDirectQuestion,
  replyText, setReplyText, handleReplySubmit, router,
}: {
  vehicle: any; user: any; isOwner: boolean; questions: any[];
  loadingQuestions: boolean; directQuestionText: string;
  setDirectQuestionText: (v: string) => void; sendingDirect: boolean;
  handleDirectQuestion: () => void; replyText: { [key: string]: string };
  setReplyText: (fn: (prev: any) => any) => void;
  handleReplySubmit: (id: string) => void; router: any;
}) {
  return (
    <>
      <h3 className="text-[20px] md:text-[22px] font-bold text-[#333] mb-6">Preguntas y respuestas</h3>
      {!isOwner && (
        <div className="flex gap-3 mb-8">
          <input
            type="text" value={directQuestionText}
            onChange={e => setDirectQuestionText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDirectQuestion()}
            placeholder="Preguntale al vendedor"
            className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-[15px] text-[#333] outline-none focus:border-[#3483fa] transition-colors"
          />
          <button
            onClick={() => { if (!user) { router.push('/login'); return; } handleDirectQuestion(); }}
            disabled={sendingDirect || !directQuestionText.trim()}
            className="bg-[#3483fa] hover:bg-[#2a6fd1] text-white font-medium text-[15px] px-5 md:px-6 rounded-md transition-colors disabled:opacity-50 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            {sendingDirect ? <Loader2 size={16} className="animate-spin" /> : 'Preguntar'}
          </button>
        </div>
      )}
      <p className="text-[13px] text-gray-400 mb-4 font-medium">Últimas realizadas</p>
      {loadingQuestions ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-300 w-6 h-6" /></div>
      ) : questions.length === 0 ? (
        <p className="text-[14px] text-gray-400 italic py-4">Nadie preguntó todavía. ¡Sé el primero!</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {questions.map(q => (
            <div key={q.id} className="py-5">
              <p className="text-[15px] text-[#333] leading-relaxed mb-1">{q.pregunta}</p>
              <p className="text-[12px] text-gray-400 mb-3">
                {new Date(q.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                {!q.respuesta && !isOwner && <span className="ml-2 text-gray-300">· Sin respuesta aún</span>}
              </p>
              {q.respuesta ? (
                <div className="flex gap-3 bg-gray-50 rounded-md p-4">
                  <CornerDownLeft size={16} className="text-[#3483fa] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[14px] text-gray-600 leading-relaxed">{q.respuesta}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Respondido el {new Date(q.answered_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
              ) : isOwner ? (
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 text-[14px] border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-[#3483fa] transition-colors bg-white"
                    placeholder="Respondé esta pregunta..."
                    value={replyText[q.id] || ''}
                    onChange={e => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleReplySubmit(q.id)}
                  />
                  <button onClick={() => handleReplySubmit(q.id)} disabled={!replyText[q.id]?.trim()}
                    className="border border-[#3483fa] text-[#3483fa] hover:bg-blue-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors disabled:opacity-40 active:scale-95 whitespace-nowrap">
                    Responder
                  </button>
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">El vendedor no respondió todavía.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Mapa de ubicación ────────────────────────────────────────────────────────
function MapSection({ localidad, provincia }: { localidad: string; provincia: string }) {
  const address = `${localidad}, ${provincia}, Argentina`;
  const mapsQuery = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(address)}`;
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter text-[#333]">Ubicación del vehículo</h3>
      <div className="rounded-xl overflow-hidden" style={{ height: '300px', width: '100%' }}>
        <VehicleMapInner localidad={localidad} provincia={provincia} />
      </div>
      <a href={mapsQuery} target="_blank" rel="noopener noreferrer"
        className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-white font-black uppercase text-[13px] tracking-widest rounded-[10px] hover:bg-[#334155] transition-colors active:scale-95 cursor-pointer"
        style={{ background: '#1e293b', boxShadow: '0 2px 0 #0f172a', border: '1.5px solid #2d3f56' }}>
        <Navigation size={16} /> Cómo llegar
      </a>
    </div>
  );
}

function MapSectionMobile({ localidad, provincia }: { localidad: string; provincia: string }) {
  const address = `${localidad}, ${provincia}, Argentina`;
  const mapsQuery = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(address)}`;
  return (
    <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Ubicación del vehículo</h3>
      <div className="rounded-xl overflow-hidden" style={{ height: '300px', width: '100%' }}>
        <VehicleMapInner localidad={localidad} provincia={provincia} />
      </div>
      <a href={mapsQuery} target="_blank" rel="noopener noreferrer"
        className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-white font-black uppercase text-[12px] tracking-widest rounded-[10px] hover:bg-[#334155] transition-colors active:scale-95 cursor-pointer"
        style={{ background: '#1e293b', boxShadow: '0 2px 0 #0f172a', border: '1.5px solid #2d3f56' }}>
        <Navigation size={15} /> Cómo llegar
      </a>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [ownerVehicleCount, setOwnerVehicleCount] = useState(0);
  const [ownerVehicles, setOwnerVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [relatedVehicles, setRelatedVehicles] = useState<any[]>([]);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);

  const [flipStatus, setFlipStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [directQuestionText, setDirectQuestionText] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const getSlug = (v: any) =>
    `${v.marca}-${v.modelo}-${v.anio}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${v.id}`;

  const fetchQuestions = useCallback(async (vId: string) => {
    if (!vId) return;
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase.from('consultas_publicaciones').select('*').eq('auto_id', vId).order('created_at', { ascending: false });
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) { console.error('Error fetching questions:', err); }
    finally { setLoadingQuestions(false); }
  }, []);

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      const paramId = params.id as string;
      if (!paramId) return;
      const realId = paramId.length > 36 ? paramId.slice(-36) : paramId;

      const [vRes, sessionRes] = await Promise.all([
        supabase.from('inventario').select('*').eq('id', realId).single(),
        supabase.auth.getSession(),
      ]);
      if (vRes.error) throw vRes.error;

      const cv = vRes.data;
      const currentUser = sessionRes.data.session?.user || null;
      setVehicle(cv); setUser(currentUser);

      if (cv && currentUser?.id !== cv.owner_user_id) {
        supabase.rpc('increment_vehicle_stat', { p_vehicle_id: cv.id, p_owner_user_id: cv.owner_user_id, p_field: 'vistas' }).then(({ error: e }) => { if (e) console.warn('stat vistas', e); });
      }

      if (cv) {
        fetchQuestions(cv.id);
        const slug = getSlug(cv);
        if (paramId !== slug) window.history.replaceState(null, '', `/vehiculos/${slug}`);

        const delta = (cv.pv || 0) * 0.35;
        const min = Math.max(0, Math.floor((cv.pv || 0) - delta));
        const max = Math.ceil((cv.pv || 0) + delta);
        let { data: related } = await supabase.from('inventario')
          .select('id, marca, modelo, anio, pv, moneda, fotos, categoria, km, localidad, version')
          .neq('id', cv.id).eq('inventory_status', 'activo').eq('categoria', cv.categoria)
          .gte('pv', min).lte('pv', max).limit(10);
        let finalRelated = related || [];
        if (finalRelated.length < 6) {
          const seen = new Set(finalRelated.map((r: any) => r.id));
          const { data: fb } = await supabase.from('inventario')
            .select('id, marca, modelo, anio, pv, moneda, fotos, categoria, km, localidad, version')
            .neq('id', cv.id).eq('inventory_status', 'activo').order('created_at', { ascending: false }).limit(12);
          if (fb) fb.forEach((f: any) => { if (!seen.has(f.id) && finalRelated.length < 10) finalRelated.push(f); });
        }
        setRelatedVehicles(finalRelated);

        if (cv.owner_user_id) {
          const { data: owned } = await supabase.from('inventario')
            .select('id, marca, modelo, anio, pv, moneda, fotos, km, localidad, version')
            .neq('id', cv.id).eq('owner_user_id', cv.owner_user_id)
            .eq('inventory_status', 'activo').order('created_at', { ascending: false }).limit(24);
          setOwnerVehicles(owned || []);
        }
      }

      if (currentUser && cv) {
        const [flipData, favData] = await Promise.all([
          supabase.from('flip_compartido').select('status').eq('auto_id', cv.id).eq('vendedor_user_id', currentUser.id).maybeSingle(),
          supabase.from('favoritos').select('id').eq('auto_id', cv.id).eq('user_id', currentUser.id).maybeSingle(),
        ]);
        setFlipStatus(flipData.data?.status || null);
        setIsFavorite(!!favData.data);
      }

      if (cv?.owner_user_id) {
        const [userRes, countRes] = await Promise.all([
          supabase.from('usuarios').select('full_name, plan_type, phone, usuario_verificado').eq('auth_id', cv.owner_user_id).single(),
          supabase.from('inventario').select('id', { count: 'exact', head: true }).eq('owner_user_id', cv.owner_user_id),
        ]);
        setOwnerData(userRes.data);
        setOwnerVehicleCount(countRes.count || 0);
      }
    } catch (err) { console.error('Error HotCars:', err); }
    finally { setLoading(false); }
  }, [params.id, fetchQuestions]);

  useEffect(() => { if (params.id) fetchVehicleData(); }, [fetchVehicleData, params.id]);

  const handleToggleFavorite = async () => {
    if (!user || !vehicle || isFavLoading) return;
    setIsFavLoading(true);
    const prev = isFavorite; setIsFavorite(!prev);
    try {
      if (prev) await supabase.from('favoritos').delete().eq('auto_id', vehicle.id).eq('user_id', user.id);
      else {
        await supabase.from('favoritos').insert({ user_id: user.id, auto_id: vehicle.id });
        supabase.rpc('increment_vehicle_stat', { p_vehicle_id: vehicle.id, p_owner_user_id: vehicle.owner_user_id, p_field: 'guardados' }).then(({ error: e }) => { if (e) console.warn('stat guardados', e); });
      }
    } catch { setIsFavorite(prev); }
    finally { setIsFavLoading(false); }
  };

  const handleFlipAction = async () => {
    if (!user || !vehicle || flipStatus || isProcessing) return;
    setShowLoadingModal(true); setIsProcessing(true);
    await new Promise(r => setTimeout(r, 4500));
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('activar_flip_compartido', { p_auto_id: vehicle.id, p_vendedor_user_id: user.id });
      if (rpcError) throw rpcError;
      const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (result?.ok) {
        setFlipStatus(result.status);
      } else if (result?.error === 'limite_alcanzado') {
        setShowLoadingModal(false);
        setShowLimitModal(true);
        return;
      } else {
        alert('Error: ' + (result?.error || 'Desconocido'));
      }
    } catch (err: any) { alert('Error de conexión: ' + (err.message || '')); }
    finally { setShowLoadingModal(false); setIsProcessing(false); }
  };

  const handleRemoveFlip = async () => {
    if (!confirm(flipStatus === 'pending' ? '¿Cancelar solicitud?' : '¿Quitar del inventario?')) return;
    setIsProcessing(true);
    const prev = flipStatus; setFlipStatus(null);
    try {
      const { error } = await supabase.from('flip_compartido').delete().eq('auto_id', vehicle.id).eq('vendedor_user_id', user.id);
      if (error) { setFlipStatus(prev); throw error; }
      router.refresh();
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  };

  const handleDirectQuestion = async () => {
    if (!user) { router.push('/login'); return; }
    if (!directQuestionText.trim() || sendingDirect) return;
    setSendingDirect(true);
    try {
      const { error } = await supabase.from('consultas_publicaciones').insert({
        auto_id: vehicle.id, user_id: user.id, owner_id: vehicle.owner_user_id, pregunta: directQuestionText.trim(),
      });
      if (error) throw error;
      supabase.rpc('increment_vehicle_stat', { p_vehicle_id: vehicle.id, p_owner_user_id: vehicle.owner_user_id, p_field: 'consultas' }).then(({ error: e }) => { if (e) console.warn('stat consultas', e); });
      supabase.from('notifications').insert({
        user_id: vehicle.owner_user_id,
        type: 'nueva_pregunta',
        category: 'question',
        title: 'Nueva pregunta recibida',
        body: `Alguien preguntó sobre tu ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}: "${directQuestionText.trim().slice(0, 80)}${directQuestionText.trim().length > 80 ? '...' : ''}"`,
        related_entity_type: 'inventario',
        related_entity_id: vehicle.id,
        action_url: '/preguntas',
        is_read: false,
      }).then(({ error: ne }) => { if (ne) console.warn('notif pregunta', ne); });
      setDirectQuestionText(''); fetchQuestions(vehicle.id);
    } catch { alert('Error al enviar la pregunta'); }
    finally { setSendingDirect(false); }
  };

  const handleReplySubmit = async (qId: string) => {
    const text = replyText[qId];
    if (!text?.trim()) return;
    try {
      const { error } = await supabase.from('consultas_publicaciones')
        .update({ respuesta: text.trim(), answered_at: new Date().toISOString() }).eq('id', qId);
      if (error) throw error;
      setReplyText(prev => ({ ...prev, [qId]: '' }));
      if (vehicle?.id) fetchQuestions(vehicle.id);
    } catch { alert('Error al responder'); }
  };

  const handlePrevImage = () => setSelectedImageIndex(i => i === 0 ? totalItems - 1 : i - 1);
  const handleNextImage = () => setSelectedImageIndex(i => i === totalItems - 1 ? 0 : i + 1);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) diff > 0 ? handleNextImage() : handlePrevImage();
  };
  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]"><Loader2 className="animate-spin text-[#288b55] w-8 h-8" /></div>;
  if (!vehicle) return null;

  const fotos = vehicle.fotos || [];
  const videoUrl = vehicle.video_url;
  const totalItems = videoUrl ? fotos.length + 1 : fotos.length;
  const isVideoSelected = videoUrl && selectedImageIndex === fotos.length;

  const isOwner = user?.id === vehicle.owner_user_id;
  const profitLabel = isOwner ? 'TU GANANCIA' : 'GANANCIA FLIPPER';
  const profitValue = isOwner ? vehicle.ganancia_dueno : vehicle.ganancia_flipper;
  const publishDate = new Date(vehicle.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const isOwnerFree = ownerData?.plan_type?.toLowerCase() === 'starter';
  const canFlipDirecto = isOwnerFree || vehicle.is_flip === true;
  const whatsappNumber = ownerData?.phone?.replace(/\D/g, '');
  const whatsappMsg = encodeURIComponent(`Hola! Vi el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} en HotCars y me interesa. ${typeof window !== 'undefined' ? window.location.href : ''}`);
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : '#';
  const ownerFirstName = ownerData?.full_name?.split(' ')[0] || 'este vendedor';
  const ownerUsername = ownerData ? `@${ownerData.full_name?.toLowerCase().replace(/\s+/g, '')}` : '@cargando...';
  const isOwnerVerified = ownerData?.usuario_verificado === true;
  const hasMap = !!(vehicle.localidad && vehicle.provincia);

  // Badge se muestra solo cuando anticipo supera 500.000
  const showFinanciacionBadge = vehicle.anticipo && Number(vehicle.anticipo) > 500000;

  const getFlipLabel = () => {
    if (isProcessing) return 'Procesando...';
    if (flipStatus === 'approved') return 'Quitar de mi inventario';
    if (flipStatus === 'pending') return 'Cancelar solicitud';
    if (flipStatus === 'rejected') return 'Solicitud rechazada';
    return canFlipDirecto ? 'Activar Flip Compartido' : 'Solicitar Flip Compartido';
  };

  const qaProps = { vehicle, user, isOwner, questions, loadingQuestions, directQuestionText, setDirectQuestionText, sendingDirect, handleDirectQuestion, replyText, setReplyText, handleReplySubmit, router };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333] pb-40 md:pb-12 font-sans overflow-x-hidden relative">

      {isShareOpen && <ShareModal vehicle={vehicle} onClose={() => setIsShareOpen(false)} />}

      {showLoadingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#288b55] rounded-full border-t-transparent animate-spin" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#1e293b]">Verificando</h3>
            <p className="text-gray-400 text-sm mt-2">Consultando límites de tu plan...</p>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8 text-orange-600 border border-orange-100">
              <AlertCircle size={48} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black uppercase text-[#1e293b] mb-4">Límite alcanzado</h3>
            <p className="text-gray-500 text-[15px] leading-relaxed mb-10 font-medium">
              Tu plan actual no permite sumar más unidades activas.<br />Liberá cupo o actualizá tu suscripción ahora.
            </p>
            <button onClick={() => router.push('/planes')} className="w-full py-5 bg-[#ff4d00] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-200 hover:bg-[#e64500] transition-all active:scale-95 mb-6">Mejorar plan ahora</button>
            <button onClick={() => setShowLimitModal(false)} className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-600">Cerrar</button>
          </div>
        </div>
      )}

      <nav className="bg-white p-3 shadow-sm fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-6 border-b border-gray-100">
        <h1 className="font-black uppercase text-sm tracking-tighter italic">HOTCARS <span className="text-[#2596be] not-italic">PRO</span></h1>
        <button onClick={() => router.push('/', { scroll: false })} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
      </nav>

      <div className="max-w-[1200px] mx-auto mt-[100px] px-4">

        <div className="flex items-center gap-2 py-4 text-[13px] text-[#3483fa] overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => router.push('/', { scroll: false })} className="hover:underline cursor-pointer">Volver al listado</button>
          <span className="text-gray-300">|</span>
          <button onClick={() => router.push(`/?categoria=${vehicle.categoria?.toLowerCase()}`)} className="hover:underline capitalize cursor-pointer">{vehicle.categoria || 'Vehículos'}</button>
          <ChevronRightIcon size={12} className="text-gray-400 flex-shrink-0" />
          <button onClick={() => router.push(`/?marca=${encodeURIComponent(vehicle.marca)}`)} className="hover:underline capitalize cursor-pointer">{vehicle.marca}</button>
          <ChevronRightIcon size={12} className="text-gray-400 flex-shrink-0" />
          <button onClick={() => router.push(`/?marca=${encodeURIComponent(vehicle.marca)}&modelo=${encodeURIComponent(vehicle.modelo)}`)} className="hover:underline capitalize cursor-pointer">{vehicle.modelo}</button>
        </div>

        {/* ═══════════════════════════════════ MOBILE ══════════════════════════════════ */}
        <div className="md:hidden -mx-4">

          <div className="relative bg-black overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <div className="w-full h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => !isVideoSelected && setIsGalleryOpen(true)}>
              {isVideoSelected ? (
                <VideoEmbed src={videoUrl} poster={fotos[0]} className="w-full h-full object-contain" />
              ) : (
                <img src={fotos[selectedImageIndex]} alt={`${vehicle.marca} ${vehicle.modelo}`} className="w-full h-full object-cover" />
              )}
            </div>
            {totalItems > 1 && (
              <div className="absolute top-3 left-3 bg-black/55 text-white text-[12px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                {selectedImageIndex + 1} / {totalItems}
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <button onClick={e => { e.stopPropagation(); if (user) handleToggleFavorite(); }} disabled={isFavLoading}
                className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${isFavorite ? 'bg-red-500' : 'bg-white'}`}>
                <Heart size={16} className={isFavorite ? 'text-white fill-white' : 'text-gray-500'} />
              </button>
              <button onClick={e => { e.stopPropagation(); setIsShareOpen(true); }}
                className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform cursor-pointer">
                <Share2 size={16} className="text-gray-500" />
              </button>
            </div>
            {totalItems > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 rounded-full flex items-center justify-center shadow z-10"><ChevronLeft size={18} className="text-gray-700" /></button>
                <button onClick={e => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 rounded-full flex items-center justify-center shadow z-10"><ChevronRight size={18} className="text-gray-700" /></button>
              </>
            )}
            {totalItems > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {Array.from({ length: totalItems }).map((_, idx: number) => (
                  <button key={idx} onClick={e => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                    className={`rounded-full transition-all duration-200 ${idx === selectedImageIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
            <span className="text-[#333] text-[13px] font-bold">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
            <h1 className="text-[22px] font-black text-[#1e293b] leading-tight mt-1">{vehicle.marca} {vehicle.modelo}</h1>
            {vehicle.version && <p className="text-[#3483fa] font-bold text-[13px] uppercase tracking-wide mt-0.5">{vehicle.version}</p>}
            <div className="flex items-center gap-1 text-[#2596be] text-[12px] mt-1 mb-3 font-bold">
              <MapPin size={11} />{vehicle.localidad}, {vehicle.provincia}
            </div>
            <span className="text-[32px] font-black text-[#1e293b] tracking-tight">
              {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
            </span>
            {showFinanciacionBadge && (
              <div className="mt-3">
                <FinanciacionBadge anticipo={vehicle.anticipo} moneda={vehicle.moneda} />
              </div>
            )}
            {user !== null && profitValue && (
              <div className="flex items-center gap-1.5 text-[#00a650] mt-1 font-semibold">
                <TrendingUp size={14} /><span className="text-[13px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
              </div>
            )}
            <div className="flex gap-2.5 mt-4">
              <HoverLink href={whatsappUrl} bg="#128C7E" shadow="0 2px 0 #0a6058" hoverBg="#0f7a6e"
                className="flex-1 py-[14px] text-white rounded-[10px] font-black uppercase text-[12px] flex items-center justify-center gap-2 tracking-widest">
                <Phone size={16} /> WhatsApp
              </HoverLink>
              <HoverButton
                onClick={() => { if (!user) { router.push('/login'); return; } document.getElementById('qa-mobile')?.scrollIntoView({ behavior: 'smooth' }); }}
                bg="#1e293b" shadow="0 2px 0 #0f172a" hoverBg="#334155"
                className="flex-1 py-[14px] text-white rounded-[10px] font-black uppercase text-[12px] flex items-center justify-center gap-2 tracking-widest cursor-pointer">
                <MessageCircle size={16} /> Preguntar
              </HoverButton>
            </div>
            {user !== null && !isOwner && (
              <div className="mt-3">
                <HoverFlipButton
                  onClick={(flipStatus === 'approved' || flipStatus === 'pending') ? handleRemoveFlip : handleFlipAction}
                  disabled={isProcessing} flipActive={flipStatus === 'approved' || flipStatus === 'pending'}>
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
                  {getFlipLabel()}
                </HoverFlipButton>
              </div>
            )}
          </div>

          {relatedVehicles.length > 0 && (
            <HorizontalSlider title="También podría interesarte" vehicles={relatedVehicles} getSlug={getSlug} router={router} />
          )}

          <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#f5f5f5] p-2.5 rounded-full text-[#3483fa]"><User size={20} /></div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-bold text-[#333]">{ownerUsername}</p>
                  {isOwnerVerified && <VerifiedBadge size={15} />}
                </div>
                <p className="text-[11px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</p>
              </div>
            </div>
            <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)}
              className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] rounded-lg text-center cursor-pointer"
              style={{ border: '1.5px solid #3483fa' }}>
              Ver perfil del vendedor
            </button>
          </div>

          <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Descripción</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {vehicle.acepta_permuta && <AceptaPermutaBadge />}
              {vehicle.financiacion && (
                showFinanciacionBadge ? (
                  <FinanciacionBadge anticipo={vehicle.anticipo} moneda={vehicle.moneda} />
                ) : (
                  <div className="py-2 px-3 rounded-lg border border-gray-300 flex items-center gap-2 bg-gray-50">
                    <Handshake size={12} className="text-gray-600" /><span className="text-[10px] font-black uppercase tracking-tighter text-gray-700">Financiamiento</span>
                  </div>
                )
              )}
            </div>
            <p className="text-[15px] text-[#555] leading-relaxed whitespace-pre-line font-medium">{vehicle.descripcion || 'Sin descripción adicional.'}</p>
          </div>

          <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Características principales</h3>
            <div className="grid grid-cols-2 gap-y-4">
              {[
                { l: 'Marca', v: vehicle.marca }, { l: 'Modelo', v: vehicle.modelo },
                { l: 'Año', v: vehicle.anio }, { l: 'Kilómetros', v: Number(vehicle.km).toLocaleString('de-DE') + ' km' },
                { l: 'Versión', v: vehicle.version },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.l}</span>
                  <span className="text-[13px] mt-0.5 font-bold text-[#333]">{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          {hasMap && <MapSectionMobile localidad={vehicle.localidad} provincia={vehicle.provincia} />}

          <div id="qa-mobile" className="bg-white mt-2 px-4 py-6 border-b border-gray-100">
            <QASection {...qaProps} />
          </div>

          {ownerVehicles.length > 0 && (
            <div className="mt-2">
              <HorizontalSlider title={`Más de ${ownerFirstName}`} vehicles={ownerVehicles} getSlug={getSlug} router={router} ownerMode
                headerRight={<button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)} className="text-[12px] text-[#3483fa] font-bold hover:underline">Ver todo</button>} />
            </div>
          )}

        </div>

        {/* ═══════════════════════════════════ DESKTOP ══════════════════════════════════ */}
        <div className="hidden md:block">

          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-0">
              <section className="col-span-8 flex flex-row p-4 gap-4">
                <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide w-16 pr-1">
                  {fotos.map((foto: string, idx: number) => (
                    <button key={idx} onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                      <img src={foto} className="w-full h-full object-cover" alt="Thumb" />
                    </button>
                  ))}
                  {videoUrl && (
                    <button onClick={() => setSelectedImageIndex(fotos.length)}
                      className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all cursor-pointer relative ${selectedImageIndex === fotos.length ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                      <img src={fotos[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Video thumb" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={20} className="text-white fill-white" />
                      </div>
                    </button>
                  )}
                </div>
                <div className="flex-1 relative flex items-center justify-center min-h-[400px] overflow-hidden cursor-crosshair"
                  onMouseMove={!isVideoSelected ? handleZoomMove : undefined}
                  onMouseLeave={() => setZoomPos(null)}>
                  <div className="absolute inset-0 z-[5]" onClick={() => !isVideoSelected && setIsGalleryOpen(true)} />
                  {isVideoSelected ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
                      <VideoEmbed src={videoUrl} poster={fotos[0]} className="max-w-full max-h-full w-full" />
                    </div>
                  ) : (
                    <>
                      <img src={fotos[selectedImageIndex]} className="max-w-full max-h-full object-contain" alt="Principal" />
                      {zoomPos && (
                        <div className="absolute pointer-events-none z-[10] border-2 border-[#3483fa] rounded-full w-24 h-24 opacity-40"
                          style={{ left: `calc(${zoomPos.x}% - 48px)`, top: `calc(${zoomPos.y}% - 48px)` }} />
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className="col-span-4 border-l border-gray-100 p-6 flex flex-col justify-start min-h-[440px]">
                {zoomPos && !isVideoSelected ? (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                    <div className="w-full h-full" style={{
                      backgroundImage: `url(${fotos[selectedImageIndex]})`,
                      backgroundSize: '300%', backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundRepeat: 'no-repeat', minHeight: '400px',
                    }} />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[#333] text-[13px] font-bold">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setIsShareOpen(true)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                          <Share2 size={15} className="text-gray-400" />
                        </button>
                        <button onClick={handleToggleFavorite} disabled={!user || isFavLoading}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer ${isFavorite ? 'bg-red-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <Heart size={16} className={isFavorite ? 'text-white fill-white' : 'text-gray-500'} />
                        </button>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#333] leading-tight mb-1">{vehicle.marca} {vehicle.modelo}</h1>
                    <p className="text-[#3483fa] font-bold text-[14px] uppercase tracking-wide mb-1">{vehicle.version}</p>
                    <div className="flex items-center gap-1.5 text-[#2596be] text-[12px] font-bold uppercase mb-4">
                      <MapPin size={13} /> {vehicle.localidad}, {vehicle.provincia}
                    </div>
                    <div className="mb-4">
                      <span className="text-4xl font-black text-[#1e293b] tracking-tighter">
                        {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
                      </span>
                      {showFinanciacionBadge && (
                        <div className="mt-3">
                          <FinanciacionBadge anticipo={vehicle.anticipo} moneda={vehicle.moneda} />
                        </div>
                      )}
                      {user !== null && profitValue && (
                        <div className="flex items-center gap-1.5 text-[#00a650] mt-2 font-semibold">
                          <TrendingUp size={16} /><span className="text-[14px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
                        </div>
                      )}
                    </div>
                    {user !== null && !isOwner && (
                      <div className="mb-4">
                        <HoverFlipButton
                          onClick={(flipStatus === 'approved' || flipStatus === 'pending') ? handleRemoveFlip : handleFlipAction}
                          disabled={isProcessing} flipActive={flipStatus === 'approved' || flipStatus === 'pending'}>
                          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                          {getFlipLabel()}
                        </HoverFlipButton>
                      </div>
                    )}
                    <div className="flex gap-2.5">
                      <HoverLink href={whatsappUrl} bg="#128C7E" shadow="0 2px 0 #0a6058" hoverBg="#0f7a6e"
                        className="flex-1 py-[15px] text-white rounded-[10px] font-black text-[14px] tracking-widest uppercase text-center flex items-center justify-center gap-2.5">
                        <Phone size={18} /> WhatsApp
                      </HoverLink>
                      <HoverButton
                        onClick={() => { if (!user) { router.push('/login'); return; } document.getElementById('qa-desktop')?.scrollIntoView({ behavior: 'smooth' }); }}
                        bg="#1e293b" shadow="0 2px 0 #0f172a" hoverBg="#334155"
                        className="flex-1 py-[15px] text-white rounded-[10px] font-black text-[14px] tracking-widest uppercase text-center flex items-center justify-center gap-2.5 cursor-pointer">
                        <MessageCircle size={18} /> Preguntar
                      </HoverButton>
                    </div>
                    <div className="mt-2 pt-6 border-t border-gray-100">
                      <p className="text-[12px] text-[#333] mb-4 font-bold uppercase tracking-widest">Publicado el {publishDate}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-[#f5f5f5] p-3 rounded-full text-[#3483fa]"><User size={24} /></div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-md font-bold text-[#333]">{ownerUsername}</span>
                            {isOwnerVerified && <VerifiedBadge size={16} />}
                          </div>
                          <span className="text-[12px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</span>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)}
                        className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-center"
                        style={{ border: '1.5px solid #3483fa' }}>
                        Ver perfil del vendedor
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>

          {relatedVehicles.length > 0 && (
            <div className="mt-4">
              <HorizontalSlider title="También podría interesarte" vehicles={relatedVehicles} getSlug={getSlug} router={router} />
            </div>
          )}

          <div className="grid grid-cols-12 gap-6 mt-4 items-start">
            <div className="col-span-8 flex flex-col gap-6">

              <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter">Descripción</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {vehicle.acepta_permuta && <AceptaPermutaBadge />}
                  {vehicle.financiacion && (
                    showFinanciacionBadge ? (
                      <FinanciacionBadge anticipo={vehicle.anticipo} moneda={vehicle.moneda} />
                    ) : (
                      <div className="py-2 px-4 rounded-lg border border-gray-300 flex items-center gap-2 bg-gray-50">
                        <Handshake size={14} className="text-gray-600" /><span className="text-[11px] font-black uppercase tracking-tighter text-gray-700">Financiamiento Disponible</span>
                      </div>
                    )
                  )}
                </div>
                <p className="text-[16px] text-[#666] leading-relaxed whitespace-pre-line font-medium">{vehicle.descripcion || 'Sin descripción adicional.'}</p>
              </div>

              <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-8 uppercase tracking-tighter">Características principales</h3>
                <div className="grid grid-cols-2 gap-y-6 uppercase font-bold text-gray-600">
                  {[
                    { l: 'Marca', v: vehicle.marca }, { l: 'Modelo', v: vehicle.modelo },
                    { l: 'Año', v: vehicle.anio }, { l: 'Kilómetros', v: Number(vehicle.km).toLocaleString('de-DE') + ' km' },
                    { l: 'Versión', v: vehicle.version },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col border-b border-gray-100 pb-3 mr-8">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.l}</span>
                      <span className="text-[14px] mt-1 font-bold">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="qa-desktop" className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
                <QASection {...qaProps} />
              </div>

            </div>

            <div className="col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 sticky top-[80px]">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase tracking-tighter">
                  <ShieldAlert size={20} className="text-amber-500" /> Consejos de seguridad
                </h4>
                <ul className="flex flex-col gap-4 text-[13px] text-gray-600 font-medium">
                  <li className="flex gap-2 font-bold"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> Desde Hotcars, nunca te pediremos contraseñas o PIN.</li>
                  <li className="flex gap-2 font-bold"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> No hagas pagos anticipados sin ver el vehículo personalmente.</li>
                  <li className="flex gap-2 font-bold"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> HotCars no custodia o acopia vehículos.</li>
                  <li className="flex gap-2 bg-amber-50 p-4 rounded-lg border border-amber-100 text-[#856404] leading-relaxed">
                    <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Regla Flipper:</strong> Solo se permite la difusión en la web personal de HotCars o en redes personales y/o estados de whatsapp. Prohibido republicar vehículos en marketplaces externos sin previa aprobación o cambiar cualquier condición de venta.</span>
                  </li>
                </ul>
              </div>

              {hasMap && (
                <div className="sticky top-[calc(80px+420px)]">
                  <MapSection localidad={vehicle.localidad} provincia={vehicle.provincia} />
                </div>
              )}
            </div>
          </div>

          {ownerVehicles.length > 0 && (
            <div className="mt-4 mb-6">
              <HorizontalSlider title={`Más publicaciones de ${ownerFirstName}`} vehicles={ownerVehicles} getSlug={getSlug} router={router} ownerMode
                headerRight={<button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)} className="text-[13px] text-[#3483fa] font-bold hover:underline">Ver perfil completo</button>} />
            </div>
          )}

        </div>

      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
          <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full z-[110] cursor-pointer"><X size={32} /></button>
          <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full z-[110] cursor-pointer"><ChevronLeft size={32} /></button>
          {isVideoSelected ? (
            <div className="w-full max-w-3xl" style={{ aspectRatio: '16/9' }}>
              <VideoEmbed src={videoUrl} poster={fotos[0]} className="w-full h-full" />
            </div>
          ) : (
            <img src={fotos[selectedImageIndex]} alt="Gallery" className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
          )}
          <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full z-[110] cursor-pointer"><ChevronRight size={32} /></button>
          <div className="absolute bottom-6 text-white/60 text-sm font-bold">{selectedImageIndex + 1} / {totalItems}</div>
        </div>
      )}
    </main>
  );
}