'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, MapPin, MessageCircle, Share2, 
  RefreshCw, Heart, Handshake, CheckCircle2, User, ChevronLeft, ChevronRight, 
  Image as ImageIcon, Car, Calendar, Gauge, Settings, Tag, TrendingUp, X
} from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ownerVehicleCount, setOwnerVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // 1) Estado para la galería fullscreen
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data: vData, error: vError } = await supabase
        .from('inventario')
        .select('*')
        .eq('id', params.id)
        .single();

      if (vError) throw vError;
      setVehicle(vData);

      if (vData?.owner_user_id) {
        const [profileRes, countRes] = await Promise.all([
          supabase.from('usuarios').select('nombre, rol').eq('id', vData.owner_user_id).single(),
          supabase.from('inventario').select('*', { count: 'exact', head: true }).eq('owner_user_id', vData.owner_user_id)
        ]);
        setOwnerProfile(profileRes.data);
        setOwnerVehicleCount(countRes.count || 0);
      }
    } catch (err) {
      console.error("Error HotCars:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchVehicleData(); }, [fetchVehicleData, params.id]);

  const nextImage = () => {
    if (vehicle?.fotos) {
      setSelectedImageIndex((selectedImageIndex + 1) % vehicle.fotos.length);
    }
  };

  const prevImage = () => {
    if (vehicle?.fotos) {
      setSelectedImageIndex((selectedImageIndex - 1 + vehicle.fotos.length) % vehicle.fotos.length);
    }
  };

  const handleGeneratePoster = () => {
    if (!vehicle) return;
    const t = Date.now();
    const url = `/api/og?id=${vehicle.id}&t=${t}`;
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.focus();
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
      <Loader2 className="animate-spin text-[#288b55] w-8 h-8" />
    </div>
  );
  
  if (!vehicle) return null;

  const isOwner = user?.id === vehicle.owner_user_id;
  const displayProfit = isOwner ? vehicle.ganancia_dueno : vehicle.ganancia_flipper;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-8 font-sans overflow-x-hidden relative">
      
      <nav className="bg-white p-2.5 shadow-sm sticky top-0 z-[60] flex justify-between items-center">
        <h1 className="font-black uppercase text-sm tracking-tighter ml-3 italic">HOTCARS <span className="text-[#2596be] not-italic">PRO</span></h1>
      </nav>

      <div className="max-w-[920px] mx-auto mt-[96px] px-3 flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          <section className="md:col-span-7 flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden shadow-sm bg-gray-200 border border-gray-100 cursor-pointer group flex-1 min-h-[400px]">
              {/* 2) Trigger para abrir galería al hacer click en el área de la imagen */}
              <div className="absolute inset-0 z-10" onClick={() => setIsGalleryOpen(true)}></div>
              
              <img 
                src={vehicle.fotos?.[selectedImageIndex]} 
                className="w-full h-full object-cover absolute inset-0" 
                alt="Principal" 
              />
              
              {vehicle.fotos?.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-md z-20"><ChevronLeft size={16}/></button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-md z-20"><ChevronRight size={16}/></button>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className={`py-4 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${vehicle.acepta_permuta ? 'bg-white border-[#288b55]/20 shadow-sm' : 'bg-gray-50 border-gray-50 opacity-40'}`}>
                <RefreshCw size={18} className={vehicle.acepta_permuta ? 'text-[#288b55]' : 'text-gray-400'} />
                <span className={`text-[12px] font-black uppercase tracking-tight ${vehicle.acepta_permuta ? 'text-[#0f172a]' : 'text-gray-400'}`}>Acepta Permuta</span>
              </div>
              <div className={`py-4 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${vehicle.financiacion ? 'bg-white border-[#288b55]/20 shadow-sm' : 'bg-gray-50 border-gray-50 opacity-40'}`}>
                <Handshake size={18} className={vehicle.financiacion ? 'text-[#288b55]' : 'text-gray-400'} />
                <span className={`text-[12px] font-black uppercase tracking-tight ${vehicle.financiacion ? 'text-[#0f172a]' : 'text-gray-400'}`}>Financiación</span>
              </div>
            </div>
          </section>

          <section className="md:col-span-5 flex flex-col gap-3">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative flex-1 flex flex-col justify-between">
              <button onClick={() => setIsFavorite(!isFavorite)} className="absolute top-5 right-5 p-1.5 rounded-full border border-gray-100 shadow-sm transition-all cursor-pointer">
                <Heart size={16} className={isFavorite ? "fill-[#288b55] text-[#288b55]" : "text-gray-300"} />
              </button>

              <div className="pr-8">
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#0f172a]">
                  {vehicle.marca} {vehicle.modelo} <span className="text-gray-600 font-black ml-1">{vehicle.anio}</span>
                </h1>
                
                {/* Bloque de Kilometraje solicitado */}
                <div className="flex items-center gap-1 text-gray-500 text-[12px] font-bold uppercase mt-0.5">
                  <Gauge size={12} className="text-[#288b55]" />
                  {Number(vehicle.km).toLocaleString('de-DE')} KM
                </div>

                <p className="text-[#2596be] font-bold uppercase text-[13px] tracking-widest mt-1 mb-2.5">{vehicle.version}</p>
                <div className="flex items-center gap-1 text-gray-400 text-[11px] font-bold uppercase"><MapPin size={11}/> {vehicle.localidad}, {vehicle.provincia}</div>
              </div>

              <div>
                <div className="mt-5 mb-1">
                  <span className="text-3xl font-black text-[#288b55] tracking-tighter">
                    {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
                  </span>
                </div>
                {displayProfit && (
                  <div className="flex items-center gap-1 text-[#288b55] mb-4">
                    <TrendingUp size={12} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                      {isOwner ? 'Tu Ganancia' : 'Ganancia Flipper'}: ${Number(displayProfit).toLocaleString('de-DE')}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  <button className="w-full py-3 bg-[#288b55] text-white rounded-xl font-black uppercase text-[13px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                    <MessageCircle size={14}/> Contactar por WhatsApp
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={handleGeneratePoster} className="py-2.5 bg-[#0f172a] text-white rounded-xl font-black uppercase text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md"><ImageIcon size={13}/> Placa IG</button>
                    <button className="py-2.5 border-2 border-gray-100 text-gray-400 rounded-xl font-black uppercase text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"><Share2 size={13}/> Compartir</button>
                  </div>
                </div>
              </div>
            </div>

            {ownerProfile && (
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="bg-[#f1f5f9] p-2 rounded-full text-[#288b55] shadow-sm"><User size={16} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Vendedor</span>
                  <h4 className="font-black uppercase text-[13px] text-[#0f172a] leading-tight mt-1">{ownerProfile.nombre}</h4>
                  <span className="text-[10px] font-bold text-[#2596be] uppercase">{ownerVehicleCount} unidades publicadas</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-[11px] uppercase text-[#288b55] mb-2.5 tracking-widest">Descripción</h3>
          <p className="text-[16px] text-gray-600 leading-relaxed whitespace-pre-line font-medium">
            {vehicle.descripcion || "Sin descripción adicional."}
          </p>
        </div>

        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-[11px] uppercase text-[#288b55] mb-5 tracking-widest">Ficha Técnica</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { l: "Marca", v: vehicle.marca, i: <Car size={16} className="text-[#288b55]" /> },
              { l: "Modelo", v: vehicle.modelo, i: <Tag size={16} className="text-[#288b55]" /> },
              { l: "Versión", v: vehicle.version, i: <Settings size={16} className="text-[#288b55]" /> },
              { l: "Año", v: vehicle.anio, i: <Calendar size={16} className="text-[#288b55]" /> },
              { l: "Kilómetros", v: vehicle.km?.toLocaleString('de-DE'), i: <Gauge size={16} className="text-[#288b55]" /> }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {item.i}
                  <span className="text-[13px] font-bold text-gray-700">{item.l}</span>
                </div>
                <div className="bg-[#f1f5f9] px-2.5 py-1.5 rounded-full border border-gray-50 flex items-center min-h-[40px]">
                  <span className="text-[12px] font-normal text-[#0f172a] leading-tight break-words capitalize">
                    {item.v?.toLowerCase() || '-'}
                  </span>
                </div>
              </div>
            ))}
            {vehicle.puntos_clave && vehicle.puntos_clave
              .filter((p: string) => p !== "Acepta permuta" && p !== "Financiación")
              .map((punto: string, idx: number) => (
              <div key={`punto-${idx}`} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#288b55]" />
                  <span className="text-[13px] font-bold text-gray-700">Equipamiento</span>
                </div>
                <div className="bg-[#f1f5f9] px-2.5 py-1.5 rounded-full border border-gray-100 flex items-center min-h-[40px]">
                  <span className="text-[12px] font-normal text-[#0f172a] leading-tight break-words capitalize">
                    {punto.toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3) Bloque Modal Gallery Fullscreen */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
          <button 
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110]"
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {vehicle.fotos?.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 md:left-8 text-white p-3 z-[110] bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/10"
                >
                  <ChevronLeft size={32}/>
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 md:right-8 text-white p-3 z-[110] bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/10"
                >
                  <ChevronRight size={32}/>
                </button>
              </>
            )}

            <img 
              src={vehicle.fotos?.[selectedImageIndex]} 
              alt="Gallery view" 
              className="max-w-full max-h-[85vh] object-contain select-none"
            />
            
            <div className="absolute bottom-8 text-white/60 font-black text-sm tracking-widest uppercase">
              {selectedImageIndex + 1} / {vehicle.fotos?.length}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}