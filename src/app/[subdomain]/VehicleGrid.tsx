'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, X, MapPin, RefreshCw, Handshake, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { name: 'AUTO', label: 'Autos', img: '/slider_front/vw_gol.jpeg' },
  { name: 'PICKUP', label: 'Pickups', img: '/slider_front/hilux1.jpg' },
  { name: 'SUV', label: 'SUVs', img: '/slider_front/corolla_cross1.jpg' },
  { name: 'UTILITARIO', label: 'Utilitarios', img: '/slider_front/kangoo.jpeg' },
  { name: 'CAMION', label: 'Camiones', img: '/slider_front/iveco1.jpg' },
  { name: 'MOTO', label: 'Motos', img: '/slider_front/moto.jpg' },
];

interface VehicleGridProps {
  vehicles: any[];
  whatsapp?: string;
}

function VehicleCard({ v, onClick }: { v: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[300px] md:h-[393px] w-full transition-all hover:shadow-xl cursor-pointer"
    >
      <div className="relative h-[130px] md:h-[180px] w-full bg-gray-100 flex-shrink-0">
        {v.fotos?.[0] ? (
          <img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {v.inventory_status === 'reservado' && <span className="bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Reservado</span>}
          {v.financiacion && <span className="bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Financiación</span>}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-grow overflow-hidden text-left">
        <div className="flex-grow overflow-hidden">
          <h3 className="text-[12px] md:text-[14px] font-bold tracking-tight uppercase truncate text-[#0f172a] mb-0.5">
            {v.marca} {v.modelo} <span className="text-gray-400 ml-1">{v.anio}</span>
          </h3>
          <div className="text-[#0f172a] text-[10px] md:text-[11px] font-black uppercase mb-0.5">
            {v.km?.toLocaleString('de-DE')} KM
          </div>
          <div className="text-[#2596be] text-[9px] md:text-[10px] font-bold uppercase truncate mb-1.5">
            {v.version}
          </div>
          {v.localidad && (
            <div className="flex items-center gap-1 text-gray-400 font-bold uppercase text-[9px] md:text-[10px] truncate">
              <MapPin size={10} /> {v.localidad}
            </div>
          )}
        </div>
        <div className="mt-auto">
          <div className="mb-2">
            <span className="text-[#288b55] font-black text-lg md:text-xl leading-none">
              {v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.pv).toLocaleString('de-DE')}
            </span>
          </div>
          <div className="w-full py-2 bg-[#0f172a] hover:bg-[#288b55] rounded-lg flex items-center justify-center text-white font-black text-[10px] md:text-[11px] uppercase transition-colors">
            Ver Detalle
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VehicleGrid({ vehicles, whatsapp }: VehicleGridProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [soloFinanciacion, setSoloFinanciacion] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const sliderRef = useRef<HTMLDivElement>(null);

  const featured = useMemo(() => vehicles.filter(v => v.is_featured).slice(0, 3), [vehicles]);
  const newArrivals = useMemo(() => vehicles.filter(v => v.is_new), [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      if (v.is_featured || v.is_new) return false;
      const matchSearch = `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? v.categoria?.toUpperCase() === selectedCategory : true;
      const matchFin = soloFinanciacion ? !!v.financiacion : true;
      
      const priceValue = Number(v.pv);
      const matchPrice = maxPrice 
        ? (v.moneda === currency && priceValue <= Number(maxPrice))
        : true;

      return matchSearch && matchCat && matchFin && matchPrice;
    });
  }, [vehicles, search, selectedCategory, soloFinanciacion, maxPrice, currency]);

  const handleOpenVehicle = (v: any) => {
    router.push(`/vehiculos/${v.id}`);
  };

  const scrollSlider = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const cardWidth = (sliderRef.current.firstChild as HTMLElement)?.offsetWidth || 200;
    sliderRef.current.scrollBy({ left: dir === 'right' ? cardWidth * 2 : -cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-12">

      {/* FILTROS ESTILO HOTCARS */}
      <section className="w-full bg-[#0b1114] py-6 mb-10">
        <div className="flex flex-col gap-8">

          {/* Categorías con imágenes */}
          <div className="grid grid-cols-3 md:flex md:justify-center items-center gap-4 md:gap-10">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className="flex flex-col items-center cursor-pointer text-center group"
              >
                <div className="w-full flex justify-center items-center h-16 md:h-20">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className={`max-h-full w-auto object-contain transition-transform duration-300 ${
                      selectedCategory === cat.name
                        ? 'scale-110 brightness-110 drop-shadow-2xl'
                        : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
                    }`}
                  />
                </div>
                <p className={`text-[11px] md:text-[13px] font-bold uppercase tracking-widest italic mt-2 transition-colors ${
                  selectedCategory === cat.name ? 'text-[#22c55e]' : 'text-white'
                }`}>
                  {cat.label}
                </p>
              </div>
            ))}
          </div>

          {/* BUSCADOR DE PRESUPUESTO CENTRADO */}
          <div className="flex flex-col items-center justify-center gap-4 py-6 border-y border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">¿Cuál es tu presupuesto?</p>
            <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 w-full max-w-md">
              <div className="flex gap-1 pr-2 border-r border-white/10 mr-2">
                <button 
                  onClick={() => setCurrency('ARS')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${currency === 'ARS' ? 'bg-[#22c55e] text-black' : 'text-white/40'}`}
                >
                  $
                </button>
                <button 
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${currency === 'USD' ? 'bg-[#22c55e] text-black' : 'text-white/40'}`}
                >
                  U$D
                </button>
              </div>
              <input
                type="number"
                placeholder={`Hasta ${currency === 'ARS' ? '$' : 'U$D'} ...`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-transparent flex-1 outline-none text-white font-bold text-sm placeholder:text-white/20 px-2"
              />
              {maxPrice && (
                <button onClick={() => setMaxPrice('')} className="p-2 text-white/40 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Buscador + financiación + limpiar */}
          <div className="flex flex-wrap items-center gap-3 mt-2 justify-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por marca o modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full outline-none focus:border-[#22c55e]/50 transition-all text-white placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={() => setSoloFinanciacion(!soloFinanciacion)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                soloFinanciacion
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Handshake size={13} /> Financiación
            </button>
            {(selectedCategory || soloFinanciacion || search || maxPrice) && (
              <button
                onClick={() => { setSelectedCategory(null); setSoloFinanciacion(false); setSearch(''); setMaxPrice(''); }}
                className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1.5"
              >
                <X size={12} /> Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      {featured.length > 0 && !selectedCategory && !search && !soloFinanciacion && !maxPrice && (
        <section className="mb-12">
          <h2 className="text-white text-xl font-black uppercase tracking-widest border-l-4 border-[#22c55e] pl-4 mb-6">
            Destacados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {featured.map(v => (
              <VehicleCard key={v.id} v={v} onClick={() => handleOpenVehicle(v)} />
            ))}
          </div>
        </section>
      )}

      {/* NUEVOS INGRESOS */}
      {newArrivals.length > 0 && !selectedCategory && !search && !soloFinanciacion && !maxPrice && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-black uppercase tracking-widest border-l-4 border-[#2596be] pl-4">
              Nuevos Ingresos
            </h2>
            <div className="flex gap-2">
              <button onClick={() => scrollSlider('left')} className="p-2 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scrollSlider('right')} className="p-2 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div ref={sliderRef} className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
            {newArrivals.map(v => (
              <div key={v.id} className="w-[calc(50%-6px)] md:w-[calc(25%-14px)] flex-shrink-0">
                <VehicleCard v={v} onClick={() => handleOpenVehicle(v)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INVENTARIO GENERAL */}
      {filtered.length > 0 && (
        <section>
          {(featured.length > 0 || newArrivals.length > 0) && !selectedCategory && !search && !soloFinanciacion && !maxPrice && (
            <h2 className="text-white text-xl font-black uppercase tracking-widest border-l-4 border-slate-500 pl-4 mb-6">
              Todo el stock
            </h2>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {filtered.map(v => (
              <VehicleCard key={v.id} v={v} onClick={() => handleOpenVehicle(v)} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && featured.length === 0 && newArrivals.length === 0 && (
        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-slate-600 uppercase font-black tracking-[0.3em]">No hay unidades que coincidan</p>
        </div>
      )}
    </main>
  );
}