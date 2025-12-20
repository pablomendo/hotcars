"use client";

import React, { useState, useMemo, memo, useCallback, useEffect } from "react";
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

// --- CONFIGURACIÓN DE CONEXIÓN ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const WHATSAPP_NUMBER = "5491123456789";

// --- COMPONENTE BUSCADOR (SOLUCIÓN TECLADO) ---
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
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 shadow-2xl transition-all text-base appearance-none shadow-orange-600/5"
        value={val}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

// Componente para las tarjetas de métricas en la oficina
const StatCard = ({ title, value, icon }) => (
  <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/5 flex flex-col gap-3 hover:border-orange-600/20 transition-all text-left">
    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-orange-600">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-white leading-tight italic uppercase">{value}</p>
    </div>
  </div>
);

export default function Page() {
  const [supabase, setSupabase] = useState(null);
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

  // --- CARGA ULTRA-ROBUSTA DE SUPABASE ---
  useEffect(() => {
    document.title = "HotCars | Red de Stock";
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (window.supabase) {
        try {
          const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
          setSupabase(client);
        } catch (e) {
          console.error("Error al crear cliente Supabase:", e);
        }
      }
    };
    document.head.appendChild(script);
  }, []);

  // --- TRAER AUTOS (Con Guardia de Seguridad) ---
  const fetchCars = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase.from("cars").select("*");
      if (view === "office" && user?.id) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error) setInventory(data || []);
      else setInventory([]);
    } catch (err) {
      console.error("Fetch error:", err);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, view, user]);

  // --- GESTIÓN DE SESIÓN (Con Guardia de Seguridad) ---
  useEffect(() => {
    if (!supabase) return;

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user ?? null);
      } catch (e) {
        console.error("Session error:", e);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView("marketplace");
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (supabase) fetchCars();
  }, [supabase, fetchCars]);

  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    if (!inventory) return [];
    return inventory.filter(
      (c) =>
        c.brand?.toLowerCase().includes(t) ||
        c.model?.toLowerCase().includes(t)
    );
  }, [filter, inventory]);

  // --- ACCIONES ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.signInWithPassword(authData);
      if (error) {
        const signup = await supabase.auth.signUp(authData);
        if (signup.error) setStatusMsg({ text: signup.error.message, type: "error" });
        else setStatusMsg({ text: "Cuenta creada. Confirmá tu mail.", type: "success" });
      } else {
        setShowAuthModal(false);
        setAuthData({ email: "", password: "" });
      }
    } catch (err) {
      setStatusMsg({ text: "Error de conexión", type: "error" });
    }
    setLoading(false);
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("cars").insert([{ ...newCar, user_id: user.id }]);
      if (error) setStatusMsg({ text: error.message, type: "error" });
      else {
        setShowAddModal(false);
        fetchCars();
        setNewCar({ brand: "", model: "", year: "", price: "", km: "", image: "", status: "Disponible" });
      }
    } catch (err) {
      setStatusMsg({ text: "Error al guardar", type: "error" });
    }
    setLoading(false);
  };

  const openWhatsApp = (car) => {
    if (!car) return;
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) publicado por $${Number(car.price).toLocaleString()}.`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  // --- PANTALLA DE CARGA INICIAL ---
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <div className="relative">
           <Loader2 className="animate-spin text-orange-600" size={48} />
           <Car className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={16} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Iniciando Red HotCars</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-orange-600 overflow-x-hidden text-left">
      
      {/* BARRA DE NAVEGACIÓN */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('marketplace')}>
             <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
                <Car size={20} className="text-white" />
             </div>
             <span className="text-2xl font-black italic uppercase tracking-tighter leading-none">Hot<span className="text-orange-600">Cars</span></span>
          </div>
          {user && (
            <div className="hidden md:flex gap-8">
              <button onClick={() => setView('marketplace')} className={`text-[11px] font-black uppercase tracking-widest transition-all ${view === 'marketplace' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}>Marketplace</button>
              <button onClick={() => setView('office')} className={`text-[11px] font-black uppercase tracking-widest transition-all ${view === 'office' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}>Mi Oficina</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-5">
              <span className="hidden md:block text-[10px] font-black text-slate-500 uppercase tracking-widest">{user?.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-orange-600 transition-colors p-2 bg-white/5 rounded-lg">
                <LogOut size={20}/>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-orange-600 text-white px-7 py-3 rounded-xl font-black text-[11px] uppercase shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all">Acceso Red</button>
          )}
        </div>
      </nav>

      {/* VISTA: MARKETPLACE (PÚBLICO) */}
      {view === 'marketplace' && (
        <>
          <header className="py-24 px-6 bg-gradient-to-b from-slate-900 to-[#020617] border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-600/5 blur-[120px] rounded-full -translate-y-1/2"></div>
            <div className="max-w-6xl mx-auto relative">
              <h1 className="text-6xl md:text-9xl font-black mb-12 leading-[0.85] tracking-tighter uppercase italic text-left">
                RED DE STOCK <br/>
                <span className="text-orange-600">HOTCARS.</span>
              </h1>
              <GlobalSearch onSearch={useCallback((v) => setFilter(v), [])} />
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-16 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {loading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>
              ) : filteredCars.length > 0 ? (
                filteredCars.map(car => (
                  <div key={car.id} className="group bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl hover:border-orange-600/30 transition-all duration-500 flex flex-col">
                    <div className="h-64 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
                      <img src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={car.model} />
                      <div className="absolute top-5 right-5 px-4 py-1.5 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                        {car.status}
                      </div>
                    </div>
                    <div className="p-10 flex-1 flex flex-col text-left">
                      <span className="text-orange-600 text-[11px] font-black uppercase tracking-[0.2em] mb-2">{car.brand}</span>
                      <h3 className="text-3xl font-black uppercase italic text-white mb-6 leading-none tracking-tight">{car.model}</h3>
                      
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-4xl font-black text-white">${Number(car.price || 0).toLocaleString()}</span>
                        <div className="bg-white/5 px-3 py-1 rounded-lg text-slate-500 font-black text-[11px] italic uppercase tracking-tighter">{car.year}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-10 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase">
                          <Gauge size={16} className="text-orange-600"/> {car.km} KM
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase">
                          <ShieldCheck size={16} className="text-orange-600"/> GARANTÍA
                        </div>
                      </div>

                      <button onClick={() => openWhatsApp(car)} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.15em] flex items-center justify-center gap-3 active:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/20 transition-all">
                        <MessageCircle size={20}/> Consultar WhatsApp
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-32 border-2 border-dashed border-white/5 rounded-[3rem]">
                  <p className="text-slate-700 font-black uppercase tracking-[0.4em] italic text-sm">No hay unidades encontradas</p>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* VISTA: MI OFICINA (PRIVADO) */}
      {view === 'office' && user && (
        <main className="max-w-7xl mx-auto py-16 px-6">
          <div className="mb-16 border-b border-white/5 pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
              <div className="text-left">
                <h2 className="text-5xl md:text-6xl font-black uppercase italic leading-[0.9]">MI OFICINA <br/><span className="text-orange-600">VIRTUAL</span></h2>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mt-5 px-1">{user?.email}</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-white text-black px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95">
                <Plus size={22}/> Cargar Vehículo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
               <StatCard title="UNIDADES EN RED" value={inventory.length} icon={<Car size={20}/>} />
               <StatCard title="STOCK TOTAL" value={`$${inventory.reduce((acc, c) => acc + Number(c.price || 0), 0).toLocaleString()}`} icon={<Wallet size={20}/>} />
               <StatCard title="VISITAS" value="1.2k" icon={<TrendingUp size={20}/>} />
               <StatCard title="LEADS" value="24" icon={<Users size={20}/>} />
               <StatCard title="PENDIENTES" value="3" icon={<Clock size={20}/>} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {inventory.length > 0 ? (
              inventory.map(car => (
                <div key={car.id} className="bg-slate-900 border border-white/5 p-7 rounded-[2.5rem] group hover:border-orange-600/20 transition-all text-left">
                  <div className="h-40 mb-6 rounded-2xl overflow-hidden bg-slate-800 relative">
                    <img src={car.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="" />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded-md text-[8px] font-black uppercase tracking-tighter">{car.status}</div>
                  </div>
                  <h4 className="font-black uppercase italic text-sm text-white truncate mb-1">{car.brand}</h4>
                  <p className="font-black uppercase text-[10px] text-slate-500 mb-4">{car.model} {car.year}</p>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-orange-600 font-black text-xl">${Number(car.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Car className="mx-auto text-slate-800 mb-8" size={64} />
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] italic leading-loose">Tu oficina está vacía.<br/>Cargá tu primera unidad para publicarla.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* MODAL: ACCESO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[3rem] p-12 relative text-left shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-4xl font-black italic uppercase text-white leading-[0.9] mb-12">ACCESO <br/><span className="text-orange-600">RED HOTCARS</span></h2>
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Email Profesional</label>
                 <input type="email" placeholder="email@ejemplo.com" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Contraseña</label>
                 <input type="password" placeholder="••••••••" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all mt-4">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Entrar / Registrarme'}
              </button>
            </form>
            {statusMsg.text && <div className={`mt-8 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 ${statusMsg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}><AlertCircle size={20}/> {statusMsg.text}</div>}
          </div>
        </div>
      )}

      {/* MODAL: CARGA DE UNIDAD */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-[3.5rem] p-12 relative text-left shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
            <h2 className="text-4xl font-black italic uppercase text-white mb-10 leading-none">NUEVA <span className="text-orange-600">UNIDAD</span></h2>
            <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Marca</label><input type="text" placeholder="Ej: Toyota" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.brand} onChange={e => setNewCar({...newCar, brand: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Modelo</label><input type="text" placeholder="Ej: Hilux" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Año</label><input type="number" placeholder="2024" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.year} onChange={e => setNewCar({...newCar, year: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Precio (USD)</label><input type="number" placeholder="55000" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.price} onChange={e => setNewCar({...newCar, price: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Kilómetros</label><input type="text" placeholder="0" required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.km} onChange={e => setNewCar({...newCar, km: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">URL de Imagen</label><input type="text" placeholder="https://..." required className="w-full p-5 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.image} onChange={e => setNewCar({...newCar, image: e.target.value})} /></div>
              <button disabled={loading} className="col-span-full mt-10 bg-orange-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl flex items-center justify-center gap-4 hover:bg-orange-700 transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={24}/> : <><Send size={20}/> PUBLICAR EN STOCK</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA DETALLE */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[3rem] overflow-hidden relative shadow-2xl text-left animate-in fade-in zoom-in duration-300">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-3 rounded-full text-white hover:bg-orange-600 transition-colors"><X size={20} /></button>
              <div className="h-80 overflow-hidden">
                <img src={selectedCar.image} className="w-full h-full object-cover" alt={selectedCar.model} />
              </div>
              <div className="p-12 text-left">
                <span className="text-orange-600 text-xs font-black uppercase tracking-[0.3em] mb-3 block">{selectedCar.brand}</span>
                <h2 className="text-5xl font-black uppercase italic text-white mb-10 leading-[0.9] tracking-tighter">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-5 mb-12">
                  <div className="bg-white/5 p-5 rounded-3xl text-left border border-white/5"><p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest font-bold">Año Modelo</p><p className="text-white font-black text-xl italic">{selectedCar.year}</p></div>
                  <div className="bg-white/5 p-5 rounded-3xl text-left border border-white/5"><p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest font-bold">Kilometraje</p><p className="text-white font-black text-xl italic">{selectedCar.km} KM</p></div>
                </div>
                <button onClick={() => openWhatsApp(selectedCar)} className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl font-black">
                  <MessageCircle size={24}/> Consultar WhatsApp
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
