'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, Loader2, Car, MapPin, Trash2, TrendingUp, ChevronRight } from 'lucide-react';

export default function FavoritosPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      await fetchFavorites(user.id);
      setLoading(false);
    };
    init();
  }, []);

  const fetchFavorites = async (uid: string) => {
    const { data, error } = await supabase
      .from('favoritos')
      .select('id, auto_id, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error || !data?.length) { setFavorites([]); return; }

    const autoIds = data.map((f: any) => f.auto_id);
    const { data: autos } = await supabase
      .from('inventario')
      .select('id, marca, modelo, anio, km, pv, moneda, fotos, localidad, provincia, version, ganancia_flipper, ganancia_dueno, owner_user_id')
      .in('id', autoIds);

    const autosMap: Record<string, any> = {};
    for (const a of autos || []) autosMap[a.id] = a;

    setFavorites(data.map((f: any) => ({ ...f, auto: autosMap[f.auto_id] || null })).filter((f: any) => f.auto));
  };

  const handleRemove = async (favId: string, autoId: string) => {
    if (!userId) return;
    setRemoving(autoId);
    await supabase.from('favoritos').delete().eq('id', favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
    setRemoving(null);
  };

  const getGanancia = (auto: any) => {
    const isOwn = auto.owner_user_id === userId;
    const value = isOwn ? auto.ganancia_dueno : auto.ganancia_flipper;
    const label = isOwn ? 'Tu ganancia' : 'Ganancia flipper';
    return { value, label };
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
      <Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" />
    </div>
  );

  return (
    <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans flex flex-col">
      <style jsx global>{`
        @font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }
      `}</style>

      {/* Subheader */}
      <div className="fixed top-[88px] lg:top-20 left-0 right-0 z-[40] bg-[#1c2e38] border-b border-white/5 px-6 py-3 flex items-center justify-center gap-3">
        <Heart size={14} className="text-red-400 fill-red-400" />
        <span style={{ fontFamily: 'Genos' }} className="text-white text-[14px] font-light tracking-[4px] uppercase opacity-40">Favoritos</span>
        <span className="text-[10px] font-black text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded uppercase tracking-widest">
          {favorites.length} guardado{favorites.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="pt-[144px] lg:pt-[120px] pb-24 lg:pb-8 max-w-3xl mx-auto w-full px-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] opacity-30 gap-4">
            <Heart size={48} className="text-slate-500" />
            <span className="text-[13px] font-black uppercase tracking-widest text-slate-500">No tenés favoritos guardados</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0 mt-4 bg-[#0d1518] border border-white/5 rounded-2xl overflow-hidden">
            {favorites.map(({ id, auto }, index) => {
              const { value: ganancia, label: gananciaLabel } = getGanancia(auto);
              return (
                <div
                  key={id}
                  className={`flex gap-4 p-4 hover:bg-white/[0.02] transition-all ${index !== 0 ? 'border-t border-white/5' : ''}`}
                >
                  {/* Foto */}
                  <div
                    className="w-24 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer"
                    onClick={() => router.push(`/vehiculos/${auto.id}`)}
                  >
                    {auto.fotos?.[0] ? (
                      <img src={auto.fotos[0]} alt={`${auto.marca} ${auto.modelo}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Car size={24} className="text-slate-600" /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/vehiculos/${auto.id}`)}>
                    <h3 className="text-[13px] font-black text-white uppercase tracking-tight truncate">{auto.marca} {auto.modelo}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase truncate mb-1">{auto.version}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold mb-2">
                      <MapPin size={9} /> {auto.localidad}, {auto.provincia}
                    </div>
                    <span className="text-[16px] font-black text-white tracking-tighter">
                      {auto.moneda === 'USD' ? 'U$S' : '$'} {Number(auto.pv).toLocaleString('de-DE')}
                    </span>
                    {ganancia && (
                      <div className="flex items-center gap-1 text-[#22c55e] text-[11px] font-bold mt-1">
                        <TrendingUp size={12} />
                        {gananciaLabel}: {auto.moneda === 'USD' ? 'U$S' : '$'} {Number(ganancia).toLocaleString('de-DE')}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5">{auto.anio} · {Number(auto.km).toLocaleString('de-DE')} km</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <button
                      onClick={() => handleRemove(id, auto.id)}
                      disabled={removing === auto.id}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                      title="Eliminar de favoritos"
                    >
                      {removing === auto.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                    <ChevronRight size={16} className="text-slate-600 cursor-pointer" onClick={() => router.push(`/vehiculos/${auto.id}`)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}