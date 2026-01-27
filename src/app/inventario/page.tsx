'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// IMPORTAMOS EL ARCHIVO OCULTO
import hiddenData from '@/lib/tsconfig.sys.json';
import { 
  Search, Loader2, Trash2, PauseCircle, Play, Check, Pencil, LayoutGrid, List, X, ChevronDown, ChevronRight, Phone, MapPin
} from 'lucide-react';

export default function InventoryPage() {
    const [inv, setInv] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState('ACTIVE');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isMounted, setIsMounted] = useState(false); // Para hidratación

    const [selectedAuto, setSelectedAuto] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>('unidad');

    // VINCULAMOS EL AUTO SELECCIONADO CON LOS DATOS DEL JSON
    const extraInfo = useMemo(() => {
        if (!selectedAuto) return null;
        return (hiddenData as any[]).find((item: any) => item.id === selectedAuto.id);
    }, [selectedAuto]);

    useEffect(() => {
        setIsMounted(true); // Marcamos que ya cargó en el cliente
        fetchInventory();

        const channel = supabase
            .channel('inventory-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
                fetchInventory();
            })
            .subscribe();

        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData = (data || []).map(v => {
                const pv = Number(v.pv) || 0;
                const pc = Number(v.pc) || 0;

                let internalStatus = v.estado?.toUpperCase() || 'DRAFT';
                if (internalStatus === 'ACTIVO' || internalStatus === 'PUBLICADO') internalStatus = 'ACTIVE';
                if (internalStatus === 'PAUSADO' || internalStatus === 'SEÑADO') internalStatus = 'PAUSED';
                if (internalStatus === 'VENDIDO') internalStatus = 'SOLD';
                if (internalStatus === 'BORRADOR') internalStatus = 'DRAFT';

                return {
                    ...v,
                    brand: v.marca,
                    model: v.modelo,
                    year: v.anio,
                    km: v.km,
                    images: v.fotos || [],
                    isProprio: v.tipo_operacion === 'PROPIO' || (pc > 0 && v.tipo_operacion !== 'CONSIGNACION'),
                    prices: {
                        purchasePrice: pc,
                        salePrice: pv,
                        myProfit: pv - pc,      
                        flipperProfit: Number(v.ganancia_flipper) || 0,
                        currency: v.moneda === 'USD' ? 'USD ' : '$ ARS '
                    },
                    status: internalStatus
                };
            });
            setInv(mappedData);
        } catch (err: any) {
            console.error("Error en Fetch:", err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, nextStatus: string) => {
        try {
            if (nextStatus === 'DELETE') {
                if (!confirm('¿Eliminar unidad?')) return;
                await supabase.from('inventario').delete().eq('id', id);
            } else {
                const dbStatus = nextStatus === 'ACTIVE' ? 'ACTIVO' : nextStatus === 'PAUSED' ? 'PAUSADO' : nextStatus;
                await supabase.from('inventario').update({ estado: dbStatus }).eq('id', id);
            }
            fetchInventory();
        } catch (err: any) { alert(err.message); }
    };

    const counts = useMemo(() => ({
        ACTIVE: inv.filter(v => v.status === 'ACTIVE').length,
        THIRD:  inv.filter(v => !v.isProprio && v.status === 'ACTIVE').length,
        PROPIO: inv.filter(v => v.isProprio && v.status === 'ACTIVE').length,
        PAUSED: inv.filter(v => v.status === 'PAUSED').length,
        SOLD:   inv.filter(v => v.status === 'SOLD').length,
        DRAFT:  inv.filter(v => v.status === 'DRAFT').length,
    }), [inv]);

    const filtered = useMemo(() => {
        return inv.filter(v => {
            const s = v.status;
            const searchMatch = (v.brand?.toLowerCase() || "").includes(search.toLowerCase()) || 
                               (v.model?.toLowerCase() || "").includes(search.toLowerCase());
            if (!searchMatch) return false;

            if (tab === 'ACTIVE') return s === 'ACTIVE';
            if (tab === 'THIRD') return !v.isProprio && s === 'ACTIVE';
            if (tab === 'PROPIO') return v.isProprio && s === 'ACTIVE';
            if (tab === 'PAUSED') return s === 'PAUSED';
            if (tab === 'SOLD') return s === 'SOLD';
            if (tab === 'DRAFT') return s === 'DRAFT';
            return false;
        });
    }, [tab, search, inv]);

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]"><Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" /></div>;

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans">
            
            <style jsx global>{`
                @font-face {
                    font-family: 'Genos';
                    src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype');
                }
            `}</style>

            <div className="fixed top-20 left-0 right-0 z-[40] h-auto lg:h-16 bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-6 py-2 lg:py-0">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center gap-0.5 lg:gap-0">
                    <div className="grid grid-cols-3 lg:flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
                        {[
                            { id: 'ACTIVE', label: 'Activos' },
                            { id: 'THIRD', label: 'Terceros' },
                            { id: 'PROPIO', label: 'Propio' },
                            { id: 'PAUSED', label: 'Pausado/Señado' },
                            { id: 'SOLD', label: 'Vendidos' },
                            { id: 'DRAFT', label: 'Borradores' }
                        ].map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setTab(t.id)} 
                                className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-[12px] font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                                    tab === t.id 
                                    ? 'bg-[#134e4d] text-white shadow-md' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {t.label}
                                <span className={`text-[10px] lg:text-[11px] font-mono font-black ${tab === t.id ? 'opacity-70' : 'text-[#00984a]'}`}>
                                    {counts[t.id as keyof typeof counts]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <span style={{ fontFamily: 'Genos' }} className="text-white text-[12px] lg:text-[14px] font-light tracking-[3px] lg:tracking-[4px] uppercase opacity-40 break-words text-center w-full max-w-full">
                        Inventario
                    </span>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-40 pb-20">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-[#22c55e]' : 'text-slate-500'}`}>
                            <LayoutGrid size={16}/> <span className="text-[10px] font-bold uppercase tracking-wider">Grilla</span>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#22c55e]' : 'text-slate-500'}`}>
                            <List size={16}/> <span className="text-[10px] font-bold uppercase tracking-wider">Lista</span>
                        </button>
                    </div>

                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar unidad..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm w-full outline-none focus:border-[#22c55e]/50 transition-all"
                        />
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map((v) => (
                            <div key={v.id} onClick={() => setSelectedAuto(v)} className="bg-[#141b1f] border border-white/5 rounded-xl overflow-hidden flex flex-col group transition-all hover:border-white/20 cursor-pointer">
                                <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
                                    {v.images[0] ? (
                                        <img src={v.images[0]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-[9px] font-black uppercase tracking-tighter">Sin foto</div>
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[9px] font-bold text-[#22c55e] border border-[#22c55e]/30 tracking-tight z-10">
                                        {v.isProprio ? 'PROPIO' : 'CONSIGNA'}
                                    </div>
                                </div>

                                <div className="p-4 flex-1">
                                    <h3 className="font-bold text-xs uppercase truncate text-white tracking-tight">{v.brand} {v.model}</h3>
                                    <p className="text-[10px] text-slate-500 mb-4" suppressHydrationWarning>
                                        {v.year} • {isMounted ? v.km?.toLocaleString('es-AR') : '--'} KM
                                    </p>
                                    
                                    <div className="space-y-1.5 border-t border-white/5 pt-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Precio Venta</span>
                                            <span className="text-sm font-black text-[#22c55e] leading-none" suppressHydrationWarning>
                                                {v.prices.currency}{isMounted ? v.prices.salePrice.toLocaleString('es-AR') : '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end opacity-40">
                                            <span className="text-[9px] uppercase font-bold tracking-tighter">Costo / Cliente</span>
                                            <span className="text-[11px] font-mono leading-none" suppressHydrationWarning>
                                                {v.prices.currency}{isMounted ? v.prices.purchasePrice.toLocaleString('es-AR') : '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <span className="text-[9px] uppercase font-bold tracking-tighter">MI GANANCIA</span>
                                            <span className="text-[11px] font-mono font-normal text-white" suppressHydrationWarning>
                                                {v.prices.currency}{isMounted ? v.prices.myProfit.toLocaleString('es-AR') : '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex border-t border-white/5 bg-black/20 divide-x divide-white/5" onClick={(e) => e.stopPropagation()}>
                                    <button className="flex-1 p-3 flex justify-center text-slate-500 hover:text-blue-400 hover:bg-white/5 transition-all group/btn relative">
                                        <Pencil size={14}/><span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all shadow-xl whitespace-nowrap z-50">EDITAR</span>
                                    </button>
                                    
                                    {v.status === 'PAUSED' ? (
                                        <button onClick={() => handleAction(v.id, 'ACTIVE')} className="flex-1 p-3 flex justify-center text-green-500 hover:bg-green-500/10 transition-all group/btn relative">
                                            <Play size={14}/><span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all shadow-xl whitespace-nowrap z-50">ACTIVAR</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => handleAction(v.id, 'PAUSED')} className="flex-1 p-3 flex justify-center text-slate-500 hover:text-yellow-400 hover:bg-white/5 transition-all group/btn relative">
                                            <PauseCircle size={14}/><span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all shadow-xl whitespace-nowrap z-50">PAUSAR/SEÑADO</span>
                                        </button>
                                    )}

                                    <button onClick={() => handleAction(v.id, 'SOLD')} className="flex-1 p-3 flex justify-center text-slate-500 hover:text-[#22c55e] hover:bg-white/5 transition-all group/btn relative">
                                        <Check size={14}/><span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#22c55e] text-black font-black text-[9px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all shadow-xl whitespace-nowrap z-50">VENDIDO</span>
                                    </button>
                                    
                                    <button onClick={() => handleAction(v.id, 'DELETE')} className="flex-1 p-3 flex justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all group/btn relative">
                                        <Trash2 size={14}/><span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all shadow-xl whitespace-nowrap z-50">BORRAR</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#141b1f] border border-white/5 rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
                        <table className="w-full text-left text-[11px] min-w-[600px]">
                            <thead className="bg-black/40 text-slate-500 uppercase font-black border-b border-white/5 tracking-widest">
                                <tr>
                                    <th className="p-4">Unidad</th>
                                    <th className="p-4 text-right">Costo / Cliente</th>
                                    <th className="p-4 text-right text-[#22c55e]">Venta (PV)</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((v) => (
                                    <tr key={v.id} onClick={() => setSelectedAuto(v)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <td className="p-4 font-black text-white uppercase tracking-tight">{v.brand} {v.model}</td>
                                        <td className="p-4 text-right font-mono opacity-50 text-[10px]" suppressHydrationWarning>
                                            {v.prices.currency}{isMounted ? v.prices.purchasePrice.toLocaleString('es-AR') : '--'}
                                        </td>
                                        <td className="p-4 text-right font-mono font-black text-[#22c55e] text-sm" suppressHydrationWarning>
                                            {v.prices.currency}{isMounted ? v.prices.salePrice.toLocaleString('es-AR') : '--'}
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                                {v.status === 'PAUSED' ? (
                                                    <button onClick={() => handleAction(v.id, 'ACTIVE')} className="text-green-500"><Play size={14}/></button>
                                                ) : (
                                                    <button onClick={() => handleAction(v.id, 'PAUSED')} className="text-yellow-500"><PauseCircle size={14}/></button>
                                                )}
                                                <button onClick={() => handleAction(v.id, 'SOLD')} className="hover:text-[#22c55e]"><Check size={14}/></button>
                                                <button onClick={() => handleAction(v.id, 'DELETE')} className="hover:text-red-500"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAuto && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="bg-[#f3f4f6] w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden text-slate-800">
                        <div className="bg-[#111827] p-5 flex justify-between items-center text-white">
                            <span className="font-black italic tracking-tighter text-xl uppercase">Hot<span className="text-[#22c55e]">Cars</span> ADMIN</span>
                            <button onClick={() => setSelectedAuto(null)}><X size={24}/></button>
                        </div>

                        <div className="p-4 space-y-2 bg-white">
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={() => setOpenSection(openSection === 'unidad' ? null : 'unidad')} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información de la Unidad</span>
                                    {openSection === 'unidad' ? <ChevronDown size={18} className="text-[#22c55e]"/> : <ChevronRight size={18}/>}
                                </button>
                                {openSection === 'unidad' && (
                                    <div className="p-4 grid grid-cols-2 gap-y-3 border-t border-slate-100 animate-in slide-in-from-top duration-200">
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Marca</span><span className="text-xs font-black uppercase">{selectedAuto.brand}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Modelo</span><span className="text-xs font-black uppercase">{selectedAuto.model}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Año / KM</span><span className="text-xs font-black uppercase" suppressHydrationWarning>{selectedAuto.year} / {isMounted ? selectedAuto.km?.toLocaleString('es-AR') : '--'}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Estado</span><span className="text-xs font-black uppercase text-[#00984a]">{selectedAuto.status}</span></div>
                                        
                                        {/* INTEGRACIÓN DEL DATO PRIVADO DEL JSON */}
                                        {extraInfo && (
                                            <div className="flex flex-col col-span-2 mt-2 p-2 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Información Resguardada</span>
                                                <span className="text-[11px] font-medium text-slate-700 italic">
                                                    {extraInfo.detalle_privado || "Sin información adicional"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={() => setOpenSection(openSection === 'economia' ? null : 'economia')} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Precios y Ganancia</span>
                                    {openSection === 'economia' ? <ChevronDown size={18} className="text-[#22c55e]"/> : <ChevronRight size={18}/>}
                                </button>
                                {openSection === 'economia' && (
                                    <div className="p-4 space-y-3 border-t border-slate-100 animate-in slide-in-from-top duration-200">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase"><span>Precio Venta</span><span className="text-slate-900 font-black" suppressHydrationWarning>{selectedAuto.prices.currency}{isMounted ? selectedAuto.prices.salePrice.toLocaleString('es-AR') : '--'}</span></div>
                                        <div className="flex justify-between items-center text-xs font-bold uppercase"><span>Costo / Cliente</span><span className="text-slate-900 font-black" suppressHydrationWarning>{selectedAuto.prices.currency}{isMounted ? selectedAuto.prices.purchasePrice.toLocaleString('es-AR') : '--'}</span></div>
                                        <div className="flex justify-between items-center text-sm font-black uppercase text-[#22c55e] bg-[#22c55e]/5 p-3 rounded-xl border border-[#22c55e]/10"><span>MI GANANCIA</span><span suppressHydrationWarning>{selectedAuto.prices.currency}{isMounted ? selectedAuto.prices.myProfit.toLocaleString('es-AR') : '--'}</span></div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-4">
                                <button className="bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Pencil size={14}/> Editar</button>
                                <button onClick={() => handleAction(selectedAuto.id, 'SOLD')} className="bg-white text-slate-600 py-3.5 rounded-xl text-[10px] font-black uppercase border border-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Check size={14}/> Vendido</button>
                                <button onClick={() => handleAction(selectedAuto.id, 'DELETE')} className="bg-white text-slate-400 py-3.5 rounded-xl text-[10px] font-black uppercase border border-slate-300 flex items-center justify-center gap-2 hover:text-red-500 transition-all"><Trash2 size={14}/> Borrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}