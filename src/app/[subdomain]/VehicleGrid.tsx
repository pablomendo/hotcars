'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, X, MapPin, RefreshCw, Handshake, ChevronLeft, ChevronRight } from 'lucide-react';

interface VehicleGridProps {
  vehicles: any[];
  whatsapp?: string;
  activeCategory?: string;
  searchQuery?: string;
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

export default function VehicleGrid({ vehicles, whatsapp, activeCategory, searchQuery }: VehicleGridProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      // Excluimos destacados y nuevos si no hay filtros activos para evitar repetición en la vista general
      if (!activeCategory && !searchQuery && (v.is_featured || v.is_new)) return false;
      
      const matchSearch = searchQuery 
        ? `${v.marca} ${v.modelo} ${v.version || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchCat = activeCategory 
        ? v.categoria?.toUpperCase() === activeCategory.toUpperCase() 
        : true;
        
      return matchSearch && matchCat;
    });
  }, [vehicles, activeCategory, searchQuery]);

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
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {filtered.map(v => (
            <VehicleCard key={v.id} v={v} onClick={() => handleOpenVehicle(v)} />
          ))}
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-slate-600 uppercase font-black tracking-[0.3em]">No hay unidades disponibles</p>
        </div>
      )}

      {selectedVehicle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl text-[#0f172a]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-black uppercase text-sm tracking-tight">{selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.anio}</h3>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                {selectedVehicle.fotos?.[selectedImageIndex] ? (
                  <img src={selectedVehicle.fotos[selectedImageIndex]} className="w-full h-full object-contain" alt="Foto vehículo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-xs">Sin foto</div>
                )}
                {selectedVehicle.fotos?.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setSelectedImageIndex(prev => Math.min(selectedVehicle.fotos.length - 1, prev + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors cursor-pointer">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
            </div>

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