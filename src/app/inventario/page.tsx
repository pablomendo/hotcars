'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import hiddenData from '@/lib/tsconfig.sys.json';
import { 
  Search, Loader2, Trash2, PauseCircle, Play, Check, Pencil, LayoutGrid, List, X, ChevronDown, ChevronRight, DollarSign
} from 'lucide-react';

export default function InventoryPage() {
    const [inv, setInv] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState('ACTIVOS');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isMounted, setIsMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [selectedAuto, setSelectedAuto] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>('unidad');

    const extraInfo = useMemo(() => {
        if (!selectedAuto) return null;
        return (hiddenData as any[]).find((item: any) => item.id === selectedAuto.id);
    }, [selectedAuto]);

    useEffect(() => {
        setIsMounted(true);
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            fetchInventory(user?.id);
        };
        getUser();

        const channel = supabase
            .channel('inventory-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
                getUser();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInventory = async (currentUserId?: string | null) => {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData = (data || []).map(v => {
                const pv = Number(v.pv) || 0;
                const pc = Number(v.pc) || 0;

                return {
                    ...v,
                    brand: v.marca,
                    model: v.modelo,
                    year: v.anio,
                    km: v.km,
                    images: v.fotos || [],
                    location: v.provincia || '',
                    city: v.localidad || '',
                    inventory_status: (v.inventory_status || 'activo').toLowerCase(),
                    deal_status: v.deal_status || 'disponible',
                    publish_status: v.publish_status || 'publicado',
                    isProprio: v.created_by_user_id === (currentUserId || userId),
                    prices: {
                        purchasePrice: pc,
                        salePrice: pv,
                        myProfit: pv - pc,      
                        currency: v.moneda === 'USD' ? 'USD ' : '$ ARS '
                    }
                };
            });
            setInv(mappedData);
        } catch (err: any) {
            console.error("Error en Fetch:", err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            let updateData: any = {};
            if (action === 'DELETE') {
                if (!confirm('¿Eliminar unidad?')) return;
                await supabase.from('inventario').delete().eq('id', id);
                fetchInventory();
                return;
            }

            // --- LÓGICA CORREGIDA SEGÚN REGLAS ---
            if (action === 'PAUSE') {
                // Única excepción que afecta web
                updateData = { inventory_status: 'pausado', show_on_web: false };
            } 
            else if (action === 'ACTIVATE') {
                // Activar NO toca show_on_web (independencia)
                updateData = { inventory_status: 'activo' };
            } 
            else if (action === 'RESERVE') {
                // Reservar SOLO cambia estado, NO toca show_on_web y NO saca de activos
                updateData = { inventory_status: 'reservado' };
            } 
            else if (action === 'SELL') {
                // Vender no toca show_on_web automáticamente
                updateData = { inventory_status: 'vendido' };
            }

            await supabase.from('inventario').update(updateData).eq('id', id);
            fetchInventory();
        } catch (err: any) { alert(err.message); }
    };

    const filtered = useMemo(() => {
        return inv.filter(v => {
            const searchMatch = (v.brand?.toLowerCase() || "").includes(search.toLowerCase()) || 
                               (v.model?.toLowerCase() || "").includes(search.toLowerCase());
            if (!searchMatch) return false;

            switch (tab) {
                case 'ACTIVOS':
                    // Reservados siguen siendo inventario activo
                    return (v.inventory_status === 'activo' || v.inventory_status === 'reservado') && v.publish_status === 'publicado';
                case 'RESERVADOS':
                    return v.inventory_status === 'reservado';
                case 'PAUSADOS':
                    return v.inventory_status === 'pausado';
                case 'VENDIDOS':
                    return v.inventory_status === 'vendido';
                case 'BORRADORES':
                    return v.publish_status === 'borrador';
                case 'PROPIOS':
                    return v.isProprio;
                case 'TERCEROS':
                    return !v.isProprio && (v.inventory_status === 'activo' || v.inventory_status === 'reservado') && v.publish_status === 'publicado';
                default:
                    return false;
            }
        });
    }, [tab, search, inv, userId]);

    const counts = useMemo(() => ({
        ACTIVOS:    inv.filter(v => (v.inventory_status === 'activo' || v.inventory_status === 'reservado') && v.publish_status === 'publicado').length,
        RESERVADOS: inv.filter(v => v.inventory_status === 'reservado').length,
        PAUSADOS:   inv.filter(v => v.inventory_status === 'pausado').length,
        VENDIDOS:   inv.filter(v => v.inventory_status === 'vendido').length,
        BORRADORES: inv.filter(v => v.publish_status === 'borrador').length,
        PROPIOS:    inv.filter(v => v.isProprio).length,
        TERCEROS:   inv.filter(v => !v.isProprio && (v.inventory_status === 'activo' || v.inventory_status === 'reservado') && v.publish_status === 'publicado').length,
    }), [inv, userId]);

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]"><Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" /></div>;

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans">
            <style jsx global>{`
                @font-face {
                    font-family: 'Genos';
                    src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype');
                }
                button { cursor: pointer; }
            `}</style>

            <div className="fixed top-20 left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-6 pt-[14px] pb-3 lg:h-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center">
                    <div className="grid grid-cols-4 lg:flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
                        {[
                            { id: 'ACTIVOS', label: 'Activos' },
                            { id: 'RESERVADOS', label: 'Reservados' },
                            { id: 'PAUSADOS', label: 'Pausados' },
                            { id: 'VENDIDOS', label: 'Vendidos' },
                            { id: 'BORRADORES', label: 'Borradores' },
                            { id: 'PROPIOS', label: 'Propios' },
                            { id: 'TERCEROS', label: 'Terceros' }
                        ].map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setTab(t.id)} 
                                className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                                    tab === t.id 
                                    ? 'bg-[#134e4d] text-white shadow-md' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {t.label}
                                <span className={`text-[9px] lg:text-[10px] font-mono font-black ${tab === t.id ? 'opacity-70' : 'text-[#00984a]'}`}>
                                    {counts[t.id as keyof typeof counts]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <span style={{ fontFamily: 'Genos' }} className="text-white text-[12px] lg:text-[14px] font-light tracking-[3px] lg:tracking-[4px] uppercase opacity-40 mt-1">
                        Inventario
                    </span>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-40 pb-20 lg:pt-44">
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
                                    {v.inventory_status === 'reservado' && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-600 rounded text-[9px] font-bold text-white z-10">RESERVADO</div>
                                    )}
                                    {v.inventory_status === 'vendido' && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-600 rounded text-[9px] font-bold text-white z-10">VENDIDO</div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 text-left">
                                    <h3 className="font-bold text-xs uppercase truncate text-white tracking-tight">{v.brand} {v.model}</h3>
                                    <p className="text-[10px] text-slate-500 mb-2" suppressHydrationWarning>
                                        {v.year} • {isMounted ? v.km?.toLocaleString('es-AR') : '--'} KM
                                    </p>

                                    <div className="mb-1 opacity-50">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate block">
                                            {v.location} {v.city ? `• ${v.city}` : ''}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">PRECIO VENTA</span>
                                        <span className="text-sm font-black text-[#22c55e] leading-none" suppressHydrationWarning>
                                            {v.prices.currency}{isMounted ? v.prices.salePrice.toLocaleString('es-AR') : '--'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1.5 border-t border-white/5 pt-3">
                                        <div className="flex justify-between items-end opacity-50">
                                            <span className="text-[9px] uppercase font-bold tracking-tighter text-white">PRECIO CLIENTE / COMPRA</span>
                                            <span className="text-[11px] font-mono leading-none text-white" suppressHydrationWarning>
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
                                    <button onClick={() => handleAction(v.id, 'EDIT')} className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-slate-500 hover:text-blue-400">
                                        <Pencil size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Editar</span>
                                    </button>
                                    
                                    {v.inventory_status === 'pausado' ? (
                                        <button onClick={() => handleAction(v.id, 'ACTIVATE')} className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-green-500 bg-green-500/5">
                                            <Play size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Activar</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => handleAction(v.id, 'PAUSE')} className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-slate-500 hover:text-yellow-500">
                                            <PauseCircle size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Pausar</span>
                                        </button>
                                    )}

                                    <button onClick={() => handleAction(v.id, v.inventory_status === 'reservado' ? 'ACTIVATE' : 'RESERVE')} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inventory_status === 'reservado' ? 'text-orange-500 bg-orange-500/5' : 'text-slate-500 hover:text-orange-500'}`}>
                                        <DollarSign size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">{v.inventory_status === 'reservado' ? 'Quitar Res.' : 'Reservar'}</span>
                                    </button>

                                    <button onClick={() => handleAction(v.id, v.inventory_status === 'vendido' ? 'ACTIVATE' : 'SELL')} className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${v.inventory_status === 'vendido' ? 'text-green-500 bg-green-500/5' : 'text-slate-500 hover:text-[#22c55e]'}`}>
                                        <Check size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Vendido</span>
                                    </button>
                                    
                                    <button onClick={() => handleAction(v.id, 'DELETE')} className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-slate-600 hover:text-red-500">
                                        <Trash2 size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Borrar</span>
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
                                    <th className="p-4 text-right">Relación</th>
                                    <th className="p-4 text-right text-[#22c55e]">Venta (PV)</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((v) => (
                                    <tr key={v.id} onClick={() => setSelectedAuto(v)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <td className="p-4 font-black text-white uppercase tracking-tight">{v.brand} {v.model}</td>
                                        <td className="p-4 text-right font-mono opacity-50 text-[10px] uppercase">
                                            {v.isProprio ? 'MÍO' : 'TERCERO'}
                                        </td>
                                        <td className="p-4 text-right font-mono font-black text-[#22c55e] text-sm" suppressHydrationWarning>
                                            {v.prices.currency}{isMounted ? v.prices.salePrice.toLocaleString('es-AR') : '--'}
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                                {v.inventory_status === 'pausado' ? (
                                                    <button onClick={() => handleAction(v.id, 'ACTIVATE')} className="text-green-500"><Play size={14}/></button>
                                                ) : (
                                                    <button onClick={() => handleAction(v.id, 'PAUSE')} className="text-yellow-500"><PauseCircle size={14}/></button>
                                                )}
                                                <button onClick={() => handleAction(v.id, v.inventory_status === 'reservado' ? 'ACTIVATE' : 'RESERVE')} className={v.inventory_status === 'reservado' ? 'text-orange-500' : 'hover:text-orange-400'}><DollarSign size={14}/></button>
                                                <button onClick={() => handleAction(v.id, v.inventory_status === 'vendido' ? 'ACTIVATE' : 'SELL')} className={v.inventory_status === 'vendido' ? 'text-green-500' : 'hover:text-[#22c55e]'}><Check size={14}/></button>
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
                                    <div className="p-4 grid grid-cols-2 gap-y-3 border-t border-slate-100 animate-in slide-in-from-top duration-200 text-left">
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Marca</span><span className="text-xs font-black uppercase">{selectedAuto.brand}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Modelo</span><span className="text-xs font-black uppercase">{selectedAuto.model}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Estado Inv.</span><span className="text-xs font-black uppercase text-[#00984a]">{selectedAuto.inventory_status}</span></div>
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Relación</span><span className="text-xs font-black uppercase text-orange-600">{selectedAuto.isProprio ? 'PROPIO (MÍO)' : 'TERCERO'}</span></div>
                                        
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

                            <div className="grid grid-cols-3 gap-2 pt-4">
                                <button className="bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Pencil size={14}/> Editar</button>
                                <button onClick={() => handleAction(selectedAuto.id, selectedAuto.inventory_status === 'reservado' ? 'ACTIVATE' : 'RESERVE')} className={`py-3.5 rounded-xl text-[10px] font-black uppercase border flex items-center justify-center gap-2 transition-all ${selectedAuto.inventory_status === 'reservado' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}><DollarSign size={14}/> {selectedAuto.inventory_status === 'reservado' ? 'Quitar Res.' : 'Reservar'}</button>
                                <button onClick={() => handleAction(selectedAuto.id, selectedAuto.inventory_status === 'vendido' ? 'ACTIVATE' : 'SELL')} className={`py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${selectedAuto.inventory_status === 'vendido' ? 'bg-green-700 text-white' : 'bg-[#22c55e] text-black'}`}><Check size={14}/> {selectedAuto.inventory_status === 'vendido' ? 'Quitar Venta' : 'Vender'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}