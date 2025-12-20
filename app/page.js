"use client";
import React, { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
// Importación vía CDN para que la vista previa funcione correctamente sin errores de compilación
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { 
  Search, ShieldCheck, Gauge, Loader2, UserPlus, X, 
  CheckCircle2, AlertCircle, MessageCircle, Info, Plus, 
  LayoutDashboard, LogOut, Car, Image as ImageIcon, DollarSign
} from 'lucide-react';

// --- CONEXIÓN SUPABASE ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- COMPONENTE BUSCADOR (SOLUCIÓN TECLADO) ---
// Se define fuera para que React mantenga su identidad y no reinicie el input al filtrar
const GlobalSearch = memo(({ onSearch }) => {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    onSearch(v);
  };

  return (
    <div className="relative max-w-xl mx-auto md:mx-0">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
      <input 
        ref={inputRef}
        type="text" 
        inputMode="search"
        placeholder="Buscá por marca o modelo..." 
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 transition-all text-base appearance-none"
        value={val} 
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

export default function App() {
  const [view, setView] = useState('marketplace'); // 'marketplace' o 'office'
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modales y Formularios
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [newCar, setNewCar] = useState({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const WHATSAPP_NUMBER = "5491123456789"; 

  // --- LÓGICA DE INVENTARIO ---
  const fetchCars = async () => {
    setLoading(true);
    try {
      let query = supabase.from('cars').select('*');
      
      // Si estamos en la oficina, filtrar estrictamente por el ID del usuario logueado
      if (view === 'office' && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error("Error fetching cars:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Sesión y Carga de Datos
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChanged((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView('marketplace'); // Si cierra sesión, vuelve al inicio
    });

    return () => subscription.unsubscribe();
  }, []);

  // Recargar autos cuando cambie la vista o el usuario
  useEffect(() => {
    fetchCars();
  }, [view, user]);

  // Filtrado de autos para el marketplace (memoizado para rendimiento)
  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    if (!t) return inventory;
    return inventory.filter(c => 
      c.brand?.toLowerCase().includes(t) || 
      c.model?.toLowerCase().includes(t)
    );
  }, [filter, inventory]);

  // --- ACCIONES DE AUTENTICACIÓN ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    // Intento de Login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authData.email,
      password: authData.password
    });

    if (signInError) {
      // Si falla el login, intentamos registro
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password
      });

      if (signUpError) {
        setStatusMsg({ text: "Error: " + signUpError.message, type: 'error' });
      } else {
        setStatusMsg({ text: 'Cuenta creada. Confirmá tu email si es necesario.', type: 'success' });
      }
    } else {
      setShowAuthModal(false);
      setAuthData({ email: '', password: '' });
    }
    setLoading(false);
  };

  // --- CARGA DE VEHÍCULO ---
  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    const { error } = await supabase.from('cars').insert([{ 
      ...newCar, 
      user_id: user.id 
    }]);

    if (error) {
      setStatusMsg({ text: "Error al guardar: " + error.message, type: 'error' });
    } else {
      setShowAddModal(false);
      fetchCars();
      setNewCar({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' });
    }
    setLoading(false);
  };

  const openWhatsApp = (car) => {
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) por $${Number(car.price).toLocaleString()}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFilterUpdate = useCallback((val) => {
    setFilter(val);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <img 
            src="/Logo_Hotcars_blanco.png" 
            alt="HotCars" 
            className="h-8 cursor-pointer" 
            onClick={() => setView('marketplace')} 
          />
          {user && (
            <div className="hidden md:flex gap-6">
              <button 
                onClick={() => setView('marketplace')} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'marketplace' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setView('office')} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'office' ? 'text-orange-600' : 'text-slate-500 hover:text-white'}`}
              >
                Mi Oficina
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="p-2 text-slate-500 hover:text-orange-600 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={18}/>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="bg-orange-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all"
            >
              Acceso Red
            </button>
          )}
        </div>
      </nav>

      {/* VISTA: MARKETPLACE */}
      {view === 'marketplace' && (
        <>
          <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617] border-b border-white/5">
            <div className="max-w-6xl mx-auto text-left">
              <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
                RED DE STOCK <br/><span className="text-orange-600">HOTCARS.</span>
              </h1>
              <GlobalSearch onSearch={handleFilterUpdate} />
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-12 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>
              ) : filteredCars.length > 0 ? (
                filteredCars.map(car => (
                  <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl hover:border-orange-600/30 transition-all duration-300">
                    <div className="h-60 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
                      <img 
                        src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={car.model} 
                      />
                      <div className="absolute top-4 right-4 px-3 py-1 bg-orange-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        {car.status}
                      </div>
                    </div>
                    <div className="p-8 text-left">
                      <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
                      <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-3xl font-black text-white">${Number(car.price).toLocaleString()}</span>
                        <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
                      </div>
                      <div className="flex gap-4 mb-8 pt-6 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                        <div className="flex items-center gap-1.5"><Gauge size={14} className="text-orange-600"/> {car.km} KM</div>
                        <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-orange-600"/> GARANTÍA</div>
                      </div>
                      <button 
                        onClick={() => openWhatsApp(car)} 
                        className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:bg-orange-700 shadow-lg shadow-orange-600/10 transition-colors"
                      >
                        <MessageCircle size={16}/> Consultar Ahora
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-500 uppercase font-black tracking-widest text-xs">
                  No se encontraron unidades en el stock
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* VISTA: OFICINA (Solo Logueados) */}
      {view === 'office' && user && (
        <main className="max-w-7xl mx-auto py-12 px-6 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-12">
            <div>
              <h2 className="text-4xl font-black uppercase italic text-white leading-none mb-2">MI OFICINA <br/><span className="text-orange-600">VIRTUAL</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Gestión de stock propio para la red</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95"
            >
              <Plus size={18}/> Cargar Vehículo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {loading ? (
              <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32}/></div>
            ) : inventory.length > 0 ? (
              inventory.map(car => (
                <div key={car.id} className="bg-slate-900 border border-white/5 p-6 rounded-3xl group hover:border-orange-600/20 transition-all">
                  <div className="h-32 mb-4 rounded-xl overflow-hidden bg-slate-800">
                    <img src={car.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                  </div>
                  <h4 className="font-black uppercase italic text-sm text-white truncate">{car.brand} {car.model}</h4>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                    <span className="text-orange-600 font-black text-lg">${Number(car.price).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{car.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Car className="mx-auto text-slate-800 mb-4" size={48} />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aún no has cargado vehículos a tu oficina</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* MODAL: CARGAR AUTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] text-left">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-white mb-8">CARGAR <span className="text-orange-600">VEHÍCULO</span></h2>
            
            <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Marca</label>
                <input type="text" placeholder="Ej: Toyota" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.brand} onChange={e => setNewCar({...newCar, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Modelo</label>
                <input type="text" placeholder="Ej: Hilux" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Año</label>
                <input type="number" placeholder="2024" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.year} onChange={e => setNewCar({...newCar, year: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Precio (USD)</label>
                <input type="number" placeholder="52000" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.price} onChange={e => setNewCar({...newCar, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">KM</label>
                <input type="text" placeholder="0" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.km} onChange={e => setNewCar({...newCar, km: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Link Imagen</label>
                <input type="text" placeholder="https://..." required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={newCar.image} onChange={e => setNewCar({...newCar, image: e.target.value})} />
              </div>
              <button 
                disabled={loading} 
                className="col-span-full mt-6 bg-orange-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : 'Publicar en la Red'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCESO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[3rem] p-12 relative shadow-2xl text-left">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-8">ACCESO <br/><span className="text-orange-600">RED HOTCARS</span></h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="Email profesional" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
              <button disabled={loading} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" size={18}/> : 'Entrar o Registrarme'}
              </button>
            </form>
            
            {statusMsg.text && (
              <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                <AlertCircle size={16}/> {statusMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DEL AUTO */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"><X size={20} /></button>
              <img src={selectedCar.image} className="w-full h-72 object-cover" alt={selectedCar.model} />
              <div className="p-10">
                <span className="text-orange-600 text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8 leading-none tracking-tighter">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Año</p><p className="text-white font-bold text-sm uppercase">{selectedCar.year}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Kilometraje</p><p className="text-white font-bold text-sm uppercase">{selectedCar.km} KM</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Estado</p><p className="text-white font-bold text-sm uppercase">{selectedCar.status}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl text-left"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Precio</p><p className="text-white font-bold text-sm uppercase">USD {Number(selectedCar.price).toLocaleString()}</p></div>
                </div>
                <button 
                  onClick={() => openWhatsApp(selectedCar)} 
                  className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <MessageCircle size={20}/> Consultar via WhatsApp
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
