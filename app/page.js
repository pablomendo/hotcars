"use client";

import React, { useState, useMemo, memo, useCallback, useEffect } from "react";
// Usamos la CDN para que la Vista Previa funcione aquí. 
// En tu código local/GitHub puedes volver a: import { createClient } from "@supabase/supabase-js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import {
  Search,
  Loader2,
  X,
  AlertCircle,
  MessageCircle,
  Plus,
  LogOut,
  Car,
  Send,
  ShieldCheck,
  Gauge,
  TrendingUp,
  Wallet,
  Clock,
  Users
} from "lucide-react";

// --- CONEXIÓN SUPABASE ---
// Usamos las variables que me pasaste. Si fallan en la vista previa, 
// es porque el entorno del chat no tiene acceso a tus .env locales.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- BUSCADOR GLOBAL (FIX TECLADO) ---
const GlobalSearch = memo(({ onSearch }) => {
  const [val, setVal] = useState("");

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    onSearch(v);
  };

  return (
    <div className="relative max-w-xl mx-auto md:mx-0">
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
        size={20}
      />
      <input
        type="text"
        placeholder="Buscá por marca o modelo..."
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 shadow-2xl transition-all text-base appearance-none"
        value={val}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

// Componentes Pequeños de UI
const StatCard = ({ title, value, icon }) => (
  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-orange-600/20 transition-all">
    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-orange-600">
      {icon}
    </div>
    <div className="text-left">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-black text-white leading-tight italic">{value}</p>
    </div>
  </div>
);

export default function Page() {
  const [view, setView] = useState("marketplace");
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const [authData, setAuthData] = useState({ email: "", password: "" });
  const [newCar, setNewCar] = useState({
    brand: "",
    model: "",
    year: "",
    price: "",
    km: "",
    image: "",
    status: "Disponible",
  });

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const WHATSAPP_NUMBER = "5491123456789";

  // --- TRAER AUTOS ---
  const fetchCars = async () => {
    setLoading(true);
    try {
      let query = supabase.from("cars").select("*");

      if (view === "office" && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (!error) setInventory(data || []);
      else setInventory([]);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // --- SESIÓN ---
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView("marketplace");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchCars();
  }, [view, user]);

  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    return inventory.filter(
      (c) =>
        c.brand?.toLowerCase().includes(t) ||
        c.model?.toLowerCase().includes(t)
    );
  }, [filter, inventory]);

  // --- AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "", type: "" });

    const { error } = await supabase.auth.signInWithPassword(authData);

    if (error) {
      const signup = await supabase.auth.signUp(authData);
      if (signup.error)
        setStatusMsg({ text: signup.error.message, type: "error" });
      else
        setStatusMsg({
          text: "Cuenta creada. Confirmá tu mail.",
          type: "success",
        });
    } else {
      setShowAuthModal(false);
      setAuthData({ email: "", password: "" });
    }

    setLoading(false);
  };

  // --- AGREGAR AUTO ---
  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("cars").insert([
      {
        ...newCar,
        user_id: user.id,
      },
    ]);

    if (error) {
      setStatusMsg({ text: error.message, type: "error" });
    } else {
      setShowAddModal(false);
      fetchCars();
      setNewCar({
        brand: "",
        model: "",
        year: "",
        price: "",
        km: "",
        image: "",
        status: "Disponible",
      });
    }

    setLoading(false);
  };

  const openWhatsApp = (car) => {
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) por $${Number(
      car.price
    ).toLocaleString()}.`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    }
  };

  const handleFilterUpdate = useCallback((val) => {
    setFilter(val);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-orange-600 overflow-x-hidden text-left">
      
      {/* NAVBAR */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('marketplace')}>
             <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Car size={18} className="text-white" />
             </div>
             <span className="text-xl font-black italic uppercase tracking-tighter">Hot<span className="text-orange-600">Cars</span></span>
          </div>
          {user && (
            <div className="hidden md:flex gap-6">
              <button onClick={() => setView('marketplace')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'marketplace' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}>Marketplace</button>
              <button onClick={() => setView('office')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'office' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}>Mi Oficina</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-white"><LogOut size={20}/></button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-600/20 active:scale-95 transition-all">Acceso Red</button>
          )}
        </div>
      </nav>

      {/* HEADER MARKETPLACE */}
      {view === 'marketplace' && (
        <>
          <header className="py-20 px-6 bg-gradient-to-b from-slate-900 to-[#020617] border-b border-white/5">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-5xl md:text-8xl font-black mb-10 leading-none tracking-tighter uppercase italic text-left">RED DE STOCK <br/><span className="text-orange-600">HOTCARS.</span></h1>
              <GlobalSearch onSearch={handleFilterUpdate} />
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-12 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {loading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>
              ) : filteredCars.length > 0 ? (
                filteredCars.map(car => (
                  <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl hover:border-orange-600/30 transition-all duration-500">
                    <div className="h-60 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
                      <img src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                      <div className="absolute top-4 right-4 px-3 py-1 bg-orange-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">{car.status}</div>
                    </div>
                    <div className="p-8 text-left">
                      <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
                      <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-3xl font-black text-white">${Number(car.price).toLocaleString()}</span>
                        <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
                      </div>
                      <button onClick={() => openWhatsApp(car)} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:bg-orange-700 transition-all shadow-lg shadow-orange-600/10"><MessageCircle size={18}/> Consultar WhatsApp</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-700 font-black uppercase tracking-widest italic text-sm">No hay unidades publicadas</div>
              )}
            </div>
          </main>
        </>
      )}

      {/* VISTA OFICINA */}
      {view === 'office' && user && (
        <main className="max-w-7xl mx-auto py-12 px-6">
          <div className="mb-12 border-b border-white/5 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div className="text-left">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic leading-none">MI OFICINA <br/><span className="text-orange-600">VIRTUAL</span></h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">{user.email}</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-white text-black px-10 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95"><Plus size={20}/> Cargar Vehículo</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
               <StatCard title="UNIDADES EN RED" value={inventory.length} icon={<Car size={18}/>} />
               <StatCard title="STOCK TOTAL" value={`$${inventory.reduce((acc, c) => acc + Number(c.price), 0).toLocaleString()}`} icon={<Wallet size={18}/>} />
               <StatCard title="VISITAS" value="1.2k" icon={<TrendingUp size={18}/>} />
               <StatCard title="LEADS" value="24" icon={<Users size={18}/>} />
               <StatCard title="PENDIENTES" value="3" icon={<Clock size={18}/>} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {inventory.length > 0 ? (
              inventory.map(car => (
                <div key={car.id} className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] text-left">
                  <div className="h-32 mb-4 rounded-xl overflow-hidden bg-slate-800">
                    <img src={car.image} className="w-full h-full object-cover opacity-60" alt="" />
                  </div>
                  <h4 className="font-black uppercase italic text-sm text-white truncate">{car.brand} {car.model}</h4>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                    <span className="text-orange-600 font-black text-lg">${Number(car.price).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{car.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Car className="mx-auto text-slate-800 mb-6" size={56} />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Tu oficina está vacía</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* MODAL AUTH */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[3rem] p-12 relative text-left shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-10 text-left">ACCESO <br/><span className="text-orange-600">RED HOTCARS</span></h2>
            <form onSubmit={handleAuth} className="space-y-5 text-left">
              <input type="email" placeholder="Email profesional" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input type="password" placeholder="Contraseña" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
              <button disabled={loading} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Entrar / Registrarme'}
              </button>
            </form>
            {statusMsg.text && <div className={`mt-8 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}><AlertCircle size={16}/> {statusMsg.text}</div>}
          </div>
        </div>
      )}

      {/* MODAL CARGA */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 relative text-left shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-white mb-8 text-left">NUEVA <span className="text-orange-600">UNIDAD</span></h2>
            <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">Marca</label><input type="text" placeholder="Ej: Toyota" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.brand} onChange={e => setNewCar({...newCar, brand: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">Modelo</label><input type="text" placeholder="Ej: Hilux" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">Año</label><input type="number" placeholder="2024" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.year} onChange={e => setNewCar({...newCar, year: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">Precio (USD)</label><input type="number" placeholder="55000" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.price} onChange={e => setNewCar({...newCar, price: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">Kilómetros</label><input type="text" placeholder="0" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.km} onChange={e => setNewCar({...newCar, km: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest font-bold font-black">URL Foto</label><input type="text" placeholder="https://..." required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.image} onChange={e => setNewCar({...newCar, image: e.target.value})} /></div>
              <button disabled={loading} className="col-span-full mt-8 bg-orange-600 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-orange-700 transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Publicar en Stock</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl text-left animate-in fade-in zoom-in duration-200">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"><X size={20} /></button>
              <img src={selectedCar.image} className="w-full h-72 object-cover" alt="" />
              <div className="p-10 text-left">
                <span className="text-orange-600 text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8 leading-none tracking-tighter text-left">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest font-black">Año</p><p className="text-white font-bold text-sm uppercase">{selectedCar.year}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest font-black">KMs</p><p className="text-white font-bold text-sm uppercase">{selectedCar.km}</p></div>
                </div>
                <button onClick={() => openWhatsApp(selectedCar)} className="w-full bg-orange-600 text-white py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl font-black"><MessageCircle size={22}/> Consultar WhatsApp</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
