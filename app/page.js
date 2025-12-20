"use client";
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
// Importamos Supabase desde una CDN para compatibilidad total
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { Search, ShieldCheck, Gauge, Loader2, UserPlus, X, CheckCircle2, AlertCircle, MessageCircle, Info } from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DATOS DEL INVENTARIO (Estáticos para evitar re-renders) ---
const INVENTORY_DATA = [
  { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/toyota-hilux.jpg", specs: { motor: "2.8 TDI", transmision: "Automática", traccion: "4x4", color: "Blanco" } },
  { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ford-ranger.jpg", specs: { motor: "3.2 V6", transmision: "Manual", traccion: "4x4", color: "Gris" } },
  { id: 3, brand: "Ford", model: "Territory", year: 2023, price: 38000, km: "12.000", status: "Disponible", image: "/cars/ford-territory.jpg", specs: { motor: "1.5 Turbo", transmision: "Automática", traccion: "4x2", color: "Azul" } },
  { id: 4, brand: "Honda", model: "Civic", year: 2021, price: 28900, km: "35.500", status: "Disponible", image: "/cars/honda-civic.jpg", specs: { motor: "2.0 i-VTEC", transmision: "CVT", traccion: "Delantera", color: "Negro" } },
  { id: 5, brand: "Peugeot", model: "208", year: 2023, price: 18500, km: "10.000", status: "Disponible", image: "/cars/peugeot-208.jpg", specs: { motor: "1.6 VTi", transmision: "Manual", traccion: "Delantera", color: "Blanco" } },
  { id: 6, brand: "Volkswagen", model: "Amarok", year: 2022, price: 49000, km: "40.000", status: "Vendido", image: "/cars/vw-amarok.jpg", specs: { motor: "3.0 V6", transmision: "Automática", traccion: "4x4", color: "Gris" } },
];

// --- COMPONENTE DE BÚSQUEDA AISLADO (Para evitar pérdida de foco) ---
const SearchInput = memo(({ value, onChange }) => {
  return (
    <div className="relative max-w-xl">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <Search size={20} />
      </div>
      <input 
        id="main-search-input"
        type="text" 
        placeholder="Buscá marca o modelo..." 
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-base shadow-2xl"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        inputMode="search"
      />
    </div>
  );
});

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const WHATSAPP_NUMBER = "5491123456789"; 

  // Filtrado memoizado para que no afecte al input mientras se escribe
  const filteredCars = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return INVENTORY_DATA;
    return INVENTORY_DATA.filter(car => 
      car.model.toLowerCase().includes(term) || 
      car.brand.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleWhatsApp = (car) => {
    const text = `Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}).`;
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
      
      {/* Navbar fija */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setShowAuthModal(true)} 
          className="bg-[#EA580C] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
        >
          Acceso Red
        </button>
      </nav>

      {/* Header con Buscador Aislado */}
      <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
            RED DE STOCK <br/><span className="text-[#EA580C]">HOTCARS.</span>
          </h1>
          
          <SearchInput value={searchTerm} onChange={setSearchTerm} />
        </div>
      </header>

      {/* Listado de Unidades */}
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
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#EA580C] text-white rounded-full text-[8px] font-black uppercase tracking-widest">{car.status}</div>
            </div>

            <div className="p-7 flex flex-col flex-grow">
              <span className="text-[#EA580C] text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
              <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-white">${car.price.toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
              </div>

              <div className="flex gap-4 mb-8 pt-6 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                  <div className="flex items-center gap-1.5"><Gauge size={14} className="text-[#EA580C]"/> {car.km} KM</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#EA580C]"/> GARANTÍA</div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => setSelectedCar(car)} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><Info size={14}/> Ficha</button>
                <button onClick={() => handleWhatsApp(car)} className="flex-[2] bg-[#EA580C] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 active:bg-orange-700"><MessageCircle size={14}/> Consultar</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Modal Ficha Técnica */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white"><X size={20} /></button>
              <img src={selectedCar.image} className="w-full h-64 object-cover" alt={selectedCar.model} />
              <div className="p-10">
                <span className="text-[#EA580C] text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8 leading-none">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Motor</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.motor}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Transmisión</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.transmision}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Tracción</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.traccion}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Color</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.color}</p></div>
                </div>
                <button onClick={() => handleWhatsApp(selectedCar)} className="w-full bg-[#EA580C] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"><MessageCircle size={20}/> Consultar via WhatsApp</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Registro */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl text-left">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-2">REGISTRO <br/><span className="text-[#EA580C]">RED HOTCARS</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Acceso exclusivo</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="email" placeholder="Email profesional" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Crear contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button disabled={authLoading} className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all">
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
}"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
// Importamos Supabase desde una CDN para evitar errores de resolución en el entorno de vista previa
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { Search, ShieldCheck, Gauge, Loader2, UserPlus, X, CheckCircle2, AlertCircle, MessageCircle, Info } from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- INVENTARIO ESTÁTICO ---
const INVENTORY_DATA = [
  { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/toyota-hilux.jpg", specs: { motor: "2.8 TDI", transmision: "Automática", traccion: "4x4", color: "Blanco Perlado" } },
  { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ford-ranger.jpg", specs: { motor: "3.2 V6", transmision: "Manual", traccion: "4x4", color: "Gris Plata" } },
  { id: 3, brand: "Ford", model: "Territory", year: 2023, price: 38000, km: "12.000", status: "Disponible", image: "/cars/ford-territory.jpg", specs: { motor: "1.5 Turbo", transmision: "Automática", traccion: "4x2", color: "Azul" } },
  { id: 4, brand: "Honda", model: "Civic", year: 2021, price: 28900, km: "35.500", status: "Disponible", image: "/cars/honda-civic.jpg", specs: { motor: "2.0 i-VTEC", transmision: "CVT", traccion: "Delantera", color: "Negro" } },
  { id: 5, brand: "Peugeot", model: "208", year: 2023, price: 18500, km: "10.000", status: "Disponible", image: "/cars/peugeot-208.jpg", specs: { motor: "1.6 VTi", transmision: "Manual", traccion: "Delantera", color: "Blanco" } },
  { id: 6, brand: "Volkswagen", model: "Amarok", year: 2022, price: 49000, km: "40.000", status: "Vendido", image: "/cars/vw-amarok.jpg", specs: { motor: "3.0 V6", transmision: "Automática", traccion: "4x4", color: "Gris Oscuro" } },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Referencia para mantener el foco en el input
  const inputRef = useRef(null);
  const WHATSAPP_NUMBER = "5491123456789"; 

  // Filtrado optimizado para evitar re-renders innecesarios que cierren el teclado
  const filteredCars = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return INVENTORY_DATA;
    return INVENTORY_DATA.filter(car => 
      car.model.toLowerCase().includes(term) || 
      car.brand.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleWhatsApp = (car) => {
    const text = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) por $${car.price.toLocaleString()}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
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
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left selection:bg-orange-600 overflow-x-hidden">
      
      {/* Navbar estable */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setShowAuthModal(true)} 
          className="bg-[#EA580C] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
        >
          Acceso Red
        </button>
      </nav>

      {/* Buscador - Estructura optimizada para que el teclado no se cierre */}
      <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
            RED DE STOCK <br/><span className="text-[#EA580C]">HOTCARS.</span>
          </h1>
          
          <div className="relative max-w-xl">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Search size={20} />
            </div>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Buscá marca o modelo..." 
              className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-base appearance-none shadow-2xl"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              inputMode="search"
            />
          </div>
        </div>
      </header>

      {/* Listado de Autos */}
      <main className="max-w-7xl mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map((car) => (
          <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full shadow-lg hover:border-[#EA580C]/40 transition-colors">
            <div className="h-56 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
              <img 
                src={car.image} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                alt={car.model} 
                loading="lazy"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"; }} 
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#EA580C] text-white rounded-full text-[8px] font-black uppercase tracking-widest">{car.status}</div>
            </div>

            <div className="p-7 flex flex-col flex-grow">
              <span className="text-[#EA580C] text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
              <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-white">${car.price.toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
              </div>

              <div className="flex gap-4 mb-8 pt-6 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                  <div className="flex items-center gap-1.5"><Gauge size={14} className="text-[#EA580C]"/> {car.km} KM</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#EA580C]"/> GARANTÍA</div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => setSelectedCar(car)} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors hover:bg-slate-700"><Info size={14}/> Ficha</button>
                <button onClick={() => handleWhatsApp(car)} className="flex-[2] bg-[#EA580C] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 active:bg-orange-700 transition-colors"><MessageCircle size={14}/> Consultar</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Modal Ficha Técnica */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-200">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-black/80 transition-colors"><X size={20} /></button>
              <img src={selectedCar.image} className="w-full h-64 object-cover" alt={selectedCar.model} />
              <div className="p-10 text-left">
                <span className="text-[#EA580C] text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8 leading-none">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Motor</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.motor}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Transmisión</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.transmision}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Tracción</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.traccion}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Color</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.color}</p></div>
                </div>
                <button onClick={() => handleWhatsApp(selectedCar)} className="w-full bg-[#EA580C] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"><MessageCircle size={20}/> Consultar via WhatsApp</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Registro de Usuario */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl text-left">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-2">REGISTRO <br/><span className="text-[#EA580C]">RED HOTCARS</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Acceso exclusivo para revendedores</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="email" placeholder="Email profesional" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Crear contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button disabled={authLoading} className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors">
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
}"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, ShieldCheck, Gauge, Loader2, UserPlus, X, CheckCircle2, AlertCircle, MessageCircle, Info, ChevronRight } from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE (TUS DATOS) ---
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- INVENTARIO FUERA DEL COMPONENTE (ESTÁTICO) ---
const inventory = [
  { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/toyota-hilux.jpg", specs: { motor: "2.8 TDI", transmision: "Automática", traccion: "4x4", color: "Blanco Perlado" } },
  { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ford-ranger.jpg", specs: { motor: "3.2 V6", transmision: "Manual", traccion: "4x4", color: "Gris Plata" } },
  { id: 3, brand: "Ford", model: "Territory", year: 2023, price: 38000, km: "12.000", status: "Disponible", image: "/cars/ford-territory.jpg", specs: { motor: "1.5 Turbo", transmision: "Automática", traccion: "4x2", color: "Azul" } },
  { id: 4, brand: "Honda", model: "Civic", year: 2021, price: 28900, km: "35.500", status: "Disponible", image: "/cars/honda-civic.jpg", specs: { motor: "2.0 i-VTEC", transmision: "CVT", traccion: "Delantera", color: "Negro" } },
  { id: 5, brand: "Peugeot", model: "208", year: 2023, price: 18500, km: "10.000", status: "Disponible", image: "/cars/peugeot-208.jpg", specs: { motor: "1.6 VTi", transmision: "Manual", traccion: "Delantera", color: "Blanco" } },
  { id: 6, brand: "Volkswagen", model: "Amarok", year: 2022, price: 49000, km: "40.000", status: "Vendido", image: "/cars/vw-amarok.jpg", specs: { motor: "3.0 V6", transmision: "Automática", traccion: "4x4", color: "Gris Oscuro" } },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const WHATSAPP_NUMBER = "5491123456789"; // Reemplaza con tu número

  // Filtrado de autos
  const filteredCars = useMemo(() => {
    return inventory.filter(car => 
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      car.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleWhatsApp = (car) => {
    const text = Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) por $${car.price.toLocaleString()}.;
    window.open(https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}, '_blank');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
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
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left selection:bg-orange-600 overflow-x-hidden">
      {/* Navbar estable */}
      <nav className="h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <img src="/Logo_Hotcars_blanco.png" alt="HotCars" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setShowAuthModal(true)} 
          className="bg-[#EA580C] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
        >
          Acceso Red
        </button>
      </nav>

      {/* Header con Buscador - SECCIÓN ESTABLE */}
      <header className="py-16 px-6 bg-gradient-to-b from-slate-900 to-[#020617]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter uppercase italic">
            RED DE STOCK <br/><span className="text-[#EA580C]">HOTCARS.</span>
          </h1>
          
          <div className="relative max-w-xl">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={20} />
            </div>
            {/* Input con valor controlado pero sin re-render de estructura */}
            <input 
              key="main-search-input"
              type="text" 
              placeholder="Buscá marca o modelo..." 
              className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-base appearance-none"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              inputMode="text"
            />
          </div>
        </div>
      </header>

      {/* Listado de Unidades */}
      <main className="max-w-7xl mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="h-56 relative overflow-hidden cursor-pointer" onClick={() => setSelectedCar(car)}>
              <img 
                src={car.image} 
                className="w-full h-full object-cover" 
                alt={car.model} 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"; }} 
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#EA580C] text-white rounded-full text-[8px] font-black uppercase tracking-widest">{car.status}</div>
            </div>

            <div className="p-7 flex flex-col flex-grow">
              <span className="text-[#EA580C] text-[10px] font-black uppercase tracking-widest">{car.brand}</span>
              <h3 className="text-2xl font-black uppercase italic text-white mb-4 leading-none tracking-tight">{car.model}</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-white">${car.price.toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xs italic">{car.year}</span>
              </div>

              <div className="flex gap-4 mb-8 pt-6 border-t border-white/5 text-slate-400 font-bold text-[9px] uppercase">
                  <div className="flex items-center gap-1.5"><Gauge size={14} className="text-[#EA580C]"/> {car.km} KM</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#EA580C]"/> GARANTÍA</div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => setSelectedCar(car)}
                  className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Info size={14}/> Ficha
                </button>
                <button 
                  onClick={() => handleWhatsApp(car)}
                  className="flex-[2] bg-[#EA580C] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14}/> Consultar
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Modal Ficha Técnica */}
      {selectedCar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden relative shadow-2xl">
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 z-10 bg-black/60 p-2 rounded-full text-white">
                <X size={20} />
              </button>
              <img src={selectedCar.image} className="w-full h-64 object-cover" alt={selectedCar.model} />
              <div className="p-10 text-left">
                <span className="text-[#EA580C] text-xs font-black uppercase tracking-widest">{selectedCar.brand}</span>
                <h2 className="text-4xl font-black uppercase italic text-white mb-8">{selectedCar.model}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Motor</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.motor}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Transmisión</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.transmision}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Tracción</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.traccion}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-slate-500 text-[9px] font-black uppercase mb-1">Color</p><p className="text-white font-bold text-sm uppercase">{selectedCar.specs.color}</p></div>
                </div>
                <button onClick={() => handleWhatsApp(selectedCar)} className="w-full bg-[#EA580C] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  <MessageCircle size={20}/> Consultar via WhatsApp
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Registro */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl text-left">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black italic uppercase text-white leading-none mb-2">REGISTRO <br/><span className="text-[#EA580C]">RED HOTCARS</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Acceso exclusivo</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="email" placeholder="Email" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-800 border-none rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button disabled={authLoading} className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />} Unirme a la Red
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
