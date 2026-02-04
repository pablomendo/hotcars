'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, Instagram, Facebook, MessageCircle, Send, Eye, MapPin, X, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import dbAutos from '@/app/api/base-autos/db_7f8e9a2b1c4d.json';

export default function MarketplaceDashboard() {
  const [inv, setInv] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [monedaFiltro, setMonedaFiltro] = useState('USD');
  
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [ticketData, setTicketData] = useState({
    marca: '',
    modelo: '',
    version: '',
    presupuesto: '',
    moneda: 'USD'
  });

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
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

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

  const resetAllFilters = () => {
    setSelectedCategory(null);
    setSearch('');
  };

  const dataVehiculos = useMemo(() => {
    if (Array.isArray(dbAutos)) return dbAutos;
    return dbAutos?.autos || [];
  }, []);

  const opcionesMarca = useMemo(() => [...new Set(dataVehiculos.map(item => item.marca))], [dataVehiculos]);
  const opcionesModelo = useMemo(() => {
    if (!ticketData.marca) return [];
    return [...new Set(dataVehiculos.filter(item => item.marca === ticketData.marca).map(item => item.modelo))];
  }, [ticketData.marca, dataVehiculos]);
  const opcionesVersion = useMemo(() => {
    if (!ticketData.marca || !ticketData.modelo) return [];
    return [...new Set(dataVehiculos.filter(item => item.marca === ticketData.marca && item.modelo === ticketData.modelo).map(item => item.version))];
  }, [ticketData.marca, ticketData.modelo, dataVehiculos]);

  const filteredVehicles = useMemo(() => {
    return inv.filter(v => {
      const matchSearch = `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? v.categoria?.toUpperCase() === selectedCategory : true;
      const matchMoneda = selectedCategory ? v.moneda === monedaFiltro : true;
      return matchSearch && matchCat && matchMoneda;
    });
  }, [search, selectedCategory, inv, monedaFiltro]);

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#e2e8f0]"><Loader2 className="animate-spin text-[#288b55] w-10 h-10" /></div>;

  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans tracking-tight overflow-x-hidden cursor-default">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        img { display: block; max-width: 100%; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center p-4 md:p-6 bg-white sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#0f172a]">HOTCARS <span className="text-[#2596be]">PRO</span></h1>
        <div className="px-3 py-1.5 bg-gray-200 border border-gray-300 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 uppercase">PABLO MENDO</div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="w-full relative flex flex-col bg-[#288b55] overflow-hidden -mt-[1px] z-10">
        <div className="md:hidden w-full aspect-[9/16] relative">
          <img src="/hero-mobile-hotcars.jpg" alt="Hero Mobile" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto">
              <p className="text-white text-center font-bold text-lg drop-shadow-[0_2px_4_rgba(0,0,0,0.9)] leading-tight mb-4 px-2">
                Profesionalizate, publicá, compartí y gestioná tu inventario con tu propia web de <span className="text-white italic uppercase">HOT</span><span className="text-[#288b55] italic uppercase">CARS</span>
              </p>
              <button className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm hover:scale-105 transition-transform">Registrate</button>
              <button className="w-full py-4 bg-white/20 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm border border-white/30 backdrop-blur-sm">Ingresar</button>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-full overflow-hidden relative">
          <img src="/hero-desktop-hotcars.jpg" alt="Hero Desktop" className="w-full h-auto object-cover align-top" />
          <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24 pointer-events-none">
            <h1 className="font-black tracking-tighter uppercase text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] mb-4 leading-tight text-[42px]">
              BIENVENIDO AL <span className="text-[#288b55]">MARKETPLACE</span> <br />
              <span className="text-white">DE </span><span className="text-[#288b55]">HOT</span><span className="text-white">CARS</span>
            </h1>
            <div className="space-y-1 text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-normal max-w-2xl mb-8">
              <p>• Obten mejores ofertas</p>
              <p>• Comparte publicaciones con reglas claras</p>
              <p>• Profesionalizate con tu propia pagina web</p>
              <p className="mt-4 text-xl">¿Lead caliente por un color o versión que no tenés?</p>
              <p className="font-medium opacity-90 leading-relaxed">Usá el inventario de HotCars, compartí las publicaciones en tu web <br />y transformá consultas en ventas seguras.</p>
            </div>
            <div className="flex gap-4 pointer-events-auto">
              <button className="px-12 py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm hover:scale-105 transition-transform">Registrate</button>
              <button className="px-12 py-4 bg-white/20 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-all">Ingresar</button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORÍAS --- */}
      <section className="w-full bg-[#288b55] py-12 md:py-20 relative"> 
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h2 className="text-center text-white uppercase italic mb-8 md:mb-12 tracking-tighter text-2xl md:text-[36px]" style={{ fontFamily: "'Genos', sans-serif" }}>
            ¿Qué categoría estás buscando?
          </h2>
          <div className="grid grid-cols-2 md:flex md:justify-center items-center gap-6 md:gap-12">
            {categories.map((cat, idx) => (
              <div key={idx} onClick={() => setSelectedCategory(cat.name)} className="flex flex-col items-center cursor-pointer text-center group">
                <div className="w-full flex justify-center items-center h-32 md:h-48">
                  <img src={cat.img} alt={cat.label} className={`max-h-full w-auto object-contain transition-transform duration-300 ${selectedCategory === cat.name ? 'scale-110 brightness-110 drop-shadow-2xl' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`} />
                </div>
                <p className="text-white text-[11px] md:text-[14px] font-bold uppercase tracking-widest italic mt-4" style={{ fontFamily: "'Genos', sans-serif" }}>{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- INVENTARIO --- */}
      <div className="w-full mt-8 md:mt-12 pb-24">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-center relative mb-8 gap-4">
          <h2 className="italic uppercase font-medium text-[#0f172a] text-center text-2xl md:text-[36px]" style={{ fontFamily: "'Genos', sans-serif" }}>
            {selectedCategory ? `${categories.find(c => c.name === selectedCategory)?.label} disponibles` : "Inventario de toda la red"}
          </h2>
          {selectedCategory && <button onClick={resetAllFilters} className="text-gray-400 hover:text-red-600 transition-colors"><X size={28} /></button>}
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex justify-center mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="¿Qué modelo tenés en mente?" className="bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm w-full outline-none focus:border-[#288b55]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6 items-start">
          
          {/* TICKET DE RED: FIJO 330PX */}
          {selectedCategory && (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col shadow-sm h-[330px] w-full">
              <div className="flex flex-col items-center w-full cursor-pointer mb-2 flex-shrink-0" onClick={() => setIsOpenMobile(!isOpenMobile)}>
                <Bell className="text-[#288b55] mb-1 w-8 h-8 md:w-10 md:h-10" />
                <h3 className="font-black uppercase text-[10px] md:text-xs text-[#0f172a] text-center leading-tight">¿No encontrás lo que buscás?</h3>
                <p className="text-[7px] md:text-[8px] text-gray-400 uppercase font-bold mt-1">Activá un ticket para la red</p>
              </div>

              <div className={`flex md:${isOpenMobile ? 'flex' : 'hidden md:flex'} flex-col w-full space-y-1 flex-grow overflow-y-auto no-scrollbar pb-2`}>
                <select className="w-full bg-gray-100 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase outline-none" value={ticketData.marca} onChange={(e) => setTicketData({...ticketData, marca: e.target.value, modelo: '', version: ''})}>
                  <option value="">Marca</option>
                  {opcionesMarca.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="w-full bg-gray-100 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase outline-none" value={ticketData.modelo} disabled={!ticketData.marca} onChange={(e) => setTicketData({...ticketData, modelo: e.target.value, version: ''})}>
                  <option value="">Modelo</option>
                  {opcionesModelo.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="w-full bg-gray-100 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase outline-none" value={ticketData.version} disabled={!ticketData.modelo} onChange={(e) => setTicketData({...ticketData, version: e.target.value})}>
                  <option value="">Versión</option>
                  {opcionesVersion.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setTicketData({...ticketData, moneda: 'USD'})} className={`flex-1 py-1 rounded-md text-[8px] md:text-[9px] font-black ${ticketData.moneda === 'USD' ? 'bg-[#288b55] text-white' : 'text-gray-400'}`}>USD</button>
                  <button onClick={() => setTicketData({...ticketData, moneda: 'ARS'})} className={`flex-1 py-1 rounded-md text-[8px] md:text-[9px] font-black ${ticketData.moneda === 'ARS' ? 'bg-[#288b55] text-white' : 'text-gray-400'}`}>ARS</button>
                </div>
                <input type="text" placeholder="Presupuesto" className="w-full bg-gray-100 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase outline-none" value={ticketData.presupuesto} onChange={(e) => setTicketData({...ticketData, presupuesto: e.target.value.replace(/\D/g, '')})} />
              </div>
              <button onClick={() => alert("Ticket de red activado")} className="w-full py-1.5 bg-[#288b55] text-white font-black rounded-lg uppercase text-[9px] md:text-[10px] tracking-widest mt-1 flex-shrink-0">Activar Ticket</button>
            </div>
          )}

          {/* CARDS VEHICULOS: FIJOS 330PX */}
          {filteredVehicles.map((v) => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[330px] w-full transition-all hover:shadow-xl">
              <div className="relative h-[150px] w-full bg-gray-100 flex-shrink-0">
                {v.fotos?.[0] ? (
                  <img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-grow overflow-hidden">
                <div className="flex-grow overflow-hidden">
                  <h3 className="text-[12px] md:text-[14px] font-bold tracking-tight uppercase truncate text-[#0f172a] mb-0.5">{v.marca} {v.modelo}</h3>
                  <div className="text-gray-500 text-[10px] md:text-[11px] font-black uppercase mb-1">{v.anio} • {v.km} KM</div>
                  <div className="flex items-center gap-1 text-gray-400 mb-2 font-bold uppercase text-[9px] md:text-[10px] truncate"><MapPin size={10} /> {v.localidad || 'Ubicación'}</div>
                </div>
                <div className="mt-auto">
                  <div className="mb-1.5"><span className="text-[#288b55] font-black text-sm md:text-base">{v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('de-DE')}</span></div>
                  <button className="w-full py-1.5 bg-[#0f172a] hover:bg-[#288b55] rounded-lg flex items-center justify-center gap-2 text-white font-black text-[10px] md:text-[11px] uppercase transition-colors"><Eye size={12} /> Ver Detalle</button>
                </div>
              </div>
              {/* BOTONERA DE MENSAJES: TEXTO ACLARADO A GRAY-400 */}
              <div className="grid grid-cols-4 border-t border-gray-200 divide-x h-10 bg-gray-100 flex-shrink-0">
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#288b55] transition-colors"><Instagram size={14} /><span className="text-[6px] md:text-[7px] font-black uppercase">Instagram</span></button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#288b55] transition-colors"><Facebook size={14} /><span className="text-[6px] md:text-[7px] font-black uppercase">Facebook</span></button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#288b55] transition-colors"><MessageCircle size={14} /><span className="text-[6px] md:text-[7px] font-black uppercase">WhatsApp</span></button>
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#288b55] transition-colors"><Send size={14} /><span className="text-[6px] md:text-[7px] font-black uppercase">Mensaje</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}