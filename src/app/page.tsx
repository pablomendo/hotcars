'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, Instagram, Facebook, MessageCircle, Send, Eye, MapPin } from 'lucide-react';

export default function MarketplaceDashboard() {
  const [inv, setInv] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { name: "AUTO", label: "Autos", img: "/slider_front/vw_gol.jpeg" },
    { name: "PICKUP", label: "Pickups", img: "/slider_front/hilux1.jpg" },
    { name: "SUV", label: "SUVs", img: "/slider_front/corolla_cross1.jpg" },
    { name: "UTILITARIO", label: "Utilitarios", img: "/slider_front/kangoo.jpeg" },
    { name: "CAMION", label: "Camiones", img: "/slider_front/iveco1.jpg" },
    { name: "MOTO", label: "Motos", img: "/slider_front/moto.jpg" },
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
      const vCat = v.categoria?.toUpperCase() || "";
      const matchCat = selectedCategory ? vCat.includes(selectedCategory) : true;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory, inv]);

  if (isLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#e2e8f0]">
      <Loader2 className="animate-spin text-[#288b55] w-10 h-10" />
    </div>
  );

  return (
    <main 
      className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans tracking-tight overflow-x-hidden cursor-default"
      onClick={() => setSelectedCategory(null)}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        img {
          display: block;
          max-width: 100%;
        }
      `}</style>
      
      <nav 
        className="flex justify-between items-center p-4 md:p-6 bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#0f172a]">
          HOTCARS <span className="text-[#2596be]">PRO</span>
        </h1>
        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 border border-gray-300 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 uppercase">
          PABLO MENDO
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="w-full relative flex flex-col bg-[#288b55] overflow-hidden">
        <div className="md:hidden w-full aspect-[9/16] relative">
          <img src="/hero-mobile-hotcars.jpg" alt="Hero Mobile" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto">
              <p className="text-white text-center font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight mb-4 px-2">
                Profesionalizate, publicá, compartí y gestioná tu inventario con tu propia web de <span className="text-white italic uppercase">HOT</span><span className="text-[#288b55] italic uppercase">CARS</span>
              </p>
              <button className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm">Registrate</button>
              <button className="w-full py-4 bg-white text-[#0f172a] font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm border-2 border-white">Ingresar</button>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-full overflow-hidden relative">
          <img src="/hero-desktop-hotcars.jpg" alt="Hero Desktop" className="w-full h-auto object-cover align-top" />
          <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24 pointer-events-none">
            <h1 className="font-black tracking-tighter uppercase text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] mb-4 leading-tight text-[42px]">
              BIENVENIDOS AL <br />
              <span className="text-[#288b55]">MARKETPLACE</span> <span className="text-white">DE</span> <span className="text-[#288b55] italic">HOT</span><span className="text-white italic">CARS</span>
            </h1>
            <div className="space-y-1 text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-normal max-w-2xl">
              <p>• Obten mejores ofertas</p>
              <p>• Comparte publicaciones con reglas claras</p>
              <p>• Prefesionalizate con tu propia pagina web</p>
              <p className="mt-4 text-xl">¿Lead caliente por un color o versión que no tenés?</p>
              <p className="font-medium opacity-90 leading-relaxed">Usá el inventario de HotCars, compartí las publicaciones en tu web <br />y transformá consultas en ventas seguras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FRANJA VERDE (CATEGORÍAS) --- */}
      <section className="w-full bg-[#288b55] py-12 md:py-20 relative"> 
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h2 
            className="text-center text-white uppercase italic mb-8 md:mb-12 tracking-tighter text-2xl md:text-[36px]"
            style={{ fontFamily: "'Genos', sans-serif" }}
          >
            ¿Qué categoría estás buscando?
          </h2>
          
          <div className="grid grid-cols-2 md:flex md:justify-center items-center gap-6 md:gap-12">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(cat.name);
                }}
                className="flex flex-col items-center cursor-pointer text-center group"
              >
                <div className="w-full flex justify-center items-center h-32 md:h-48">
                  <img 
                    src={cat.img} 
                    alt={cat.label} 
                    className={`max-h-full w-auto object-contain transition-transform duration-300
                      ${cat.name === 'MOTO' ? 'scale-[0.9] md:scale-100' : ''}
                      ${selectedCategory === cat.name ? 'scale-110 brightness-110 drop-shadow-2xl' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`} 
                  />
                </div>
                <p 
                  className="text-white text-[11px] md:text-[14px] font-bold uppercase tracking-widest italic mt-4"
                  style={{ fontFamily: "'Genos', sans-serif" }}
                >
                  {cat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- INVENTARIO --- */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 md:mt-12 pb-24" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center border-b border-gray-400 pb-6 mb-8 md:mb-10 gap-4 md:gap-6">
          <h2 className="italic uppercase font-medium text-[#0f172a] text-center text-2xl md:text-[36px]" style={{ fontFamily: "'Genos', sans-serif" }}>
            Inventario de toda la red
          </h2>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar unidad..." 
              className="bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#288b55] w-full shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
          {filteredVehicles.map((v) => (
            <div key={v.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {v.fotos?.[0] ? <img src={v.fotos[0]} alt="" className="w-full h-full object-cover align-top" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>}
              </div>
              <div className="p-3 md:p-5 flex-grow">
                <h3 className="text-xs md:text-lg font-bold tracking-tight uppercase truncate text-[#0f172a] mb-0.5">{v.marca} {v.modelo}</h3>
                <div className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase mb-1">{v.anio} • {v.km} KM</div>
                <div className="flex items-center gap-1 text-gray-400 mb-2 font-bold uppercase text-[7px] md:text-[9px]">
                  <MapPin size={10} /> <span className="truncate">{v.localidad || 'Ubicación'}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#288b55] font-black text-sm md:text-xl">{v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('de-DE')}</span>
                </div>
                <button className="w-full py-2 bg-[#0f172a] hover:bg-[#288b55] transition-all rounded-lg flex items-center justify-center gap-2 text-white font-black text-[9px] md:text-xs uppercase shadow-md">
                  <Eye size={12} /> Ver Detalle
                </button>
              </div>
              <div className="grid grid-cols-4 border-t border-gray-200 divide-x divide-gray-200 h-10 md:h-12 bg-[#e2e8f0]">
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#0f172a]">
                  <Instagram size={14} /><span className="text-[7px] font-bold uppercase mt-0.5">Instagram</span>
                </button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#0f172a]">
                  <Facebook size={14} /><span className="text-[7px] font-bold uppercase mt-0.5">Facebook</span>
                </button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#25d366]">
                  <MessageCircle size={14} /><span className="text-[7px] font-bold uppercase mt-0.5">WhatsApp</span>
                </button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#2596be]">
                  <Send size={14} /><span className="text-[7px] font-bold uppercase mt-0.5">Mensaje</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}