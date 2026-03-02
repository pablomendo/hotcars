'use client';

import { useState, useMemo } from 'react';
import { Search, X, MapPin, RefreshCw, Handshake, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { name: 'AUTO', label: 'Autos' },
  { name: 'PICKUP', label: 'Pickups' },
  { name: 'SUV', label: 'SUVs' },
  { name: 'UTILITARIO', label: 'Utilitarios' },
  { name: 'CAMION', label: 'Camiones' },
  { name: 'MOTO', label: 'Motos' },
];

interface VehicleGridProps {
  vehicles: any[];
  whatsapp?: string;
}

export default function VehicleGrid({ vehicles, whatsapp }: VehicleGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [soloFinanciacion, setSoloFinanciacion] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? v.categoria?.toUpperCase() === selectedCategory : true;
      const matchFin = soloFinanciacion ? !!v.financiacion : true;
      return matchSearch && matchCat && matchFin;
    });
  }, [vehicles, search, selectedCategory, soloFinanciacion]);

  const handleOpenVehicle = (v: any) => {
    setSelectedVehicle(v);
    setSelectedImageIndex(0);
  };

  const handleClose = () => {
    setSelectedVehicle(null);
    setSelectedImageIndex(0);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-12">

      {/* Título + contador */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-l-8 border-[#22c55e] pl-6">
          Stock Disponible
        </h2>
        <span className="text-slate-500 font-mono text-sm uppercase">{filtered.length} Unidades</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 mb-8">

        {/* Buscador */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por marca o modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full outline-none focus:border-[#22c55e]/50 transition-all text-white placeholder:text-slate-500"
          />
        </div>

        {/* Categorías + Financiación */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                selectedCategory === cat.name
                  ? 'bg-[#22c55e] text-black'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => setSoloFinanciacion(!soloFinanciacion)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              soloFinanciacion
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Handshake size={12} /> Financiación
          </button>
          {(selectedCategory || soloFinanciacion || search) && (
            <button
              onClick={() => { setSelectedCategory(null); setSoloFinanciacion(false); setSearch(''); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1"
            >
              <X size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grilla de cards — 2 columnas mobile, 3 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filtered.map((v) => (
          <div
            key={v.id}
            onClick={() => handleOpenVehicle(v)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[300px] md:h-[393px] w-full transition-all hover:shadow-xl cursor-pointer"
          >
            {/* Imagen */}
            <div className="relative h-[130px] md:h-[180px] w-full bg-gray-100 flex-shrink-0">
              {v.fotos?.[0] ? (
                <img
                  src={v.fotos[0]}
                  alt={`${v.marca} ${v.modelo}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase italic text-[8px]">Sin Foto</div>
              )}
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                {v.is_featured && <span className="bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Destacado</span>}
                {v.is_new && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Nuevo</span>}
                {v.inventory_status === 'reservado' && <span className="bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Reservado</span>}
                {v.financiacion && <span className="bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Financiación</span>}
              </div>
            </div>

            {/* Info */}
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
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-slate-600 uppercase font-black tracking-[0.3em]">No hay unidades que coincidan</p>
        </div>
      )}

      {/* POPUP DETALLE */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl text-[#0f172a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header popup */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-black uppercase text-sm tracking-tight">
                {selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.anio}
              </h3>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Galería */}
            <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
              {selectedVehicle.fotos?.[selectedImageIndex] ? (
                <img
                  src={selectedVehicle.fotos[selectedImageIndex]}
                  className="w-full h-full object-contain"
                  alt="Foto vehículo"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-xs">Sin foto</div>
              )}
              {selectedVehicle.fotos?.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => Math.min(selectedVehicle.fotos.length - 1, prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedVehicle.fotos.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === selectedImageIndex ? 'bg-white w-5' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {selectedVehicle.fotos?.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100">
                {selectedVehicle.fotos.map((foto: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#288b55]' : 'border-gray-200'}`}
                  >
                    <img src={foto} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
                ))}
              </div>
            )}

            {/* Info detalle */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{selectedVehicle.marca} {selectedVehicle.modelo}</h2>
                  <p className="text-[#3483fa] font-bold text-[13px] uppercase">{selectedVehicle.version}</p>
                </div>
                <span className="text-3xl font-black text-[#288b55] tracking-tighter">
                  {selectedVehicle.moneda === 'USD' ? 'U$S' : '$'} {Number(selectedVehicle.pv).toLocaleString('de-DE')}
                </span>
              </div>

              <div className="flex gap-4 text-[12px] font-bold text-gray-500 uppercase mb-4">
                <span>{selectedVehicle.anio}</span>
                <span>•</span>
                <span>{Number(selectedVehicle.km).toLocaleString('de-DE')} KM</span>
                {selectedVehicle.localidad && <><span>•</span><span className="flex items-center gap-1"><MapPin size={11}/>{selectedVehicle.localidad}</span></>}
              </div>

              {/* Permuta / Financiación */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className={`py-3 rounded-lg border flex items-center justify-center gap-2 ${selectedVehicle.acepta_permuta ? 'bg-white border-gray-300 text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}>
                  <RefreshCw size={14}/><span className="text-[11px] font-black uppercase">Permuta</span>
                </div>
                <div className={`py-3 rounded-lg border flex items-center justify-center gap-2 ${selectedVehicle.financiacion ? 'bg-white border-gray-300 text-[#1a1a1a]' : 'opacity-30 border-gray-100'}`}>
                  <Handshake size={14}/><span className="text-[11px] font-black uppercase">Financiamiento</span>
                </div>
              </div>

              {/* Descripción */}
              {selectedVehicle.descripcion && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{selectedVehicle.descripcion}</p>
                </div>
              )}

              {/* Características */}
              <div className="grid grid-cols-2 gap-y-3 mb-5">
                {[
                  { l: 'Marca', v: selectedVehicle.marca },
                  { l: 'Modelo', v: selectedVehicle.modelo },
                  { l: 'Año', v: selectedVehicle.anio },
                  { l: 'Kilómetros', v: selectedVehicle.km?.toLocaleString('de-DE') + ' km' },
                  { l: 'Versión', v: selectedVehicle.version },
                  { l: 'Combustible', v: selectedVehicle.tipo_combustible || 'Nafta' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.l}</span>
                    <span className="text-[13px] font-bold uppercase">{item.v}</span>
                  </div>
                ))}
              </div>

              {/* CTA WhatsApp */}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=Hola! Me interesa el ${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.anio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-[#22c55e] text-black rounded-xl font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#16a34a] transition-colors cursor-pointer"
                >
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
