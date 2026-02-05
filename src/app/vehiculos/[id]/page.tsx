'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, MapPin, MessageCircle, Share2, 
  Edit3, RefreshCw, Heart, Handshake, CheckCircle2, User, X, ChevronLeft, ChevronRight, Image as ImageIcon
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') setSelectedImageIndex(null);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const nextImage = () => {
    if (selectedImageIndex !== null && vehicle.fotos) {
      setSelectedImageIndex((selectedImageIndex + 1) % vehicle.fotos.length);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null && vehicle.fotos) {
      setSelectedImageIndex((selectedImageIndex - 1 + vehicle.fotos.length) % vehicle.fotos.length);
    }
  };

  const handleGeneratePoster = () => {
    const rawFoto = vehicle.fotos?.[0] || '';
    const fotoLimpia = rawFoto.split('?')[0]; 

    const query = new URLSearchParams({
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      version: vehicle.version || '',
      precio: Number(vehicle.pv || 0).toLocaleString('de-DE'),
      moneda: vehicle.moneda === 'USD' ? 'U$S' : '$',
      km: vehicle.km?.toLocaleString('de-DE') || '0',
      anio: vehicle.anio?.toString() || '',
      foto: fotoLimpia 
    }).toString();

    window.open(`/api/og?${query}`, '_blank');
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-[#e2e8f0]"><Loader2 className="animate-spin text-[#288b55] w-10 h-10" /></div>;
  if (!vehicle) return <div className="p-10 text-center uppercase font-bold">Vehículo no encontrado</div>;

  const isOwner = user && user.id === vehicle.owner_user_id;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-20 font-sans">
      <nav className="bg-white p-3 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <h1 className="font-black uppercase text-base tracking-tighter ml-4">HOTCARS <span className="text-[#2596be]">PRO</span></h1>
        <button 
          onClick={() => router.back()} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
        >
          Cerrar <X size={18} />
        </button>
      </nav>

      <div className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        <section className="flex flex-col gap-4">
          <div 
            onClick={() => setSelectedImageIndex(0)}
            className="rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-200 border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
          >
            <img src={vehicle.fotos?.[0]} className="w-full h-full object-cover" alt="Principal" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {vehicle.fotos?.slice(1, 6).map((f: string, i: number) => (
              <img 
                key={i} 
                src={f} 
                onClick={() => setSelectedImageIndex(i + 1)}
                className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0 cursor-pointer hover:border-[#288b55] transition-colors" 
                alt="Mini" 
              />
            ))}
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-grow">
            <h3 className="font-black text-[10px] uppercase text-[#288b55] mb-3 tracking-widest">Descripción</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {vehicle.descripcion && vehicle.descripcion.trim() !== "" ? vehicle.descripcion : "El vendedor no agregó descripción"}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative h-full flex flex-col justify-between">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-6 right-6 p-2 rounded-full border border-gray-100 shadow-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Heart size={20} className={isFavorite ? "fill-[#288b55] text-[#288b55]" : "text-gray-300"} />
            </button>

            <div>
              <div className="pr-10">
                {/* TÍTULO CON AÑO INCORPORADO */}
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
                  {vehicle.marca} {vehicle.modelo} <span className="text-gray-400 ml-1">{vehicle.anio}</span>
                </h1>
                
                {/* DATOS TÉCNICOS INMEDIATOS */}
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[#0f172a] font-black uppercase text-[12px] tracking-wide">
                     {vehicle.km?.toLocaleString('de-DE')} KM
                   </p>
                </div>

                {/* VERSIÓN DEBAJO */}
                <p className="text-[#2596be] font-bold uppercase text-[11px] tracking-widest mt-1 mb-3">
                  {vehicle.version}
                </p>

                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase">
                  <MapPin size={14}/> {vehicle.localidad}, {vehicle.provincia}
                </div>
              </div>

              <div className="mt-6 mb-6">
                <span className="text-3xl font-black text-[#288b55] tracking-tighter">
                  {vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.pv).toLocaleString('de-DE')}
                </span>
              </div>

              {user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {isOwner ? (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tu Ganancia Dueño</p>
                      <p className="text-lg font-black text-[#2596be]">{vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.ganancia_dueno || 0).toLocaleString('de-DE')}</p>
                    </div>
                  ) : (user.rol === 'vip' || user.rol === 'agencia') && (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ganancia Flipper</p>
                      <p className="text-lg font-black text-[#288b55]">{vehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(vehicle.ganancia_flipper || 0).toLocaleString('de-DE')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-[#288b55] text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#227a4a] transition-colors cursor-pointer">
                <MessageCircle size={18}/> Contactar por WhatsApp
              </button>
              
              {user && !isOwner && (
                <button className="w-full py-3 border-2 border-gray-100 text-[#0f172a] rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-all cursor-pointer">
                  <Handshake size={18} className="text-[#2596be]"/> Solicitar Flip Compartido
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleGeneratePoster}
                  className="py-3 bg-[#0f172a] text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all cursor-pointer"
                >
                  <ImageIcon size={16}/> Placa Instagram
                </button>
                <button className="py-3 border-2 border-gray-100 text-gray-400 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all">
                  <Share2 size={16}/> Compartir
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-1 md:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-black text-[10px] uppercase text-[#288b55] mb-4 tracking-wider">Ficha Técnica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {[
                { l: "Marca", v: vehicle.marca },
                { l: "Modelo", v: vehicle.modelo },
                { l: "Versión", v: vehicle.version },
                { l: "Año", v: vehicle.anio },
                { l: "Kilómetros", v: vehicle.km?.toLocaleString() },
                { l: "Categoría", v: vehicle.categoria },
                { l: "Moneda", v: vehicle.moneda },
                { l: "Provincia", v: vehicle.provincia },
                { l: "Localidad", v: vehicle.localidad }
              ].map((item, i) => (
                <div key={i} className="flex justify-between border-b border-gray-50 pb-1.5">
                  <span className="text-[11px] text-gray-400 uppercase font-bold">{item.l}</span>
                  <span className="text-[11px] font-black uppercase text-right ml-2 truncate">{item.v || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-300"><User size={20}/></div>
              <div className="flex-grow">
                <div className="flex items-center gap-1">
                  <p className="font-black uppercase text-xs">{ownerProfile?.nombre || 'Usuario HotCars'}</p>
                  <CheckCircle2 size={12} className="text-[#2596be]"/>
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{ownerVehicleCount} {ownerVehicleCount === 1 ? 'vehículo publicado' : 'vehículos publicados'}</p>
              </div>
            </div>

            {isOwner && (
              <div className="p-4 bg-white border-2 border-dashed border-[#2596be]/20 rounded-xl flex flex-col sm:flex-row gap-2 flex-1 items-center justify-center">
                <button className="py-2.5 px-4 bg-[#0f172a] text-white rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-2 cursor-pointer hover:bg-black transition-all"><Edit3 size={14}/> Editar</button>
                <button className="py-2.5 px-4 border border-gray-200 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all"><RefreshCw size={14}/> Estado</button>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200" onClick={() => setSelectedImageIndex(null)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors p-2 z-[110] cursor-pointer"><X size={32} /></button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 md:left-10 text-white/50 hover:text-white transition-colors p-2 cursor-pointer"><ChevronLeft size={48} /></button>
          <img src={vehicle.fotos?.[selectedImageIndex]} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none" alt="Vista" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 md:right-10 text-white/50 hover:text-white transition-colors p-2 cursor-pointer"><ChevronRight size={48} /></button>
        </div>
      )}
    </main>
  );
}