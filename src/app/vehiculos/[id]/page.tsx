'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Star, Eye, EyeOff, Check, Settings, Zap, Plus, DollarSign, 
  Settings as SettingsIcon, Search, LayoutGrid, List, PauseCircle,
  Instagram, Facebook, MessageCircle, Share2, 
  RefreshCw, Heart, Handshake, CheckCircle2, User, ChevronLeft, ChevronRight, 
  ImageIcon, Car, Calendar, Gauge, Tag, TrendingUp, X, ShieldAlert, AlertCircle, 
  Loader2, MapPin
} from 'lucide-react';

const ChevronRightIcon = ChevronRight;

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
  
  const [flipStatus, setFlipStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

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
      }

      if (currentUser && currentVehicle) {
        const { data: flipData } = await supabase
          .from('flip_compartido')
          .select('status')
          .eq('auto_id', currentVehicle.id)
          .eq('vendedor_user_id', currentUser.id)
          .maybeSingle();
        
        setFlipStatus(flipData?.status || null);
      }

      if (currentVehicle?.owner_user_id) {
        const [userRes, countRes] = await Promise.all([
          supabase.from('usuarios').select('full_name, plan_type').eq('auth_id', currentVehicle.owner_user_id).single(),
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

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]"><Loader2 className="animate-spin text-[#288b55] w-8 h-8" /></div>;
  if (!vehicle) return null;

  const isOwner = user?.id === vehicle.owner_user_id;
  const profitLabel = isOwner ? "TU GANANCIA" : "GANANCIA FLIPPER";
  const profitValue = isOwner ? vehicle.ganancia_dueno : vehicle.ganancia_flipper;
  const publishDate = new Date(vehicle.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const isOwnerFree = ownerData?.plan_type?.toLowerCase() === 'free';
  const canFlipDirecto = isOwnerFree || vehicle.is_flip === true;

  const getButtonLabel = () => {
    if (isProcessing) return 'Procesando...';
    if (flipStatus === 'approved') return 'Quitar de mi inventario';
    if (flipStatus === 'pending') return 'Cancelar solicitud';
    if (flipStatus === 'rejected') return 'Solicitud rechazada';
    return canFlipDirecto ? 'Activar Flip Compartido' : 'Solicitar Flip Compartido';
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333] pb-12 font-sans overflow-x-hidden relative text-left">
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

        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

            <section className="md:col-span-8 flex flex-col-reverse md:flex-row p-4 gap-4 md:h-[600px]">
              <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:pr-1 scrollbar-hide md:w-16">
                {vehicle.fotos?.map((foto: string, idx: number) => (
                  <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                    <img src={foto} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
                ))}
              </div>
              <div className="flex-1 relative flex items-center justify-center group min-h-[240px] md:min-h-0">
                {/* ✅ FIX galería: z-[5] para que el botón X de la galería no quede tapado */}
                <div className="absolute inset-0 z-[5] cursor-pointer" onClick={() => setIsGalleryOpen(true)}></div>
                <img src={vehicle.fotos?.[selectedImageIndex]} className="max-w-full max-h-full object-contain" alt="Principal" />
              </div>
            </section>

            <section className="md:col-span-4 md:border-l border-gray-100 p-6 flex flex-col justify-start">
                <div className="flex justify-between items-start mb-1 text-left">
                  <span className="text-gray-500 text-[13px] font-bold">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
                  <Heart size={20} className="text-gray-300 cursor-pointer hover:text-red-500 transition-colors" />
                </div>
                <h1 className="text-2xl font-bold text-[#333] leading-tight mb-1">{vehicle.marca} {vehicle.modelo}</h1>
                <p className="text-[#3483fa] font-bold text-[14px] uppercase tracking-wide mb-1">{vehicle.version}</p>
                <div className="flex items-center gap-1.5 text-gray-400 text-[12px] font-bold uppercase mb-4"><MapPin size={13}/> {vehicle.localidad}, {vehicle.provincia}</div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-[#333] tracking-tighter">{vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}</span>
                  {/* ✅ FIX: ganancia solo visible para usuarios logueados */}
                  {user !== null && profitValue && (
                    <div className="flex items-center gap-1.5 text-[#00a650] mt-2 font-semibold">
                      <TrendingUp size={16} /> <span className="text-[14px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
                    </div>
                  )}
                </div>
                {/* ✅ FIX: botón flip solo visible para usuarios logueados y no dueños */}
                {user !== null && !isOwner && (
                  <button onClick={(flipStatus === 'approved' || flipStatus === 'pending') ? handleRemoveFlip : handleFlipAction} disabled={isProcessing} className={`w-full mb-4 py-4 border-2 border-dashed rounded-xl font-black uppercase text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer ${flipStatus === 'approved' || flipStatus === 'pending' ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100' : 'border-[#2596be] text-[#2596be] hover:bg-[#2596be]/5 active:scale-95'}`}>
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill={flipStatus ? "none" : "currentColor"} />} 
                    {getButtonLabel()}
                  </button>
                )}
                <div className="flex flex-col gap-3">
                  <button className="w-full py-4 bg-[#3483fa] text-white rounded-xl font-bold text-[16px] hover:bg-[#2968c8] transition-colors cursor-pointer text-center">Contactar por WhatsApp</button>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-left">
                    <div className={`py-4 rounded-lg border flex items-center justify-center gap-2 ${vehicle.acepta_permuta ? 'bg-white border-gray-300 cursor-pointer text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}><RefreshCw size={16}/><span className="text-[12.5px] font-black uppercase tracking-tighter">Permuta</span></div>
                    <div className={`py-4 rounded-lg border flex items-center justify-center gap-2 ${vehicle.financiacion ? 'bg-white border-gray-300 cursor-pointer text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}><Handshake size={16}/><span className="text-[12.5px] font-black uppercase tracking-tighter">Financiamiento</span></div>
                  </div>
                </div>
                <div className="mt-2 pt-6 border-t border-gray-100">
                  <p className="text-[12px] text-gray-500 mb-4 font-bold uppercase tracking-widest text-left">Publicado el {publishDate}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-[#f5f5f5] p-3 rounded-full text-[#3483fa]"><User size={24} /></div>
                    <div className="flex flex-col">
                      <span className="text-md font-bold text-[#333]">{ownerData ? `@${ownerData.full_name?.toLowerCase().replace(/\s+/g, '')}` : '@cargando...'}</span>
                      <span className="text-[12px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</span>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)} className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] border border-[#3483fa] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-center">Ver perfil del vendedor</button>
                </div>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-start">
          <div className="md:col-span-8 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-6 uppercase tracking-tighter">Descripción</h3>
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
          <div className="md:col-span-4">
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 w-full text-left">
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
      </div>

      {/* ✅ FIX galería: botón X con z-[110] siempre por encima del overlay */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
          <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110] cursor-pointer"><X size={32} /></button>
          <img src={vehicle.fotos?.[selectedImageIndex]} alt="Gallery" className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
        </div>
      )}
    </main>
  );
}