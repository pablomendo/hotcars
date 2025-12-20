"use client";
import React, { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, ShieldCheck, Gauge, Loader2, UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- IMPORTANTE: LA LISTA AFUERA ---
// Sacamos el inventario de la función App para que no se reinicie al escribir
const inventory = [
  { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/toyota-hilux.jpg" },
  { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ford-ranger.jpg" },
  { id: 3, brand: "Ford", model: "Territory", year: 2023, price: 38000, km: "12.000", status: "Disponible", image: "/cars/ford-territory.jpg" },
  { id: 4, brand: "Honda", model: "Civic", year: 2021, price: 28900, km: "35.500", status: "Disponible", image: "/cars/honda-civic.jpg" },
  { id: 5, brand: "Peugeot", model: "208", year: 2023, price: 18500, km: "10.000", status: "Disponible", image: "/cars/peugeot-208.jpg" },
  { id: 6, brand: "Volkswagen", model: "Amarok", year: 2022, price: 49000, km: "40.000", status: "Vendido", image: "/cars/vw-amarok.jpg" },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Filtrado optimizado para no perder el foco
  const filteredCars = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(car => 
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      car.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage({ text: '¡Registro iniciado! Revisá tu email.', type: 'success' });
      setEmail(''); setPassword('');
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left pb-20">
      {/* Navbar fija para evitar saltos de pantalla */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setShowAuthModal(true)} 
          className="bg-[#EA580C] text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
        >
          Acceso Red
        </button>
      </nav>

      {/* Hero y Buscador */}
      <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
            RED DE STOCK <br/><span className="text-[#EA580C]">HOTCARS.</span>
          </h1>
          
          <div className="relative max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#EA580C] transition-colors" size={20} />
            <input 
              id="main-search"
              type="text" 
              inputMode="text"
              placeholder="Buscá marca o modelo..." 
              className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-base" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </header>

      {/* Resultados */}
      <main className="max-w-7xl mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
            <div className="h-56 relative overflow-hidden">
              <img 
                src={car.image} 
                className="w-full h-full object-cover" 
                alt={car.model} 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"; }} 
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#EA580C] text-white rounded-full text-[8px] font-black uppercase tracking-widest">{car.status}</div>
            </div>
            <div className="p-6">
              <span className="text-[#EA580C] text-[10px] font-black uppercase">{car.brand}</span>
              <h3 className="text-xl font-black uppercase italic text-white mb-4 leading-none">{car.model}</h3>
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black text-white">${car.price.toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xs">{car.year}</span>
              </div>
              <div className="flex gap-4 mb-6 pt-4 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                  <div className="flex items-center gap-1.5"><Gauge size={12} className="text-[#EA580C]"/> {car.km} KM</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#EA580C]"/> GARANTÍA</div>
              </div>
              <button className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:bg-[#EA580C] active:text-white transition-all">Consultar</button>
            </div>
          </div>
        ))}
        {filteredCars.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest">No se encontraron resultados</div>
        )}
      </main>

      {/* Modal Autenticación */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-2">REGISTRO <br/><span className="text-[#EA580C]">RED HOTCARS</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Acceso exclusivo</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="email" placeholder="Email" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button disabled={authLoading} className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2">
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />} Unirme
              </button>
            </form>
            {message.text && (
              <div className={mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}}>
                {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
