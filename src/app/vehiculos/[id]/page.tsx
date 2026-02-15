'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, MapPin, MessageCircle, Share2, 
  RefreshCw, Heart, Handshake, CheckCircle2, User, ChevronLeft, ChevronRight, 
  Image as ImageIcon, Car, Calendar, Gauge, Settings, Tag, TrendingUp, X, Zap, ShieldAlert, AlertCircle, ChevronRight as ChevronIcon
} from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [ownerVehicleCount, setOwnerVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, sessionRes] = await Promise.all([
        supabase.from('inventario').select('*').eq('id', params.id).single(),
        supabase.auth.getSession()
      ]);

      if (vRes.error) throw vRes.error;
      
      setVehicle(vRes.data);
      setUser(sessionRes.data.session?.user || null);
      setLoading(false);

      if (vRes.data?.owner_user_id) {
        const [userRes, countRes] = await Promise.all([
          supabase.from('usuarios').select('nombre, plan_type').eq('id', vRes.data.owner_user_id).single(),
          supabase.from('inventario').select('id', { count: 'exact', head: true }).eq('owner_user_id', vRes.data.owner_user_id)
        ]);
        setOwnerData(userRes.data);
        setOwnerVehicleCount(countRes.count || 0);
      }
    } catch (err) {
      console.error("Error HotCars:", err);
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchVehicleData(); }, [fetchVehicleData, params.id]);

  const handleFlipAction = async () => {
    if (!user || !vehicle) return;
    
    // CIRUGÍA: Normalización de plan_type para evitar errores de mayúsculas
    const isOwnerFree = ownerData?.plan_type?.toLowerCase() === 'free';
    const canFlipDirecto = isOwnerFree || vehicle.permitir_flip === true;
    
    try {
      if (canFlipDirecto) {
        const { error } = await supabase.from('flip_compartido').insert([{ 
          auto_id: vehicle.id, 
          vendedor_user_id: user.id, 
          status: 'approved',
          created_at: new Date() 
        }]);
        if (error) throw error;
        alert("¡Unidad sumada a tu inventario!");
        router.push('/inventario');
      } else {
        const { error } = await supabase.from('flip_compartido').insert([{ 
          auto_id: vehicle.id, 
          vendedor_user_id: user.id, 
          status: 'pending',
          created_at: new Date() 
        }]);
        if (error) throw error;
        alert(`Solicitud enviada al dueño de la unidad.`);
      }
    } catch (err) { 
      alert("Error al procesar la action de Flip"); 
    }
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]"><Loader2 className="animate-spin text-[#288b55] w-8 h-8" /></div>;
  if (!vehicle) return null;

  const isOwner = user?.id === vehicle.owner_user_id;
  const profitLabel = isOwner ? "TU GANANCIA" : "GANANCIA FLIPPER";
  const profitValue = isOwner ? vehicle.ganancia_dueno : vehicle.ganancia_flipper;
  const publishDate = new Date(vehicle.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // CIRUGÍA: Definición de variable para el texto del botón basado en la misma lógica del handler
  const isOwnerFree = ownerData?.plan_type?.toLowerCase() === 'free';
  const labelBotonFlip = (isOwnerFree || vehicle.permitir_flip) ? 'Activar Flip Compartido' : 'Solicitar Flip Compartido';

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#333] pb-12 font-sans overflow-x-hidden relative text-left">
      <nav className="bg-white p-3 shadow-sm fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-6 border-b border-gray-100">
        <h1 className="font-black uppercase text-sm tracking-tighter italic">HOTCARS <span className="text-[#2596be] not-italic">PRO</span></h1>
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
      </nav>

      <div className="max-w-[1200px] mx-auto mt-[75px] px-4">
        
        {/* BREADCRUMB FUNCIONAL CON LINKS DE FILTRADO */}
        <div className="flex items-center gap-2 py-4 text-[13px] text-[#3483fa] overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => router.push('/marketplace')} className="hover:underline cursor-pointer">Volver al listado</button>
          <span className="text-gray-300">|</span>
          
          {/* Link Categoría */}
          <button 
            onClick={() => router.push(`/marketplace?categoria=${vehicle.categoria}`)} 
            className="hover:underline capitalize cursor-pointer"
          >
            {vehicle.categoria || 'Vehículos'}
          </button>
          
          <ChevronIcon size={12} className="text-gray-400 flex-shrink-0" />
          
          {/* Link Marca */}
          <button 
            onClick={() => router.push(`/marketplace?marca=${vehicle.marca}`)} 
            className="hover:underline capitalize cursor-pointer"
          >
            {vehicle.marca}
          </button>
          
          <ChevronIcon size={12} className="text-gray-400 flex-shrink-0" />
          
          {/* Link Modelo */}
          <button 
            onClick={() => router.push(`/marketplace?marca=${vehicle.marca}&modelo=${vehicle.modelo}`)} 
            className="hover:underline capitalize cursor-pointer"
          >
            {vehicle.modelo}
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            
            <section className="md:col-span-8 flex flex-row p-4 gap-4 min-h-[500px] md:h-[600px]">
              <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide w-16">
                {vehicle.fotos?.map((foto: string, idx: number) => (
                  <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#3483fa]' : 'border-gray-200'}`}>
                    <img src={foto} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
                ))}
              </div>
              <div className="flex-1 relative flex items-center justify-center group">
                <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setIsGalleryOpen(true)}></div>
                <img src={vehicle.fotos?.[selectedImageIndex]} className="max-w-full max-h-full object-contain" alt="Principal" />
              </div>
            </section>

            <section className="md:col-span-4 border-l border-gray-100 p-6 flex flex-col justify-start">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-gray-500 text-[13px]">{vehicle.anio} | {Number(vehicle.km).toLocaleString('de-DE')} km</span>
                  <Heart size={20} className="text-gray-300 cursor-pointer hover:text-red-500 transition-colors" />
                </div>
                <h1 className="text-2xl font-bold text-[#333] leading-tight mb-1">{vehicle.marca} {vehicle.modelo}</h1>
                <p className="text-[#3483fa] font-bold text-[14px] uppercase tracking-wide mb-1">{vehicle.version}</p>
                <div className="flex items-center gap-1.5 text-gray-400 text-[12px] font-bold uppercase mb-4"><MapPin size={13}/> {vehicle.localidad}, {vehicle.provincia}</div>

                {/* BADGE DE STATUS COMERCIAL */}
                {vehicle.commercial_status && vehicle.commercial_status !== 'disponible' && (
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-widest ${
                      vehicle.commercial_status === 'reservado' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                      vehicle.commercial_status === 'vendido' ? 'bg-red-100 text-red-700 border border-red-200' : 
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {vehicle.commercial_status}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <span className="text-4xl font-black text-[#333] tracking-tighter">{vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}</span>
                  {profitValue && (
                    <div className="flex items-center gap-1.5 text-[#00a650] mt-2 font-semibold">
                      <TrendingUp size={16} /> <span className="text-[14px] uppercase">{profitLabel}: ${Number(profitValue).toLocaleString('de-DE')}</span>
                    </div>
                  )}
                </div>

                {!isOwner && (
                  <button onClick={handleFlipAction} className="w-full mb-4 py-3.5 border-2 border-dashed border-[#2596be] text-[#2596be] rounded-lg font-black uppercase text-[12px] flex items-center justify-center gap-2 hover:bg-[#2596be]/5 transition-all cursor-pointer">
                    <Zap size={16} fill="currentColor" /> {labelBotonFlip}
                  </button>
                )}

                <div className="flex flex-col gap-3">
                  <button className="w-full py-3.5 bg-[#3483fa] text-white rounded-lg font-bold text-[16px] hover:bg-[#2968c8] transition-colors cursor-pointer">Contactar por WhatsApp</button>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`py-4 rounded-lg border flex items-center justify-center gap-2 ${vehicle.acepta_permuta ? 'bg-white border-gray-300 cursor-pointer text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}><RefreshCw size={16}/><span className="text-[12.5px] font-black uppercase">Permuta</span></div>
                    <div className={`py-4 rounded-lg border flex items-center justify-center gap-2 ${vehicle.financiacion ? 'bg-white border-gray-300 cursor-pointer text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}><Handshake size={16}/><span className="text-[12.5px] font-black uppercase">Financiamiento</span></div>
                  </div>
                </div>

                <div className="mt-2 pt-6 border-t border-gray-100">
                  <p className="text-[12px] text-gray-500 mb-4 italic">Publicado el {publishDate}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-[#f5f5f5] p-3 rounded-full text-[#3483fa]"><User size={24} /></div>
                    <div className="flex flex-col">
                      <span className="text-md font-bold text-[#333]">
                        {ownerData ? `@${ownerData.nombre?.toLowerCase().replace(/\s+/g, '')}` : '@cargando...'}
                      </span>
                      <span className="text-[12px] text-[#2596be] font-semibold">{ownerVehicleCount} unidades publicadas</span>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/perfil/${vehicle.owner_user_id}`)} className="w-full py-2.5 text-[#3483fa] font-bold text-[13px] border border-[#3483fa] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">Ver perfil del vendedor</button>
                </div>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-start text-left">
          <div className="md:col-span-8 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-6">Descripción</h3>
              <p className="text-[16px] text-[#666] leading-relaxed whitespace-pre-line font-medium">{vehicle.descripcion || "Sin descripción adicional."}</p>
            </div>
            <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-8">Características principales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
                {[{ l: "Marca", v: vehicle.marca }, { l: "Modelo", v: vehicle.modelo }, { l: "Año", v: vehicle.anio }, { l: "Kilómetros", v: vehicle.km?.toLocaleString('de-DE') + " km" }, { l: "Versión", v: vehicle.version }].map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-gray-100 pb-3 mr-8">
                    <span className="text-[13px] font-bold text-gray-400 uppercase">{item.l}</span>
                    <span className="text-[15px] font-medium text-gray-700 mt-1 uppercase">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 w-full">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-500" /> Consejos de seguridad</h4>
              <ul className="flex flex-col gap-4 text-[13px] text-gray-600">
                <li className="flex gap-2 font-medium"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> Desde Hotcars, nunca te pediremos contraseñas, PIN o códigos de verificación a través de WhatsApp, teléfono, SMS o email.</li>
                <li className="flex gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> No hagas pagos anticipados para garantizar la negociación sin antes ver el vehículo.</li>
                <li className="flex gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" /> HotCars no tiene vehículos bajo su custodia.</li>
                <li className="flex gap-2 bg-amber-50 p-4 rounded-lg border border-amber-100 text-[#856404] leading-relaxed">
                  <AlertCircle size={24} className="flex-shrink-0 mt-0.5" /> 
                  <span><strong>Regla Flipper:</strong> Solo permitida la difusión en web personal de HotCars, estados o historias en redes. Prohibido republicar en otros marketplaces o modificar condiciones sin previa aprobación.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
          <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110] cursor-pointer"><X size={32} /></button>
          <img src={vehicle.fotos?.[selectedImageIndex]} alt="Gallery" className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
        </div>
      )}
    </main>
  );
}