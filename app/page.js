"use client";
import React, { useState, useMemo, memo, useCallback } from 'react';
// Usamos una importación de CDN para asegurar la compatibilidad con el entorno de vista previa
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { Search, ShieldCheck, Gauge, Loader2, UserPlus, X, CheckCircle2, AlertCircle, MessageCircle, Info } from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INVENTORY_DATA = [
  { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/toyota-hilux.jpg", specs: { motor: "2.8 TDI", transmision: "Automática", traccion: "4x4", color: "Blanco" } },
  { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ford-ranger.jpg", specs: { motor: "3.2 V6", transmision: "Manual", traccion: "4x4", color: "Gris" } },
  { id: 3, brand: "Ford", model: "Territory", year: 2023, price: 38000, km: "12.000", status: "Disponible", image: "/cars/ford-territory.jpg", specs: { motor: "1.5 Turbo", transmision: "Automática", traccion: "4x2", color: "Azul" } },
  { id: 4, brand: "Honda", model: "Civic", year: 2021, price: 28900, km: "35.500", status: "Disponible", image: "/cars/honda-civic.jpg", specs: { motor: "2.0 i-VTEC", transmision: "CVT", traccion: "Delantera", color: "Negro" } },
  { id: 5, brand: "Peugeot", model: "208", year: 2023, price: 18500, km: "10.000", status: "Disponible", image: "/cars/peugeot-208.jpg", specs: { motor: "1.6 VTi", transmision: "Manual", traccion: "Delantera", color: "Blanco" } },
  { id: 6, brand: "Volkswagen", model: "Amarok", year: 2022, price: 49000, km: "40.000", status: "Vendido", image: "/cars/vw-amarok.jpg", specs: { motor: "3.0 V6", transmision: "Automática", traccion: "4x4", color: "Gris" } },
];

// --- ARREGLO DEL TECLADO: COMPONENTE AISLADO ---
// Al estar definido fuera de App, React no destruye este elemento al actualizar la lista
const SearchInput = memo(({ onSearchChange }) => {
  const [val, setVal] = useState("");

  const handleChange = (e) => {
    const newValue = e.target.value;
    setVal(newValue);
    onSearchChange(newValue);
  };

  return (
    <div className="relative max-w-xl">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <Search size={20} />
      </div>
      <input 
        id="main-car-search-input"
        type="text" 
        inputMode="search"
        placeholder="Buscá marca o modelo..." 
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 transition-all text-base appearance-none shadow-2xl"
        value={val} 
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

export default function App() {
  const [filter, setFilter] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const WHATSAPP_NUMBER = "5491123456789"; 

  // Función estable para el buscador
  const handleFilterChange = useCallback((val) => {
    setFilter(val);
  }, []);

  const filteredCars = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return INVENTORY_DATA;
    return INVENTORY_DATA.filter(car => 
      car.model.toLowerCase().includes(term) || 
      car.brand.toLowerCase().includes(term)
    );
  }, [filter]);

  const handleWhatsApp = (car) => {
    const text = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}).`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage({ text: 'Registro exitoso. Revisá tu email.', type: 'success' });
      setEmail(''); setPassword('');
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left selection:bg-orange-600 overflow-x-hidden">
      
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setShowAuthModal(true)} 
          className="bg-[#EA580C] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Acceso Red
        </button>
      </nav>

      <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
            RED DE STOCK <br/><span className="text-orange-600">HOTCARS.</span>
          </h1>
          
          <SearchInput onSearchChange={handleFilterChange} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map((car) => (
          <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full shadow-lg hover:border-orange-600/30 transition-all duration-300">
            <div className="h-56 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
              <img 
                src={car.image} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={car.model} 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"; }} 
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-orange-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">{car.status}</div>
            </div>

            <div className="p-7 flex flex-col flex-grow">
              <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
              <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-white">${car.price.toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
              </div>

              <div className="flex gap-4 mb-8 pt-6 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                  <div className="flex items-center gap-1.5"><Gauge size={14} className="text-orange-600"/> {car.km} KM</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-orange-600"/> GARANTÍA</div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => setSelectedCar(car)} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><Info size={14}/> Ficha</button>
                <button onClick={() => handleWhatsApp(car)} className="flex-[2] bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 active:bg-orange-700 transition-colors"><MessageCircle size={14}/> Consultar</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Modal Ficha */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl text-left">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white"><X size={20} /></button>
              <img src={selectedCar.image} className="w-full h-64 object-cover" alt={selectedCar.model} />
              <div className="p-10">
                <span className="text-orange-600 text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8 leading-none">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Motor</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.motor}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Transmisión</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.transmision}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Tracción</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.traccion}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Color</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.color}</p></div>
                </div>
                <button onClick={() => handleWhatsApp(selectedCar)} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"><MessageCircle size={20}/> Consultar via WhatsApp</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Registro */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl text-left">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-2">REGISTRO <br/><span className="text-orange-600">RED HOTCARS</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Acceso exclusivo</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="email" placeholder="Email profesional" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Crear contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button disabled={authLoading} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />} Unirme a la Red
              </button>
            </form>
            {message.text && (
              <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
