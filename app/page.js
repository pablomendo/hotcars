"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Wallet, 
  Clock, 
  LogOut, 
  ArrowRight,
  Gavel,
  CreditCard,
  ShieldCheck,
  Gauge,
  Lock,
  Mail,
  Loader2,
  Trash2,
  Edit3
} from 'lucide-react';

/**
 * HOTCARS - PLATAFORMA INTEGRAL
 * Carpeta: hotcars
 * Supabase URL: https://xkwkgcjgxjvidiwthwbr.supabase.co
 * Supabase Key: sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF
 * Nombres de archivos (según captura): hilux.png, ranger.png, golf.png, bmw.png
 */

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('marketplace'); 
  const [authMode, setAuthMode] = useState('login'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const LOGO_URL = "/Logo_Hotcars_blanco.png"; 

  const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co'; 
  const supabaseKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';

  // Inyección de Supabase con script para evitar errores de compilación
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (window.supabase) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabase(client);
        
        client.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setLoading(false);
        });

        client.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [supabaseUrl, supabaseKey]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu email para confirmar.");
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setView('marketplace');
  };

  /**
   * INVENTARIO: Nombres de archivos EXACTOS de tu carpeta /public/cars/
   */
  const inventory = [
    { id: 1, brand: "Toyota", model: "Hilux", year: 2024, price: 52500, km: "0", status: "Disponible", image: "/cars/hilux.png" },
    { id: 2, brand: "Ford", model: "Ranger", year: 2022, price: 45000, km: "28.000", status: "Disponible", image: "/cars/ranger.png" },
    { id: 3, brand: "Volkswagen", model: "Golf GTI", year: 2021, price: 38900, km: "15.500", status: "Vendido", image: "/cars/golf.png" },
    { id: 4, brand: "BMW", model: "M3 M-Sport", year: 2023, price: 68000, km: "5.000", status: "Disponible", image: "/cars/bmw.png" },
  ];

  const filteredCars = useMemo(() => {
    return inventory.filter(car => 
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      car.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, inventory]);

  const Logo = () => (
    <div className="flex items-center gap-4">
      <img 
        src={LOGO_URL} 
        alt="HotCars Logo" 
        className="h-12 md:h-16 w-auto object-contain"
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
      />
      <span style={{display: 'none'}} className="font-black text-2xl italic text-white uppercase tracking-tighter">
        <span className="text-[#EA580C] font-black italic">HOT</span>CARS
      </span>
    </div>
  );

  if (!session && view === 'admin') {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-left">
        <div className="mb-10 text-center text-left"><Logo /></div>
        <div className="w-full max-w-md bg-[#0f172a] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-3xl font-black italic uppercase text-white mb-2 leading-none text-left">{authMode === 'login' ? 'Bienvenido' : 'Registrarse'}</h2>
          <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest leading-none text-left">Acceso Red HotCars</p>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none text-left">Email de Usuario</label>
              <div className="relative text-left">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" required
                  className="w-full bg-[#1e293b] border-none rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-sm"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none text-left">Contraseña</label>
              <div className="relative text-left">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" required
                  className="w-full bg-[#1e293b] border-none rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-sm"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {errorMsg && <p className="text-rose-500 text-xs font-bold bg-rose-500/10 p-4 rounded-xl leading-tight text-left">{errorMsg}</p>}
            <button disabled={loading} className="w-full bg-[#EA580C] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#c2410c] transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 text-left">{loading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Iniciar Sesión' : 'Unirme ahora')}</button>
          </form>
          <div className="mt-8 text-center text-left">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em] text-left">{authMode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}</button>
          </div>
          <button onClick={() => setView('marketplace')} className="w-full mt-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-slate-400 transition-colors text-left">← Volver al Salón</button>
        </div>
      </div>
    );
  }

  const MarketplaceView = () => (
    <div className="min-h-screen bg-[#020617] text-white font-sans text-left">
      <nav className="h-24 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <Logo />
        <div className="hidden lg:flex items-center gap-4 text-left">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-300 text-left"><Gavel size={16} className="text-[#EA580C]" /> Subastas</button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-300 text-left"><CreditCard size={16} className="text-[#EA580C]" /> Financiación</button>
          <button onClick={() => setView('admin')} className="flex items-center gap-2 px-6 py-3 bg-[#EA580C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#c2410c] transition-all shadow-lg shadow-orange-600/20 text-left"><Plus size={18} /> Publicar Auto</button>
        </div>
        <button onClick={() => setView('admin')} className="p-3 bg-[#0f172a] rounded-xl border border-white/10 text-[#EA580C] lg:hidden hover:text-white transition-colors text-left"><LayoutDashboard size={20} /></button>
      </nav>

      <header className="py-24 px-6 border-b border-white/5 bg-gradient-to-b from-[#0f172a] to-[#020617] relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#EA580C]/5 blur-[120px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-left">
          <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.85] tracking-tighter uppercase italic text-left">RED DE STOCK <br/><span className="text-[#EA580C]">HOTCARS.</span></h1>
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mt-12 bg-[#0f172a] p-4 rounded-[2.5rem] border border-white/10 shadow-3xl text-left">
            <div className="flex-1 relative text-left">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
              <input type="text" placeholder="¿Qué unidad buscás?" className="w-full pl-16 pr-6 py-6 bg-[#1e293b] rounded-2xl border-none text-white font-bold outline-none focus:ring-2 focus:ring-[#EA580C] transition-all text-sm text-left" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="bg-[#EA580C] text-white px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#c2410c] shadow-lg shadow-orange-600/20 transition-all text-left">Buscar Stock</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-24 px-6 text-left">
        <div className="flex items-center gap-4 mb-16 text-left">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#EA580C] italic leading-none text-left">Unidades Disponibles</h2>
          <div className="h-[1px] flex-1 bg-white/5 text-left"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 text-left">
          {filteredCars.map((car) => (
            <div key={car.id} className="group bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden hover:border-[#EA580C]/50 transition-all duration-500 shadow-xl text-left">
              <div className="h-64 relative overflow-hidden text-left">
                <img 
                  src={car.image} 
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                  alt={car.model} 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800"; }} 
                />
                <div className="absolute top-6 right-6 text-left"><div className="px-5 py-2 bg-[#EA580C] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl leading-none text-left">{car.status}</div></div>
              </div>
              <div className="p-9 text-left">
                <span className="text-[#EA580C] text-[10px] font-black uppercase tracking-[0.2em] mb-2 block leading-none text-left">{car.brand}</span>
                <h3 className="text-2xl font-black uppercase italic text-white mb-6 leading-none tracking-tight text-left">{car.model}</h3>
                <div className="flex items-center justify-between mb-8 text-left text-left"><span className="text-3xl font-black tracking-tighter text-white leading-none text-left">${car.price.toLocaleString()}</span><span className="text-sm font-black text-slate-500 italic leading-none text-left">{car.year}</span></div>
                <div className="flex items-center gap-4 mb-8 pt-6 border-t border-white/5 text-left text-left"><div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase leading-none text-left"><Gauge size={14} className="text-[#EA580C]"/> {car.km} KM</div><div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase leading-none text-left"><ShieldCheck size={14} className="text-[#EA580C]"/> GARANTÍA</div></div>
                <button className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#EA580C] hover:text-white transition-all text-left">Consultar</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  const AdminView = () => (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden text-left">
      <aside className="w-72 bg-[#0f172a] flex flex-col shrink-0 border-r border-white/5 shadow-2xl text-left">
        <div className="h-24 flex items-center px-8 border-b border-white/5 text-left text-left text-left"><Logo /></div>
        <nav className="flex-1 p-8 space-y-4 text-left text-left">
          <AdminNavItem icon={<LayoutDashboard size={20}/>} label="Escritorio" active /><AdminNavItem icon={<Car size={20}/>} label="Gestionar Stock" /><AdminNavItem icon={<Users size={20}/>} label="Mis Leads" /><AdminNavItem icon={<TrendingUp size={20}/>} label="Ventas" />
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4 text-left text-left">
          <div className="px-4 py-3 bg-slate-800/50 rounded-xl text-left text-left overflow-hidden"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none text-left text-left text-left">Sesión</p><p className="text-[10px] font-bold text-white truncate leading-none tracking-tighter text-left text-left text-left">{session?.user?.email}</p></div>
          <button onClick={handleSignOut} className="w-full py-5 bg-[#1e293b] text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 text-left text-left"><LogOut size={16}/> Salir</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden text-left text-left">
        <header className="h-24 bg-[#020617] flex items-center justify-between px-10 border-b border-white/5 text-left text-left text-left">
          <div className="flex flex-col text-left text-left"><h2 className="text-2xl font-black italic uppercase text-[#EA580C] leading-none tracking-tighter leading-none text-left text-left">Mi Oficina</h2><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-none text-left text-left">Administración de Red</p></div>
          <button className="bg-[#EA580C] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#c2410c] transition-all text-left text-left"><Plus size={20}/> Publicar Auto</button>
        </header>
        <main className="flex-1 overflow-y-auto p-12 text-left text-left text-left text-left">
          <div className="max-w-6xl mx-auto text-left text-left text-left text-left text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-14 text-left text-left text-left text-left"><MetricCard title="STOCK" value="12" icon={<Car size={22}/>} /><MetricCard title="VENTAS" value="5" icon={<TrendingUp size={22}/>} /><MetricCard title="LEADS" value="18" icon={<Users size={22}/>} /><MetricCard title="RESERVAS" value="2" icon={<Clock size={22}/>} /><MetricCard title="VALOR" value="$380k" icon={<Wallet size={22}/>} /></div>
            <div className="bg-[#0f172a] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl text-left text-left text-left">
              <div className="p-10 border-b border-white/5 flex justify-between items-center text-left text-left text-left text-left"><h3 className="font-black text-[11px] uppercase tracking-[0.4em] text-slate-400 leading-none tracking-widest leading-none text-left text-left">Mi Inventario</h3><Filter size={20} className="text-[#EA580C] cursor-pointer hover:text-white transition-colors text-left text-left"/></div>
              <div className="overflow-x-auto text-left text-left text-left text-left"><table className="w-full text-left text-left text-left text-left"><thead className="bg-white/5 text-left text-left text-left"><tr className="text-left text-left text-left text-left text-left text-left text-left"><th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left leading-none text-left text-left">Unidad</th><th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left leading-none text-left text-left">Precio</th><th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left leading-none text-left text-left text-left">Estado</th><th className="px-10 py-7 text-left text-left text-left"></th></tr></thead><tbody className="divide-y divide-white/5 text-left text-left text-left text-left">
                {inventory.map(v => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors text-left text-left text-left text-left text-left"><td className="px-10 py-8 text-left text-left text-left text-left text-left"><div className="flex flex-col text-left text-left text-left text-left text-left text-left text-left"><span className="font-black text-white text-lg uppercase italic tracking-tight leading-none mb-2 text-left text-left text-left">{v.brand} {v.model}</span><span className="text-[10px] text-slate-500 font-bold uppercase leading-none text-left text-left text-left text-left">{v.year} | {v.km} KM</span></div></td><td className="px-10 py-8 font-black text-[#EA580C] text-2xl tracking-tighter text-left leading-none text-left text-left text-left text-left text-left text-left">${v.price.toLocaleString()}</td><td className="px-10 py-8 text-left leading-none text-left text-left text-left text-left text-left text-left text-left"><span className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-600/10 text-[#EA580C] border border-orange-600/20 leading-none text-left text-left text-left text-left text-left">{v.status}</span></td><td className="px-10 py-8 text-right text-left text-left text-left text-left text-left text-left text-left text-left"><div className="flex justify-end gap-5 text-left text-left text-left text-left text-left"><Edit3 size={18} className="text-slate-600 hover:text-white cursor-pointer transition-colors text-left text-left text-left text-left" /><Trash2 size={18} className="text-slate-600 hover:text-rose-500 cursor-pointer transition-colors text-left text-left text-left text-left text-left" /></div></td></tr>
                ))}
              </tbody></table></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-left text-left"><Loader2 className="animate-spin text-[#EA580C]" size={56} /></div>;
  return view === 'marketplace' ? <MarketplaceView /> : <AdminView />;
}

function AdminNavItem({ icon, label, active = false }) {
  return <button className={`w-full flex items-center gap-5 px-7 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all text-left text-left ${active ? 'bg-[#EA580C] text-white shadow-xl shadow-orange-600/20' : 'text-slate-500 hover:bg-[#1e293b] hover:text-white'}`}>{icon} {label}</button>;
}

function MetricCard({ title, value, icon }) {
  return <div className="bg-[#0f172a] p-9 rounded-[2.5rem] border border-white/5 flex flex-col gap-8 hover:border-orange-600/30 transition-all text-left shadow-lg group text-left text-left"><div className="w-14 h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white transition-all shadow-inner text-left text-left">{icon}</div><div className="text-left text-left text-left text-left"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none text-left text-left text-left text-left">{title}</p><p className="text-4xl font-black text-white italic tracking-tighter leading-none text-left text-left text-left text-left">{value}</p></div></div>;
}