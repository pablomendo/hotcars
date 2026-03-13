'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Star, Eye, EyeOff, Check, Settings, Zap, Plus, DollarSign, 
  Settings as SettingsIcon, Search, LayoutGrid, List, PauseCircle,
  Instagram, Facebook, MessageCircle, Share2, 
  RefreshCw, Heart, Handshake, CheckCircle2, User, ChevronLeft, ChevronRight, 
  ImageIcon, Car, Calendar, Gauge, Tag, TrendingUp, X, ShieldAlert, AlertCircle, 
  Loader2, MapPin, Mail, Link, Phone
} from 'lucide-react';

const ChevronRightIcon = ChevronRight;

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.428a.5.5 0 00.609.61l5.71-1.494A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.51-5.17-1.4l-.37-.22-3.389.887.896-3.293-.242-.381A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

function ShareModal({ vehicle, onClose }: { vehicle: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} — ${vehicle.moneda === 'USD' ? 'U$S' : '$'} ${Number(vehicle.pv).toLocaleString('de-DE')}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea');
      el.value = url; el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

function RelatedCard({ rv, onClick }: { rv: any; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 w-[220px] text-left rounded-[6px] overflow-hidden border border-gray-200 bg-white shadow-sm active:scale-95 hover:shadow-md transition-all mb-2 flex flex-col h-[320px]">
      <div className="w-full h-[150px] bg-gray-100 overflow-hidden">
        <img src={rv.fotos?.[0]} alt={`${rv.marca} ${rv.modelo}`} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <p className="text-[13px] font-black text-[#1e293b] leading-tight truncate uppercase">{rv.marca} {rv.modelo}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#333] font-bold">{rv.anio}</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] text-[#333] font-bold uppercase">{Number(rv.km).toLocaleString('de-DE')} KM</span>
        </div>
        <div className="flex items-center gap-1 text-[#2596be] mt-1.5 font-bold uppercase text-[10px] truncate">
          <MapPin size={10} /> {rv.localidad || 'Ubicación'}
        </div>
        <p className="text-[18px] font-black text-[#1e293b] mt-auto">{rv.moneda === 'USD' ? 'U$S' : '$'} {Number(rv.pv).toLocaleString('de-DE')}</p>
      </div>
    </button>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [ownerVehicleCount, setOwnerVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [relatedVehicles, setRelatedVehicles] = useState<any[]>([]);
  
  const [flipStatus, setFlipStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const zoomImageRef = useRef<HTMLDivElement>(null);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    const scrollAmount = clientWidth * 0.8;
    sliderRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      
      const paramId = params.id as string;
      if (!paramId) return;

      const realId = paramId.length > 36 ? paramId.slice(-36) : paramId;

      const [vRes, sessionRes] = await Promise.all([
        supabase.from('inventario').select('*').eq('id', realId).single(),
        supabase.auth.getSession()
      ]);

      if (vRes.error) throw vRes.error;
      
      const currentVehicle = vRes.data;
      const currentUser = sessionRes.data.session?.user || null;
      
      setVehicle(currentVehicle);
      setUser(currentUser);

      if (currentVehicle) {
        const slug = `${currentVehicle.marca}-${currentVehicle.modelo}-${currentVehicle.anio}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        
        const expectedPath = `${slug}-${currentVehicle.id}`;
        
        if (paramId !== expectedPath) {
          window.history.replaceState(null, '', `/vehiculos/${expectedPath}`);
        }

        try {
          const delta = (currentVehicle.pv || 0) * 0.35;
          const min = Math.floor((currentVehicle.pv || 0) - delta);
          const max = Math.ceil((currentVehicle.pv || 0) + delta);

          let { data: related } = await supabase
            .from('inventario')
            .select('id, marca, modelo, anio, pv, moneda, fotos, categoria, km, localidad')
            .neq('id', currentVehicle.id)
            .eq('inventory_status', 'activo')
            .eq('categoria', currentVehicle.categoria)
            .gte('pv', min > 0 ? min : 0)
            .lte('pv', max > 0 ? max : 999999999)
            .limit(10);

          let finalRelated = related || [];

          if (finalRelated.length < 6) {
            const seenIds = new Set(finalRelated.map(r => r.id));
            const { data: fallback } = await supabase
              .from('inventario')
              .select('id, marca, modelo, anio, pv, moneda, fotos, categoria, km, localidad')
              .neq('id', currentVehicle.id)
              .eq('inventory_status', 'activo')
              .order('created_at', { ascending: false })
              .limit(12);
            
            if (fallback) {
              fallback.forEach(f => {
                if (!seenIds.has(f.id) && finalRelated.length < 10) {
                  finalRelated.push(f);
                }
              });
            }
          }

          setRelatedVehicles(finalRelated);
        } catch (relErr) {
          console.error('Related error:', relErr);
          setRelatedVehicles([]);
        }
      }

      if (currentUser && currentVehicle) {
        const [flipData, favData] = await Promise.all([
          supabase
            .from('flip_compartido')
            .select('status')
            .eq('auto_id', currentVehicle.id)
            .eq('vendedor_user_id', currentUser.id)
            .maybeSingle(),
          supabase
            .from('favoritos')
            .select('id')
            .eq('auto_id', currentVehicle.id)
            .eq('user_id', currentUser.id)
            .maybeSingle()
        ]);
        
        setFlipStatus(flipData.data?.status || null);
        setIsFavorite(!!favData.data);
      }

      if (currentVehicle?.owner_user_id) {
        const [userRes, countRes] = await Promise.all([
          supabase.from('usuarios').select('full_name, plan_type, phone').eq('auth_id', currentVehicle.owner_user_id).single(),
          supabase.from('inventario').select('id', { count: 'exact', head: true }).eq('owner_user_id', currentVehicle.owner_user_id)
        ]);
        setOwnerData(userRes.data);
        setOwnerVehicleCount(countRes.count || 0);
      }
    } catch (err) {
      console.error("Error HotCars:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchVehicleData(); }, [fetchVehicleData, params.id]);

  const handleToggleFavorite = async () => {
    if (!user || !vehicle || isFavLoading) return;
    setIsFavLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev) {
        await supabase.from('favoritos').delete().eq('auto_id', vehicle.id).eq('user_id', user.id);
      } else {
        await supabase.from('favoritos').insert({ user_id: user.id, auto_id: vehicle.id });
      }
    } catch (err) {
      setIsFavorite(prev);
      console.error("Error favorito:", err);
    } finally {
      setIsFavLoading(false);
    }
  };

  const handleFlipAction = async () => {
    if (!user || !vehicle || flipStatus || isProcessing) return; 
    setShowLoadingModal(true);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 4500));
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('activar_flip_compartido', {
        p_auto_id: vehicle.id,
        p_vendedor_user_id: user.id
      });
      if (rpcError) throw rpcError;
      if (rpcData?.ok) {
        setFlipStatus(rpcData.status);
      } else if (rpcData?.error === 'limite_alcanzado') {
        setShowLoadingModal(false);
        setShowLimitModal(true);
        return;
      } else {
        alert("Error de validación: " + (rpcData?.error || "Desconocido"));
      }
    } catch (err: any) { 
      console.error("Error RPC Flip:", err);
      alert("Error de conexión: " + (err.message || "Verificá la consola"));
    } finally {
      setShowLoadingModal(false);
      setIsProcessing(false);
    }
  };

  const handleRemoveFlip = async () => {
    const msg = flipStatus === 'pending' ? "¿Cancelar solicitud enviada?" : "¿Quitar este vehículo de tu inventario?";
    if (!confirm(msg)) return;
    setIsProcessing(true);
    const previousStatus = flipStatus;
    setFlipStatus(null);
    try {
      const { error } = await supabase.from('flip_compartido').delete().eq('auto_id', vehicle.id).eq('vendedor_user_id', user.id);
      if (error) {
        setFlipStatus(previousStatus);
        throw error;
      }
      router.refresh(); 
    } catch (err) {
      console.error("Error al borrar flip:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrevImage = () => setSelectedImageIndex(i => (i === 0 ? (vehicle.fotos?.length - 1) : i - 1));
  const handleNextImage = () => setSelectedImageIndex(i => (i === vehicle.fotos?.length - 1 ? 0 : i + 1));

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) { diff > 0 ? handleNextImage() : handlePrevImage(); }
  };

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const getRelatedSlug = (v: any) =>
    `${v.marca}-${v.modelo}-${v.anio}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${v.id}`;

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]"><Loader2 className="animate-spin text-[#288b55] w-8 h-8" /></div>;
  if (!vehicle) return null;

  const isOwner = user?.id === vehicle.owner_user_id;
  const profitLabel = isOwner ? "TU GANANCIA" : "GANANCIA FLIPPER";
  const profitValue = isOwner ? vehicle.ganancia_dueno : vehicle.ganancia_flipper;
  const publishDate = new Date(vehicle.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const isOwnerFree = ownerData?.plan_type?.toLowerCase() === 'free';
  const canFlipDirecto = isOwnerFree || vehicle.is_flip === true;
  const whatsappNumber = ownerData?.phone?.replace(/\D/g, '');
  const whatsappMsg = encodeURIComponent(`Hola! Vi el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} en HotCars y me interesa. ${typeof window !== 'undefined' ? window.location.href : ''}`);
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : '#';
  const fotos = vehicle.fotos || [];

  const getButtonLabel = () => {
    if (isProcessing) return 'Procesando...';
    if (flipStatus === 'approved') return 'Quitar de mi inventario';
    if (flipStatus === 'pending') return 'Cancelar solicitud';
    if (flipStatus === 'rejected') return 'Solicitud rechazada';
    return canFlipDirecto ? 'Activar Flip Compartido' : 'Solicitar Flip Compartido';
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333] pb-40 md:pb-12 font-sans overflow-x-hidden relative text-left">

      {isShareOpen && <ShareModal vehicle={vehicle} onClose={() => setIsShareOpen(false)} />}

      {showLoadingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center">
             <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#288b55] rounded-full border-t-transparent animate-spin"></div>
             </div>
             <h3 className="text-xl font-bold uppercase tracking-tight text-[#1e293b]">Verificando</h3>
             <p className="text-gray-400 text-sm mt-2">Consultando límites de tu plan...</p>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8 text-orange-600 border border-orange-100">
              <AlertCircle size={48} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black uppercase text-[#1e293b] mb-4">Límite alcanzado</h3>
            <p className="text-gray-500 text-[15px] leading-relaxed mb-10 font-medium text-center">
              Tu plan actual no permite sumar más unidades activas. <br/> Liberá cupo o actualizá tu suscripción ahora.
            </p>
            <button onClick={() => router.push('/planes')} className="w-full py-5 bg-[#ff4d00] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-200 hover:bg-[#e64500] transition-all active:scale-95 mb-6">Mejorar plan ahora</button>
            <button onClick={() => setShowLimitModal(false)} className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-600">Cerrar</button>
          </div>
        </div>
      )}

      <nav className="bg-white p-3 shadow-sm fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-6 border-b border-gray-100">
        <h1 className="font-black uppercase text-sm tracking-tighter italic text-left">HOTCARS <span className="text-[#2596be] not-italic">PRO</span></h1>
        <button onClick={() => router.push('/', { scroll: false })} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
      </nav>

      <div className="max-w-[1200px] mx-auto mt-[100px] px-4 text-left">
        <div className="flex items-center gap-2 py-4 text-[13px] text-[#3483fa] overflow-x-auto whitespace-nowrap scrollbar-hide text-left">
          <button onClick={() => router.push('/', { scroll: false })} className="hover:underline cursor-pointer">Volver al listado</button>
          <span className="text-gray-300">|</span>
          <button onClick={() => router.push(`/?categoria=${vehicle.categoria?.toLowerCase()}`)} className="hover:underline capitalize cursor-pointer">{vehicle.categoria || 'Vehículos'}</button>
          <ChevronRightIcon size={12} className="text-gray-400 flex-shrink-0" />
          <button onClick={() => router.push(`/?marca=${encodeURIComponent(vehicle.marca)}`)} className="hover:underline capitalize cursor-pointer">{vehicle.marca}</button>
          <ChevronRightIcon size={12} className="text-gray-400 flex-shrink-0" />
          <button onClick={() => router.push(`/?marca=${encodeURIComponent(vehicle.marca)}&modelo=${encodeURIComponent(vehicle.modelo)}`)} className="hover:underline capitalize cursor-pointer">{vehicle.modelo}</button>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="md:hidden -mx-4">
          <div className="relative bg-black overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <div className="w-full h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setIsGalleryOpen(true)}>
              <img src={fotos[selectedImageIndex]} alt={`${vehicle.marca} ${vehicle.modelo}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
            </div>

            {fotos.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/55 text-white text-[12px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                {selectedImageIndex + 1} / {fotos.length}
              </div>
            )}

            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <button onClick={e => { e.stopPropagation(); handleToggleFavorite(); }} disabled={!user || isFavLoading}
                className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform cursor-pointer">
                <Heart size={16} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
              </button>
              <button onClick={e => { e.stopPropagation(); setIsShareOpen(true); }}
                className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform cursor-pointer">
                <Share2 size={16} className="text-gray-500" />
              </button>
            </div>

            {fotos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 rounded-full flex items-center justify-center shadow z-10">
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <button onClick={e => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 rounded-full flex items-center justify-center shadow z-10">
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              </>
            )}

            {fotos.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {fotos.map((_: string, idx: number) => (
                  <button key={idx} onClick={e => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                    className={`rounded-full transition-all duration-200 ${idx === selectedImageIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[#333] text-[13px] font-bold">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
            </div>
            <h1 className="text-[22px] font-black text-[#1e293b] leading-tight">{vehicle.marca} {vehicle.modelo}</h1>
            {vehicle.version && <p className="text-[#3483fa] font-bold text-[13px] uppercase tracking-wide mt-0.5">{vehicle.version}</p>}
            <div className="flex items-center gap-1 text-[#2596be] text-[12px] mt-1 mb-3 font-bold">
              <MapPin size={11} />{vehicle.localidad}, {vehicle.provincia}
            </div>

            <span className="text-[32px] font-black text-[#1e293b] tracking-tight">
              {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
            </span>
            {user !== null && profitValue && (
              <div className="flex items-center gap-1.5 text-[#00a650] mt-1 font-semibold">
                <TrendingUp size={14} /><span className="text-[13px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
              </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {vehicle.acepta_permuta && (
                <span className="flex items-center gap-1 text-[11px] font-black uppercase border border-gray-300 rounded-full px-3 py-1 text-gray-600">
                  <RefreshCw size={11} /> Permuta
                </span>
              )}
              {vehicle.financiacion && (
                <span className="flex items-center gap-1 text-[11px] font-black uppercase border border-gray-300 rounded-full px-3 py-1 text-gray-600">
                  <Handshake size={11} /> Financiamiento
                </span>
              )}
            </div>

            {user !== null && !isOwner && (
              <button onClick={(flipStatus === 'approved' || flipStatus === 'pending') ? handleRemoveFlip : handleFlipAction} disabled={isProcessing}
                className={`w-full mt-3 py-3 border-2 border-dashed rounded-xl font-black uppercase text-[11px] flex items-center justify-center gap-2 transition-all ${flipStatus === 'approved' || flipStatus === 'pending' ? 'border-red-200 text-red-500 bg-red-50' : 'border-[#2596be] text-[#2596be]'}`}>
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill={flipStatus ? 'none' : 'currentColor'} />}
                {getButtonLabel()}
              </button>
            )}
          </div>

          <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#f5f5f5] p-2.5 rounded-full text-[#3483fa]"><User size={20} /></div>
              <div>
                <p className="text-[14px] font-bold text-[#333]">{ownerData ? `@${ownerData.full_name?.toLowerCase().replace(/\s+/g, '')}` : '@cargando...'}</p>
                <p className="text-[11px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</p>
              </div>
            </div>
            <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)}
              className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] border border-[#3483fa] rounded-lg text-center cursor-pointer">
              Ver perfil del vendedor
            </button>
          </div>

          {relatedVehicles.length > 0 && (
            <div className="bg-white mt-2 px-4 py-6 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Unidades similares</p>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
                {relatedVehicles.map(rv => <RelatedCard key={rv.id} rv={rv} onClick={() => router.push(`/vehiculos/${getRelatedSlug(rv)}`)} />)}
              </div>
            </div>
          )}

          <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Descripción</h3>
            <p className="text-[15px] text-[#555] leading-relaxed whitespace-pre-line font-medium">{vehicle.descripcion || 'Sin descripción adicional.'}</p>
          </div>

          <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Características</h3>
            <div className="grid grid-cols-2 gap-y-4">
              {[
                { l: 'Marca', v: vehicle.marca }, { l: 'Modelo', v: vehicle.modelo },
                { l: 'Año', v: vehicle.anio }, { l: 'Kilómetros', v: Number(vehicle.km).toLocaleString('de-DE') + ' km' },
                { l: 'Versión', v: vehicle.version },
              ].filter(i => i.v).map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.l}</span>
                  <span className="text-[13px] mt-0.5 font-bold">{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white mt-2 px-4 py-5 border-b border-gray-100">
            <h4 className="font-bold text-[10px] mb-3 flex items-center gap-2 uppercase tracking-widest text-gray-400">
              <ShieldAlert size={14} className="text-amber-500" /> Consejos de seguridad
            </h4>
            <ul className="flex flex-col gap-3 text-[12px] text-gray-600 font-medium">
              <li className="flex gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />Nunca te pediremos contraseñas o PIN.</li>
              <li className="flex gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />No hagas pagos anticipados sin ver el vehículo.</li>
              <li className="flex gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />HotCars no custodia o acopia vehículos.</li>
              <li className="flex gap-2 bg-amber-50 p-4 rounded-lg border border-amber-100 text-[#856404] leading-relaxed font-medium">
                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" /> 
                <span><strong>Regla Flipper:</strong> Solo se permite la difusión en la web personal de HotCars o en redes personales y/o estados de whatsapp. Prohibido republicar vehiculos en marketplaces externos sin prebia aprobacion o cambiar cualquier condicion de venta.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden md:block">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden text-left">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

              <section className="md:col-span-8 flex flex-col-reverse md:flex-row p-4 gap-4">
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:pr-1 scrollbar-hide md:w-16">
                  {fotos?.map((foto: string, idx: number) => (
                    <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                      <img src={foto} className="w-full h-full object-cover" alt="Thumb" />
                    </button>
                  ))}
                </div>

                <div
                  className="flex-1 relative flex items-center justify-center group min-h-[400px] overflow-hidden cursor-crosshair"
                  onMouseMove={handleZoomMove}
                  onMouseLeave={() => setZoomPos(null)}
                >
                  <div className="absolute inset-0 z-[5]" onClick={() => setIsGalleryOpen(true)}></div>
                  <img
                    src={fotos[selectedImageIndex]}
                    className="max-w-full max-h-full object-contain"
                    alt="Principal"
                  />
                  {zoomPos && (
                    <div
                      className="absolute pointer-events-none z-[10] border-2 border-[#3483fa] rounded-full w-24 h-24 opacity-40"
                      style={{
                        left: `calc(${zoomPos.x}% - 48px)`,
                        top: `calc(${zoomPos.y}% - 48px)`,
                      }}
                    />
                  )}
                </div>
              </section>

              <section className="md:col-span-4 md:border-l border-gray-100 p-6 flex flex-col justify-start min-h-[440px]">
                {zoomPos ? (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${fotos[selectedImageIndex]})`,
                        backgroundSize: '300%',
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                        backgroundRepeat: 'no-repeat',
                        minHeight: '400px',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1 text-left">
                      <span className="text-[#333] text-[13px] font-bold">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setIsShareOpen(true)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer" title="Compartir">
                          <Share2 size={15} className="text-gray-400" />
                        </button>
                        <button
                          onClick={handleToggleFavorite}
                          disabled={!user || isFavLoading}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer ${isFavorite ? 'bg-red-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                          title={!user ? 'Iniciá sesión para guardar favoritos' : isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        >
                          <Heart
                            size={16}
                            className={`transition-all ${isFavorite ? 'text-white fill-white' : 'text-gray-500'}`}
                          />
                        </button>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#333] leading-tight mb-1">{vehicle.marca} {vehicle.modelo}</h1>
                    <p className="text-[#3483fa] font-bold text-[14px] uppercase tracking-wide mb-1">{vehicle.version}</p>
                    <div className="flex items-center gap-1.5 text-[#2596be] text-[12px] font-bold uppercase mb-4"><MapPin size={13}/> {vehicle.localidad}, {vehicle.provincia}</div>
                    <div className="mb-6">
                      <span className="text-4xl font-black text-[#1e293b] tracking-tighter">{vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}</span>
                      {user !== null && profitValue && (
                        <div className="flex items-center gap-1.5 text-[#00a650] mt-2 font-semibold">
                          <TrendingUp size={16} /> <span className="text-[14px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
                        </div>
                      )}
                    </div>
                    {user !== null && !isOwner && (
                      <button onClick={(flipStatus === 'approved' || flipStatus === 'pending') ? handleRemoveFlip : handleFlipAction} disabled={isProcessing} className={`w-full mb-4 py-4 border-2 border-dashed rounded-xl font-black uppercase text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer ${flipStatus === 'approved' || flipStatus === 'pending' ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100' : 'border-[#2596be] text-[#2596be] hover:bg-[#2596be]/5 active:scale-95'}`}>
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill={flipStatus ? "none" : "currentColor"} />} 
                        {getButtonLabel()}
                      </button>
                    )}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-[#25d366] text-white rounded-xl font-bold text-[16px] hover:bg-[#20b858] transition-colors cursor-pointer text-center flex items-center justify-center gap-2">
                           <Phone size={18} /> WhatsApp
                        </a>
                        <button
                          onClick={() => router.push(`/mensajes?to=${vehicle.owner_user_id}&auto=${vehicle.id}`)}
                          className="flex-1 py-4 border-2 border-[#3483fa] text-[#3483fa] rounded-xl font-bold text-[16px] hover:bg-blue-50 transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={18} /> Preguntar
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 pt-6 border-t border-gray-100">
                      <p className="text-[12px] text-[#333] mb-4 font-bold uppercase tracking-widest text-left">Publicado el {publishDate}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-[#f5f5f5] p-3 rounded-full text-[#3483fa]"><User size={24} /></div>
                        <div className="flex flex-col">
                          <span className="text-md font-bold text-[#333]">{ownerData ? `@${ownerData.full_name?.toLowerCase().replace(/\s+/g, '')}` : '@cargando...'}</span>
                          <span className="text-[12px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</span>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)} className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] border border-[#3483fa] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-center">Ver perfil del vendedor</button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-start">
            <div className="md:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter">Descripción</h3>
                
                {/* Etiquetas de Permuta y Financiamiento en el mismo card de descripción */}
                <div className="flex gap-2 mb-6">
                  {vehicle.acepta_permuta && (
                    <div className="py-2 px-4 rounded-lg border border-gray-300 flex items-center gap-2 bg-gray-50">
                      <RefreshCw size={14} className="text-gray-600"/>
                      <span className="text-[11px] font-black uppercase tracking-tighter text-gray-700">Acepta Permuta</span>
                    </div>
                  )}
                  {vehicle.financiacion && (
                    <div className="py-2 px-4 rounded-lg border border-gray-300 flex items-center gap-2 bg-gray-50">
                      <Handshake size={14} className="text-gray-600"/>
                      <span className="text-[11px] font-black uppercase tracking-tighter text-gray-700">Financiamiento Disponible</span>
                    </div>
                  )}
                </div>

                <p className="text-[16px] text-[#666] leading-relaxed whitespace-pre-line font-medium">{vehicle.descripcion || "Sin descripción adicional."}</p>
              </div>
              <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-8 uppercase tracking-tighter">Características principales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 uppercase font-bold text-gray-600">
                  {[{ l: "Marca", v: vehicle.marca }, { l: "Modelo", v: vehicle.modelo }, { l: "Año", v: vehicle.anio }, { l: "Kilómetros", v: vehicle.km?.toLocaleString('de-DE') + " km" }, { l: "Versión", v: vehicle.version }].map((item, idx) => (
                    <div key={idx} className="flex flex-col border-b border-gray-100 pb-3 sm:mr-8">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.l}</span>
                      <span className="text-[14px] mt-1 font-bold">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 h-full flex flex-col">
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 w-full text-left flex-grow">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase tracking-tighter"><ShieldAlert size={20} className="text-amber-500" /> Consejos de seguridad</h4>
                <ul className="flex flex-col gap-4 text-[13px] text-gray-600 font-medium">
                  <li className="flex gap-2 font-bold font-sans"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> Desde Hotcars, nunca te pediremos contraseñas o PIN.</li>
                  <li className="flex gap-2 font-bold font-sans"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> No hagas pagos anticipados sin ver el vehículo personalmente.</li>
                  <li className="flex gap-2 font-bold font-sans"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> HotCars no custodia o acopia vehículos.</li>
                  <li className="flex gap-2 bg-amber-50 p-4 rounded-lg border border-amber-100 text-[#856404] leading-relaxed font-medium">
                    <AlertCircle size={24} className="flex-shrink-0 mt-0.5" /> 
                    <span><strong>Regla Flipper:</strong> Solo se permite la difusión en la web personal de HotCars o en redes personales y/o estados de whatsapp. Prohibido republicar vehiculos en marketplaces externos sin prebia aprobacion o cambiar cualquier condicion de venta.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {relatedVehicles.length > 0 && (
            <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200 mt-6 relative group">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">También podría interesarte</p>
              
              <div className="relative">
                <button 
                  onClick={() => scrollSlider('left')}
                  className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={24} className="text-[#3483fa]" />
                </button>

                <div 
                  ref={sliderRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                >
                  {relatedVehicles.map(rv => (
                    <div key={rv.id} className="snap-start">
                      <RelatedCard rv={rv} onClick={() => router.push(`/vehiculos/${getRelatedSlug(rv)}`)} />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollSlider('right')}
                  className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={24} className="text-[#3483fa]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button onClick={() => router.push(`/mensajes?to=${vehicle.owner_user_id}&auto=${vehicle.id}`)}
          className="flex-1 py-3.5 border-2 border-[#3483fa] text-[#3483fa] rounded-xl font-black uppercase text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
          <MessageCircle size={16} /> Preguntar
        </button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 py-3.5 bg-[#25d366] text-white rounded-xl font-black uppercase text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
          <Phone size={16} /> WhatsApp
        </a>
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
          <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110] cursor-pointer"><X size={32} /></button>
          <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full z-[110] cursor-pointer"><ChevronLeft size={32} /></button>
          <img src={fotos[selectedImageIndex]} alt="Gallery" className="max-w-full max-h-[85vh] object-contain shadow-2xl transition-transform duration-500 hover:scale-110" />
          <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full z-[110] cursor-pointer"><ChevronRight size={32} /></button>
          <div className="absolute bottom-6 text-white/60 text-sm font-bold">{selectedImageIndex + 1} / {fotos.length}</div>
        </div>
      )}
    </main>
  );
}