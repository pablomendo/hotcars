'use client';

import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, MapPin, X, Bell, Eye, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import SubdomainClient from './[subdomain]/SubdomainClient';

export default function MarketplaceDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#e2e8f0]"><Loader2 className="animate-spin text-[#288b55] w-10 h-10" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

// ── Ticket Card ───────────────────────────────────────────────────────────────
function TicketCard({ user }: { user: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    marca: '', modelo: '', version: '',
    presupuesto: '', moneda: 'USD',
    acepta_inhibido: false, acepta_prendado: false, acepta_chocado: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    if (!form.marca.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('tickets_busqueda').insert({
        user_id: user.id,
        marca: form.marca.trim().toUpperCase(),
        modelo: form.modelo.trim().toUpperCase() || null,
        version: form.version.trim().toUpperCase() || null,
        presupuesto: form.presupuesto ? Number(form.presupuesto.replace(/\D/g, '')) : null,
        moneda: form.moneda,
        acepta_inhibido: form.acepta_inhibido,
        acepta_prendado: form.acepta_prendado,
        acepta_chocado: form.acepta_chocado,
        status: 'activo',
      });
      if (error) throw error;
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setForm({ marca: '', modelo: '', version: '', presupuesto: '', moneda: 'USD', acepta_inhibido: false, acepta_prendado: false, acepta_chocado: false });
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full bg-gray-100 rounded-lg px-3 py-2 text-[10px] md:text-[11px] font-bold uppercase outline-none focus:bg-gray-200 transition-colors placeholder:text-gray-400 placeholder:font-bold";

  return (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col shadow-sm h-[300px] md:h-[393px] w-full">
      <div className="flex flex-col items-center w-full mb-3 flex-shrink-0">
        <Bell className="text-[#288b55] mb-1 w-7 h-7 md:w-9 md:h-9" />
        <h3 className="font-black uppercase text-[10px] md:text-xs text-[#0f172a] text-center leading-tight">¿No encontrás lo que buscás?</h3>
        <p className="text-[7px] md:text-[8px] text-gray-400 uppercase font-bold mt-0.5">Activá un ticket para la red</p>
      </div>

      <div className="flex flex-col gap-1.5 flex-grow overflow-y-auto no-scrollbar">
        <input className={inputCls} placeholder="Marca" value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} />
        <input className={inputCls} placeholder="Modelo" value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} />
        <input className={inputCls} placeholder="Versión" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} />

        <div className="flex gap-1">
          <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
            {['USD', 'ARS'].map(m => (
              <button key={m} onClick={() => setForm(p => ({ ...p, moneda: m }))}
                className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${form.moneda === m ? 'bg-[#288b55] text-white' : 'text-gray-400'}`}>
                {m}
              </button>
            ))}
          </div>
          <input className={`${inputCls} flex-1`} placeholder="Presupuesto"
            value={form.presupuesto}
            onChange={e => setForm(p => ({ ...p, presupuesto: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') }))} />
        </div>

        <div className="flex gap-1 flex-wrap">
          {([
            { key: 'acepta_inhibido', label: 'Inhibido' },
            { key: 'acepta_prendado', label: 'Prendado' },
            { key: 'acepta_chocado', label: 'Chocado' },
          ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => (
            <button key={key}
              onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${
                form[key] ? 'bg-amber-500/10 border-amber-500/40 text-amber-600' : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}>
              {form[key] && <Check size={8} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={sending || !form.marca.trim()}
        className={`w-full py-2 rounded-lg uppercase text-[9px] md:text-[10px] font-black tracking-widest mt-2 flex-shrink-0 flex items-center justify-center gap-1.5 transition-all ${
          sent ? 'bg-[#22c55e] text-white' : 'bg-[#288b55] text-white hover:bg-[#1e6e42] disabled:opacity-40'
        }`}>
        {sending ? <Loader2 size={11} className="animate-spin" /> : sent ? <><Check size={11} /> Ticket enviado</> : 'Activar Ticket'}
      </button>
    </div>
  );
}

// ── Últimos Ingresos Slider ───────────────────────────────────────────────────
function UltimosIngresosSlider({ items }: { items: any[] }) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const visibleCount = 5;
  const max = Math.max(0, items.length - visibleCount);

  const prev = () => setOffset(o => Math.max(0, o - 1));
  const next = () => setOffset(o => Math.min(max, o + 1));

  const handleViewDetail = (id: string) => {
    sessionStorage.setItem('marketplace_scroll', window.scrollY.toString());
    router.push(`/vehiculos/${id}`);
  };

  if (items.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Flecha izquierda */}
      <button
        onClick={prev}
        disabled={offset === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 md:-ml-6 w-9 h-9 md:w-11 md:h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-[#0f172a] hover:bg-[#288b55] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Cards visibles */}
      <div className="overflow-hidden">
        <div
          className="flex gap-3 md:gap-4 transition-transform duration-400"
          style={{ transform: `translateX(calc(-${offset} * (100% / ${visibleCount} + 0px)))` }}
        >
          {items.map((v: any) => (
            <div
              key={v.id}
              onClick={() => handleViewDetail(v.id)}
              className="flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all border border-gray-200"
              style={{ width: `calc((100% - ${(visibleCount - 1) * 12}px) / ${visibleCount})` }}
            >
              {/* Foto grande */}
              <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                {v.fotos?.[0]
                  ? <img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>
                }
              </div>
              {/* Info sobre blanco */}
              <div className="bg-white px-3 py-2.5">
                <p className="text-[11px] md:text-[13px] font-black uppercase tracking-tight text-[#0f172a] truncate leading-tight">
                  {v.marca} {v.modelo}
                </p>
                <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase mt-0.5">
                  {v.anio} · <span suppressHydrationWarning>{v.km?.toLocaleString('de-DE')} KM</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flecha derecha */}
      <button
        onClick={next}
        disabled={offset >= max}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 md:-mr-6 w-9 h-9 md:w-11 md:h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-[#0f172a] hover:bg-[#288b55] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inv, setInv] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(15);
  const [totalResults, setTotalResults] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ultimosIngresos, setUltimosIngresos] = useState([]);

  const heroSlides = [
    { img: '/hero1-desktop-hotcars.jpg', ctaPosition: 'left', primaryLabel: 'Comenzar Ahora', primaryPath: '/register', secondaryLabel: 'Ingresar', secondaryPath: '/login' },
    { img: '/hero2-desktop-hotcars.jpg', ctaPosition: 'right', primaryLabel: 'Comenzar a vender', primaryPath: '/register', secondaryLabel: 'Ingresar', secondaryPath: '/login' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { name: "AUTO",       label: "Autos",       img: "/slider_front/vw_gol.jpeg" },
    { name: "PICKUP",     label: "Pickups",      img: "/slider_front/hilux1.jpg" },
    { name: "SUV",        label: "SUVs",         img: "/slider_front/corolla_cross1.jpg" },
    { name: "UTILITARIO", label: "Utilitarios",  img: "/slider_front/kangoo.jpeg" },
    { name: "CAMION",     label: "Camiones",     img: "/slider_front/iveco1.jpg" },
    { name: "MOTO",       label: "Motos",        img: "/slider_front/moto.jpg" },
  ];

  const fetchInventory = useCallback(async (filters: any = {}, currentLimit = 15) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('inventario')
        .select('id, marca, modelo, version, anio, km, pv, moneda, fotos, localidad, categoria, created_at', { count: 'exact' })
        .eq('inventory_status', 'activo')
        .gt('expires_at', new Date().toISOString());

      if (filters.categoria) query = query.ilike('categoria', filters.categoria);
      if (filters.marca)     query = query.ilike('marca', filters.marca);
      if (filters.modelo)    query = query.ilike('modelo', filters.modelo);

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(0, currentLimit - 1);
      if (error) throw error;
      setInv(data || []);
      setTotalResults(count || 0);
    } catch (err) {
      console.error("Error HotCars:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch últimos 10 ingresos para el slider
  useEffect(() => {
    supabase
      .from('inventario')
      .select('id, marca, modelo, anio, km, fotos, created_at')
      .eq('inventory_status', 'activo')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(0, 9)
      .then(({ data }) => setUltimosIngresos(data || []));
  }, []);

  useEffect(() => {
    const cat  = searchParams.get('categoria');
    const marc = searchParams.get('marca');
    const mod  = searchParams.get('modelo');
    if (cat)  setSelectedCategory(cat.toUpperCase());
    if (marc) setSearch(mod ? `${marc} ${mod}` : marc);
    fetchInventory({ categoria: cat, marca: marc, modelo: mod }, 15);
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [searchParams, fetchInventory]);

  useEffect(() => {
    if (displayLimit === 15) return;
    const cat  = searchParams.get('categoria');
    const marc = searchParams.get('marca');
    const mod  = searchParams.get('modelo');
    fetchInventory({ categoria: cat, marca: marc, modelo: mod }, displayLimit);
  }, [displayLimit]);

  useEffect(() => {
    const saved = sessionStorage.getItem('marketplace_scroll');
    if (saved) {
      setTimeout(() => { window.scrollTo({ top: parseInt(saved), behavior: 'instant' }); sessionStorage.removeItem('marketplace_scroll'); }, 100);
    }
  }, [inv]);

  const resetAllFilters = () => {
    setSelectedCategory(null);
    setSearch('');
    setDisplayLimit(15);
    sessionStorage.removeItem('marketplace_scroll');
    window.history.pushState(null, '', '/');
  };

  const filteredVehicles = useMemo(() => {
    return inv.filter(v => {
      const matchSearch = `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat    = selectedCategory ? v.categoria?.toUpperCase() === selectedCategory : true;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory, inv]);

  const handleViewDetail = (id: string) => {
    sessionStorage.setItem('marketplace_scroll', window.scrollY.toString());
    router.push(`/vehiculos/${id}`);
  };

  const showTicket = !!(search || selectedCategory);

  if (isLoading && inv.length === 0) return <div className="flex h-screen w-full items-center justify-center bg-[#e2e8f0]"><Loader2 className="animate-spin text-[#288b55] w-10 h-10" /></div>;

  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans tracking-tight overflow-x-hidden cursor-default pb-20 md:pb-0">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&family=Instrument+Serif&family=Urbanist:ital,wght@1,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        img { display: block; max-width: 100%; }

        .franklin-banner {
          font-family: 'Libre Franklin', sans-serif;
          font-weight: 900;
          display: inline-block;
          transform: scaleX(0.72);
          transform-origin: left;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .franklin-banner-right {
          font-family: 'Libre Franklin', sans-serif;
          font-weight: 900;
          display: inline-block;
          transform: scaleX(0.72);
          transform-origin: right;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .genos-banner {
          font-family: 'Genos', sans-serif;
          font-weight: 400;
        }
      `}</style>

      <nav className="flex justify-between items-center p-4 md:p-6 bg-white sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#0f172a]">HOTCARS <span className="text-[#2596be]">PRO</span></h1>
        <div className="px-3 py-1.5 bg-gray-200 border border-gray-300 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 uppercase">PABLO MENDO</div>
      </nav>

      {/* Hero — solo cuando no hay filtros */}
      {!search && !selectedCategory && (
        <section className="w-full relative flex flex-col bg-[#288b55] overflow-hidden -mt-[1px] z-10">
          {/* MOBILE */}
          <div className="md:hidden w-full aspect-[9/16] relative">
            <img src="/hero-mobile-hotcars.jpg" alt="Hero Mobile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 pointer-events-none">
              <div className="flex flex-col gap-3 pointer-events-auto">
                <p className="text-white text-center text-[26px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-snug mb-4 px-2" style={{ fontFamily: '"Instrument Serif", serif' }}>
                  Profesionalizate, publicá, compartí y gestioná tu inventario con tu propia web
                </p>
                {!user && (
                  <>
                    <button onClick={() => router.push('/register')} className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm hover:scale-105 transition-transform cursor-pointer">Registrate</button>
                    <button onClick={() => router.push('/login')} className="w-full py-4 bg-white/20 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm border border-white/30 backdrop-blur-sm cursor-pointer">Ingresar</button>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* DESKTOP slider */}
          <div className="hidden md:block w-full overflow-hidden relative">
            {heroSlides.map((slide, idx) => (
              <div key={idx} className={`w-full transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
                <img src={slide.img} alt={`Hero ${idx + 1}`} className="w-full h-auto object-cover align-top" />
                {!user && (
                  <div className={`absolute bottom-[18%] flex gap-4 pointer-events-auto z-10 ${slide.ctaPosition === 'right' ? 'right-[8%]' : 'left-[9.5%]'}`}>
                    <button onClick={() => router.push(slide.primaryPath)} className="px-10 py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm hover:scale-105 transition-transform cursor-pointer">{slide.primaryLabel}</button>
                    <button onClick={() => router.push(slide.secondaryPath)} className="px-10 py-4 bg-white/20 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer">{slide.secondaryLabel}</button>
                  </div>
                )}
              </div>
            ))}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroSlides.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banners */}
      {!search && !selectedCategory && (
        <div className="w-full bg-[#288b55] py-8">
          <div className="hidden md:block w-[70%] mx-auto mb-12">
            <img src="/banner1_largo.png" alt="Banner Largo 1" className="w-full h-auto object-cover" />
          </div>
          <div className="md:hidden w-full mb-8 px-4">
            <img src="/banner_phones_1.png" alt="Banner Mobile 1" className="w-full h-auto object-cover rounded-xl" />
          </div>

          {/* ── BANNERS FRANJAS ── */}
          <div className="w-full flex flex-col gap-0">

            {/* Franja 1 */}
            <div className="relative w-full overflow-hidden bg-[#e2e8f0]">
              {/* Desktop */}
              <div className="hidden md:block w-full relative">
                <img src="/Franjas_main_1_desktop.png" alt="Red Privada de Vendedores" className="w-full h-auto block" />
                <div className="absolute inset-0 flex flex-col justify-center px-[6%]" style={{ paddingTop: '120px' }}>
                  <h2 className="franklin-banner text-white mb-3 uppercase" style={{ fontSize: 'clamp(23px, 3vw, 51px)' }}>
                    Red Privada de Vendedores
                  </h2>
                  <p className="genos-banner text-white/90 leading-[1.2] mb-6" style={{ fontSize: 'clamp(20px, 1.6vw, 26px)' }}>
                    Accede al inventario de toda la red y multiplica<br />
                    tus opciones de venta sin necesidad de mas inversión.<br />
                    Gestión de grupos de trabajo.
                  </p>
                  <div>
                    <button onClick={() => router.push('/register')} className="px-8 py-3 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-[11px] rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                      Quiero Vender Más
                    </button>
                  </div>
                </div>
              </div>
              {/* Mobile */}
              <div className="md:hidden w-full relative">
                <img src="/banner-mobile-main-1.png" alt="Red Privada de Vendedores" className="w-full h-auto block" />
                <div className="absolute inset-0 flex flex-col justify-end px-[6%] pb-[8%]" style={{ paddingTop: '120px' }}>
                  <h2 className="franklin-banner text-white mb-2 uppercase" style={{ fontSize: 'clamp(22px, 6vw, 36px)' }}>
                    Red Privada de Vendedores
                  </h2>
                  <p className="genos-banner text-white/90 leading-[1.2] mb-4" style={{ fontSize: 'clamp(17px, 3.8vw, 22px)' }}>
                    Accede al inventario de toda la red y multiplica<br />
                    tus opciones de venta sin necesidad de mas inversión.<br />
                    Gestión de grupos de trabajo.
                  </p>
                  <div>
                    <button onClick={() => router.push('/register')} className="px-6 py-2.5 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                      Quiero Vender Más
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Franja 2 — texto actualizado + gradiente inferior */}
            <div className="relative w-full overflow-hidden bg-[#e2e8f0]">
              {/* Desktop */}
              <div className="hidden md:block w-full relative">
                <img src="/Franjas_main_2_desktop.png" alt="Tu Propia Agencia Online" className="w-full h-auto block" />
                {/* Gradiente de transparente a #288b55 al pie de la franja */}
                <div className="absolute bottom-0 left-0 w-full h-[75px] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #288b55)' }} />
                <div className="absolute inset-0 flex flex-col justify-center items-end px-[6%] text-right" style={{ paddingTop: '120px' }}>
                  <h2 className="franklin-banner-right text-white mb-3 uppercase" style={{ fontSize: 'clamp(23px, 3vw, 51px)' }}>
                    Tu Propia Agencia Online
                  </h2>
                  <p className="genos-banner text-white/90 leading-[1.2] mb-6" style={{ fontSize: 'clamp(20px, 1.6vw, 26px)' }}>
                    Tu web, tu marca, tu autoridad. Elevá tu profesionalismo<br />
                    con herramientas de IA para ventas y un dashboard de gestión<br />
                    diseñado para maximizar tus resultados.
                  </p>
                  <div>
                    <button onClick={() => router.push('/register')} className="px-8 py-3 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-[11px] rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                      Crear mi Propia Web
                    </button>
                  </div>
                </div>
              </div>
              {/* Mobile */}
              <div className="md:hidden w-full relative">
                <img src="/banner-mobile-2_main.png" alt="Tu Propia Agencia Online" className="w-full h-auto block" />
                {/* Gradiente de transparente a #288b55 al pie de la franja */}
                <div className="absolute bottom-0 left-0 w-full h-[65px] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #288b55)' }} />
                <div className="absolute inset-0 flex flex-col justify-end items-end px-[6%] pb-[8%] text-right" style={{ paddingTop: '120px' }}>
                  <h2 className="franklin-banner-right text-white mb-2 uppercase" style={{ fontSize: 'clamp(22px, 6vw, 36px)' }}>
                    Tu Propia Agencia Online
                  </h2>
                  <p className="genos-banner text-white/90 leading-[1.2] mb-4" style={{ fontSize: 'clamp(17px, 3.8vw, 22px)' }}>
                    Tu web, tu marca, tu autoridad. Elevá tu profesionalismo<br />
                    con herramientas de IA para ventas y un dashboard de gestión<br />
                    diseñado para maximizar tus resultados.
                  </p>
                  <div>
                    <button onClick={() => router.push('/register')} className="px-6 py-2.5 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                      Crear mi Propia Web
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* ── fin banners franjas ── */}

          <div className="md:hidden w-full mt-8 px-4">
            <img src="/banner_phones_2.png" alt="Banner Mobile 2" className="w-full h-auto object-cover rounded-xl" />
          </div>
        </div>
      )}

      {/* ── Slider Últimos Ingresos ── */}
      {!search && !selectedCategory && ultimosIngresos.length > 0 && (
        <section className="w-full bg-[#288b55] pt-10 pb-10">
          <div className="max-w-[1600px] mx-auto px-10 md:px-16">
            <h2 className="text-center text-white uppercase italic mb-8 md:mb-6 tracking-tighter text-[28px] md:text-[40px]" style={{ fontFamily: "'Genos', sans-serif" }}>
              Marketplace Últimos Ingresos
            </h2>
            <UltimosIngresosSlider items={ultimosIngresos} />
          </div>
        </section>
      )}

      {/* Categorías */}
      <section className="w-full bg-[#288b55] py-8 md:py-6 relative">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h2 className="text-center text-white uppercase italic mb-8 md:mb-6 tracking-tighter text-[28px] md:text-[40px]" style={{ fontFamily: "'Genos', sans-serif" }}>
            ¿Qué categoría estás buscando?
          </h2>
          <div className="grid grid-cols-2 md:flex md:justify-center items-center gap-6 md:gap-12">
            {categories.map((cat, idx) => (
              <div key={idx} onClick={() => { setSelectedCategory(cat.name); setDisplayLimit(15); fetchInventory({ categoria: cat.name }, 15); }}
                className="flex flex-col items-center cursor-pointer text-center group">
                <div className="w-full flex justify-center items-center h-24 md:h-24">
                  <img src={cat.img} alt={cat.label} className={`max-h-full w-auto object-contain transition-transform duration-300 ${selectedCategory === cat.name ? 'scale-110 brightness-110 drop-shadow-2xl' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`} />
                </div>
                <p className="text-white text-[11px] md:text-[14px] font-bold uppercase tracking-widest italic mt-4" style={{ fontFamily: "'Genos', sans-serif" }}>{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de resultados */}
      <div className="w-full mt-8 md:mt-12 pb-24 text-left">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-center relative mb-8 gap-4">
          <h2 className="italic uppercase font-medium text-[#0f172a] text-center text-[28px] md:text-[40px]" style={{ fontFamily: "'Genos', sans-serif" }}>
            {selectedCategory ? `${categories.find(c => c.name === selectedCategory)?.label} disponibles` : "Marketplace Hotcars"}
          </h2>
          {(selectedCategory || search) && <button onClick={resetAllFilters} className="text-gray-400 hover:text-red-600 transition-colors"><X size={28} /></button>}
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex justify-center mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="¿Qué tipo de vehículo estás buscando?" className="bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm w-full outline-none focus:border-[#288b55]" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6 items-start">

          {showTicket && <TicketCard user={user} />}

          {filteredVehicles.map((v: any) => (
            <div key={v.id} onClick={() => handleViewDetail(v.id)}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[300px] md:h-[393px] w-full transition-all hover:shadow-xl cursor-pointer">
              <div className="relative h-[130px] md:h-[180px] w-full bg-gray-100 flex-shrink-0">
                {v.fotos?.[0]
                  ? <img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>
                }
              </div>
              <div className="p-3 flex flex-col flex-grow overflow-hidden">
                <div className="flex-grow overflow-hidden">
                  <h3 className="text-[12px] md:text-[14px] font-bold tracking-tight uppercase truncate text-[#0f172a] mb-0.5">
                    {v.marca} {v.modelo} <span className="text-gray-400 ml-1">{v.anio}</span>
                  </h3>
                  <div className="text-[#0f172a] text-[10px] md:text-[11px] font-black uppercase mb-0.5" suppressHydrationWarning>
                    {v.km?.toLocaleString('de-DE')} KM
                  </div>
                  <div className="text-[#2596be] text-[9px] md:text-[10px] font-bold uppercase truncate mb-1.5">{v.version}</div>
                  <div className="flex items-center gap-1 text-gray-400 mb-2 font-bold uppercase text-[9px] md:text-[10px] truncate">
                    <MapPin size={10} /> {v.localidad || 'Ubicación'}
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="mb-2">
                    <span className="text-[#288b55] font-black text-lg md:text-xl leading-none" suppressHydrationWarning>
                      {v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <div className="w-full py-2 bg-[#0f172a] hover:bg-[#288b55] rounded-lg flex items-center justify-center gap-2 text-white font-black text-[10px] md:text-[11px] uppercase transition-colors">
                    <Eye size={12} /> Ver Detalle
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalResults > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm font-bold text-gray-500 uppercase italic" style={{ fontFamily: "'Genos', sans-serif" }}>
              Mostrando {filteredVehicles.length} de {totalResults} resultados
            </p>
            {totalResults > filteredVehicles.length && (
              <button onClick={() => setDisplayLimit(prev => prev + 15)} disabled={isLoading}
                className="px-12 py-3 bg-white border-2 border-[#288b55] text-[#288b55] font-black uppercase tracking-widest rounded-xl hover:bg-[#288b55] hover:text-white transition-all disabled:opacity-50 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Ver más unidades'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}