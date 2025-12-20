"use client";
import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { 
  Search, Loader2, X, MessageCircle, Plus, LogOut, Car, Send, AlertCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const WHATSAPP_NUMBER = "5491123456789"; 

// --- COMPONENTE BUSCADOR ---
const PersistentSearch = memo(({ onSearch }) => {
  const [val, setVal] = useState("");
  
  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    onSearch(v);
  };

  return (
    <div className="relative max-w-xl mx-auto md:mx-0">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
      <input 
        id="input-hotcars-definitivo"
        type="text" 
        inputMode="search"
        placeholder="Buscá por marca o modelo..." 
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 transition-all text-base appearance-none shadow-2xl"
        value={val} 
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

export default function Page() {
  const [view, setView] = useState('marketplace'); 
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('');
  const [inventory, setInventory] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [newCar, setNewCar] = useState({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // --- TRAER AUTOS ---
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('cars').select('*');
      if (view === 'office' && user) {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error) setInventory(data || []);
      else setInventory([]);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [view, user]);

  // --- SESIÓN ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView('marketplace');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    return inventory.filter(c => 
      c.brand?.toLowerCase().includes(t) || c.model?.toLowerCase().includes(t)
    );
  }, [filter, inventory]);

  // --- AUTENTICACIÓN ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    const { error } = await supabase.auth.signInWithPassword({
      email: authData.email,
      password: authData.password
    });
    if (error) {
      const signup = await supabase.auth.signUp({ email: authData.email, password: authData.password });
      if (signup.error) setStatusMsg({ text: signup.error.message, type: 'error' });
      else setStatusMsg({ text: 'Cuenta creada. Confirmá tu email.', type: 'success' });
    } else {
      setShowAuthModal(false);
      setAuthData({ email: '', password: '' });
    }
    setLoading(false);
  };

  // --- AGREGAR AUTO ---
  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('cars').insert([{ ...newCar, user_id: user.id }]);
    if (error) setStatusMsg({ text: error.message, type: 'error' });
    else {
      setShowAddModal(false);
      fetchCars();
      setNewCar({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' });
    }
    setLoading(false);
  };

  const openWhatsApp = (car) => {
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) publicado por $${Number(car.price).toLocaleString()}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFilterUpdate = useCallback((val) => setFilter(val), []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left selection:bg-orange-600 overflow-x-hidden">
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 cursor-pointer" onClick={() => setView('marketplace')} />
          {user && (
            <div className="hidden md:flex gap-6">
              <button onClick={() => setView('marketplace')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view==='marketplace'?'text-orange-600':'text-slate-500 hover:text-white'}`}>Marketplace</button>
              <button onClick={() => setView('office')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view==='office'?'text-orange-600':'text-slate-500 hover:text-white'}`}>Mi Oficina</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase">{user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-white transition-colors"><LogOut size={20}/></button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-600/20 active:scale-95 transition-all">Acceso Red</button>
          )}
        </div>
      </nav>

      {view==='marketplace' && (
        <>
          <header className="py-20 px-6 bg-gradient-to-b from-slate-900 to-[#020617] border-b border-white/5">
            <div className="max-w-6xl mx-auto text-left">
              <h1 className="text-5xl md:text-8xl font-black mb-10 leading-none tracking-tighter uppercase italic">RED DE STOCK <br/><span className="text-orange-600">HOTCARS.</span></h1>
              <PersistentSearch onSearch={handleFilterUpdate} />
            </div>
          </header>
          <main className="max-w-7xl mx-auto py-12 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>
              ) : filteredCars.length>0 ? filteredCars.map(car=>(
                <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl hover:border-orange-600/30 transition-all duration-500 text-left">
                  <div className="h-60 relative overflow-hidden cursor-pointer" onClick={()=>setSelectedCar(car)}>
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
                    <button onClick={()=>openWhatsApp(car)} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:bg-orange-700 transition-all shadow-lg shadow-orange-600/10"><MessageCircle size={18}/> Consultar WhatsApp</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-20 text-slate-700 font-black uppercase tracking-widest italic text-sm">No hay unidades publicadas todavía</div>
              )}
            </div>
          </main>
        </>
      )}

      {/* Aquí puedes mantener tu sección "office", modales y selectedCar igual */}
      {/* ... */}
    </div>
  );
}
