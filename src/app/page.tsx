'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2 } from 'lucide-react';

export default function MarketplaceDashboard() {
  const [inv, setInv] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('AUTO');

  const categories = [
    { name: "AUTO", label: "Autos", img: "/vw_gol1.png" },
    { name: "PICKUP", label: "Pickups", img: "/hilux1.png" },
    { name: "SUV", label: "SUVs", img: "/corolla_cross1.png" },
    { name: "UTILITARIO", label: "Utilitarios", img: "/kangoo.png" },
    { name: "CAMION", label: "Camiones", img: "/iveco1.png" },
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('inventory_status', 'activo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInv(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return inv.filter(v => {
      const matchSearch = `${v.marca} ${v.modelo}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = v.categoria?.toUpperCase() === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory, inv]);

  if (isLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
      <Loader2 className="animate-spin text-[#288b55] w-10 h-10" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0b1114] text-white font-sans tracking-tight overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <nav className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
          HOTCARS <span className="text-[#2596be]">PRO</span>
        </h1>
        <div className="px-4 py-2 bg-[#1a2c38] border border-white/10 rounded-xl text-xs font-bold text-gray-400">
          PABLO MENDO
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[60vh] flex flex-col items-start justify-center text-left overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="/front_verde.png" 
            alt="Hero" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="relative z-10 w-full px-12 lg:px-24">
          <div className="max-w-2xl">
            {/* SOMBRA APLICADA AL TITULO */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-tight uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              Bienvenidos al <br />
              <span className="text-[#288b55] drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
                Marketplace de Hotcars
              </span>
            </h1>
            <div className="space-y-2 text-sm md:text-base font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <p>• Obtén las mejores ofertas</p>
              <p>• Comparte publicaciones con reglas claras</p>
              <p>• Profesionalizate con tu propia página web</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY RAIL (FONDO VERDE LIMPIO SIN SOMBRAS) --- */}
      <section className="w-full bg-[#288b55] py-10 relative">
        <div className="max-w-[1600px] mx-auto px-8">
          <h2 className="text-white text-lg font-black tracking-[0.15em] mb-10 text-center uppercase drop-shadow-md">
            Buscador por categoría
          </h2>
          
          <div className="flex justify-start lg:justify-center items-center gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {categories.map((cat, idx) => {
              const isActive = selectedCategory === cat.name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`relative flex-none w-[240px] h-[130px] rounded-xl overflow-hidden snap-start cursor-pointer group transition-all duration-300 border-2 ${isActive ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}
                >
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* ELIMINADA LA SOMBRA NEGRA (OVERLAY) */}
                  <div className="absolute bottom-2 left-0 w-full bg-black/40 py-1 text-center">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest italic">
                      {cat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- INVENTARIO --- */}
      <div className="max-w-[1400px] mx-auto px-8 mt-16 pb-24">
        <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tighter italic uppercase text-white">Inventario de Red</h2>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
              Filtro: <span className="text-[#288b55] font-bold">{selectedCategory}</span>
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-[#288b55] transition-all text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((v) => (
            <div key={v.id} className="group bg-[#1a2c38] border border-white/5 rounded-3xl overflow-hidden hover:border-[#288b55]/40 transition-all duration-500">
              <div className="h-52 bg-[#0b1114] relative overflow-hidden">
                {v.fotos?.[0] ? (
                  <img src={v.fotos[0]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold uppercase italic text-[10px]">Sin Foto</div>
                )}
                <div className="absolute top-4 right-4 bg-[#288b55] text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                  {v.inventory_status}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold tracking-tight uppercase truncate mr-2 text-white">{v.marca} {v.modelo}</h3>
                  <span className="text-[#288b55] font-black text-lg whitespace-nowrap">
                    {v.moneda === 'USD' ? 'USD' : '$'} {(Number(v.pv) || 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex gap-3 mb-6 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <span>{v.anio}</span>
                  <span>•</span>
                  <span>{(Number(v.km) || 0).toLocaleString('es-AR')} KM</span>
                </div>
                <button className="w-full py-3 bg-white text-black rounded-xl font-black text-[10px] hover:bg-[#288b55] hover:text-white transition-colors uppercase tracking-widest">
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}