'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import hiddenData from '@/lib/tsconfig.sys.json';
import { 
  Search, Loader2, Trash2, PauseCircle, Play, Check, Pencil, LayoutGrid, List, X, ChevronDown, ChevronRight, DollarSign, AlertTriangle, RefreshCcw, LogOut, Zap, AlertCircle
} from 'lucide-react';

export default function InventoryPage() {
    const router = useRouter();
    const [inv, setInv] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [tab, setTab] = useState('ACTIVOS');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isMounted, setIsMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('Free'); 

    const [selectedAuto, setSelectedAuto] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>('unidad');
    const [showLimitModal, setShowLimitModal] = useState(false);

    const extraInfo = useMemo(() => {
        if (!selectedAuto) return null;
        const dataArray = Array.isArray(hiddenData) 
            ? hiddenData 
            : (hiddenData as any)?.default || [];
            
        if (!Array.isArray(dataArray)) return null;
        return dataArray.find((item: any) => item.id === selectedAuto.id);
    }, [selectedAuto]);

    useEffect(() => {
        setIsMounted(true);
        const initializeData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    
                    const { data: profile } = await supabase
                        .from('usuarios')
                        .select('plan_type')
                        .eq('auth_id', user.id)
                        .maybeSingle();

                    if (profile) setUserPlan(profile.plan_type || 'Free');
                    
                    await fetchInventory(user.id);
                }
            } catch (err: any) {
                console.error("Error en inicialización:", err.message);
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();

        const channel = supabase
            .channel('inventory-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => {
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const fetchInventory = async (currentUserId?: string) => {
        if (!currentUserId) return;
        try {
            const [misAutos, misFlips] = await Promise.all([
                supabase
                    .from('inventario')
                    .select('id, marca, modelo, anio, km, fotos, provincia, localidad, inventory_status, commercial_status, moneda, pv, pc, ganancia_dueno, expires_at, created_at, owner_user_id, is_flip')
                    .eq('owner_user_id', currentUserId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('flip_compartido')
                    .select('auto_id, inventario:auto_id(id, marca, modelo, anio, km, fotos, provincia, localidad, inventory_status, commercial_status, moneda, pv, pc, ganancia_dueno, ganancia_flipper, expires_at, created_at, owner_user_id, is_flip)')
                    .eq('vendedor_user_id', currentUserId)
                    .eq('status', 'approved')
            ]);

            const propios = misAutos.data || [];
            const terceros = (misFlips.data || [])
                .map((f: any) => f.inventario)
                .filter((i: any) => i !== null);

            const allData = [...propios, ...terceros].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const mappedData = allData.map(v => {
                const pvValue = Number(v.pv) || 0;
                const pcValue = Number(v.pc) || 0;
                const isProprio = v.owner_user_id === currentUserId;

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
                    commercial_status: (v.commercial_status || 'disponible').toLowerCase(),
                    isProprio: isProprio,
                    prices: {
                        purchasePrice: pcValue,
                        salePrice: pvValue,
                        myProfit: isProprio ? (Number(v.ganancia_dueno) || 0) : (Number(v.ganancia_flipper) || 0),
                        currency: v.moneda === 'USD' ? 'USD ' : '$ ARS '
                    }
                };
            });
            setInv(mappedData);
        } catch (err: any) {
            console.error("Error en Fetch HotCars:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (item: any, action: string) => {
        const id = item.id;

        if (action === 'DELETE') {
            if (item.isProprio) {
                if (!confirm('¿Eliminar unidad permanentemente?')) return;
                setProcessingId(id);
                try {
                    const { error } = await supabase.from('inventario').delete().eq('id', id);
                    if (error) throw error;
                    setInv(prev => prev.filter(i => i.id !== id));
                    if (selectedAuto?.id === id) setSelectedAuto(null);
                } catch (err: any) {
                    alert(err.message);
                } finally {
                    setProcessingId(null);
                }
            } else {
                if (!confirm('Esta unidad es un FLIP compartido. ¿Deseas quitarla de tu inventario?')) return;
                setProcessingId(id);
                try {
                    const { error } = await supabase
                        .from('flip_compartido')
                        .delete()
                        .eq('auto_id', id)
                        .eq('vendedor_user_id', userId);

                    if (error) throw error;

                    setInv(prev => prev.filter(i => i.id !== id));
                    if (selectedAuto?.id === id) setSelectedAuto(null);
                    
                    await fetchInventory(userId || undefined);
                } catch (err: any) {
                    alert("Error al quitar flip: " + err.message);
                } finally {
                    setProcessingId(null);
                }
            }
            return;
        }

        if (!item.isProprio) {
            alert("Acceso denegado: Solo el dueño de la unidad puede modificar su estado comercial o de inventario.");
            return;
        }

        setProcessingId(id);
        try {
            let updateData: any = {};

            if (action === 'ACTIVATE' || action === 'RENEW') {
                const { data, error } = await supabase.rpc('activar_vehiculo_inventario', {
                    p_auto_id: id,
                    p_user_id: userId,
                    p_accion: action
                });

                if (error) throw error;

                if (!data.ok) {
                    if (data.error === 'limite_alcanzado') {
                        setShowLimitModal(true);
                    }
                    return;
                }

                updateData = action === 'RENEW'
                    ? { inventory_status: 'activo', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
                    : { inventory_status: 'activo' };

                setInv(prev => prev.map(i => i.id === id ? { ...i, ...updateData } : i));
                if (selectedAuto?.id === id) setSelectedAuto((prev: any) => ({ ...prev, ...updateData }));

                setTimeout(() => fetchInventory(userId || undefined), 500);
                return;
            } else if (action === 'PAUSE') {
                updateData = { inventory_status: 'pausado', show_on_web: false };
            } else if (action === 'RESERVE') {
                updateData = { commercial_status: 'reservado' };
            } else if (action === 'SELL') {
                updateData = { commercial_status: 'vendido' };
            } else if (action === 'SET_AVAILABLE') {
                updateData = { commercial_status: 'disponible' };
            }

            setInv(prev => prev.map(i => i.id === id ? { ...i, ...updateData } : i));
            if (selectedAuto?.id === id) setSelectedAuto((prev: any) => ({ ...prev, ...updateData }));

            const { error } = await supabase.from('inventario').update(updateData).eq('id', id);
            if (error) throw error;
            
            setTimeout(() => fetchInventory(userId || undefined), 500);
        } catch (err: any) { 
            alert(err.message);
            fetchInventory(userId || undefined);
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = useMemo(() => {
        return inv.filter(v => {
            const searchMatch = (v.brand?.toLowerCase() || "").includes(search.toLowerCase()) || 
                               (v.model?.toLowerCase() || "").includes(search.toLowerCase());
            if (!searchMatch) return false;

            switch (tab) {
                case 'ACTIVOS':
                    return v.inventory_status === 'activo';
                case 'RESERVADOS':
                    return v.commercial_status === 'reservado';
                case 'PAUSADOS':
                    return v.inventory_status === 'pausado';
                case 'VENDIDOS':
                    return v.commercial_status === 'vendido';
                case 'PROPIOS':
                    return v.isProprio;
                case 'TERCEROS':
                    return !v.isProprio;
                default:
                    return false;
            }
        });
    }, [tab, search, inv, userPlan]);

    const counts = useMemo(() => {
        return {
            ACTIVOS:    inv.filter(v => v.inventory_status === 'activo').length,
            RESERVADOS: inv.filter(v => v.commercial_status === 'reservado').length,
            PAUSADOS:   inv.filter(v => v.inventory_status === 'pausado').length,
            VENDIDOS:   inv.filter(v => v.commercial_status === 'vendido').length,
            PROPIOS:    inv.filter(v => v.isProprio).length,
            TERCEROS:   inv.filter(v => !v.isProprio).length,
        };
    }, [inv, userPlan]);

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]"><Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" /></div>;

    return (
        <div className="bg-[#0b1114] min-h-screen w-full text-slate-300 font-sans text-left">
            <style jsx global>{`
                @font-face {
                    font-family: 'Genos';
                    src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype');
                }
                button { cursor: pointer; }
            `}</style>

            {showLimitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8 text-orange-600 border border-orange-100">
                            <AlertCircle size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black uppercase text-[#1e293b] mb-4">Límite alcanzado</h3>
                        <p className="text-gray-500 text-[15px] leading-relaxed mb-10 font-medium text-center">
                            Tu plan actual no permite sumar más unidades activas. <br/> Liberá cupo o actualizá tu suscripción ahora.
                        </p>
                        <button 
                            onClick={() => router.push('/planes')} 
                            className="w-full py-5 bg-[#ff4d00] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-200 hover:bg-[#e64500] transition-all active:scale-95 mb-6"
                        >
                            Mejorar plan ahora
                        </button>
                        <button onClick={() => setShowLimitModal(false)} className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-600">Cerrar</button>
                    </div>
                </div>
            )}

            <div className="fixed top-20 left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-center px-6 pt-[14px] pb-3 lg:h-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center">
                    
                    <div className="grid grid-cols-4 lg:flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
                        {[
                            { id: 'ACTIVOS', label: 'Activos' },
                            { id: 'RESERVADOS', label: 'Reservados' },
                            { id: 'PAUSADOS', label: 'Pausados' },
                            { id: 'VENDIDOS', label: 'Vendidos' },
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

                    <div className="mt-1 flex items-center gap-3">
                        <span style={{ fontFamily: 'Genos' }} className="text-white text-[12px] lg:text-[14px] font-light tracking-[3px] lg:tracking-[4px] uppercase opacity-40">
                            Inventario
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded uppercase tracking-widest">Plan {userPlan}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {counts.ACTIVOS} / {userPlan.toUpperCase() === 'VIP' ? '∞' : (userPlan.toUpperCase() === 'PRO' ? 25 : 12)} Unidades
                            </span>
                        </div>
                    </div>
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
                        {filtered.map((v) => {
                            const isExpired = v.expires_at && new Date(v.expires_at) < new Date();
                            const isProcessing = processingId === v.id;
                            return (
                                <div key={v.id} onClick={() => !isProcessing && setSelectedAuto(v)} className={`bg-[#141b1f] border border-white/5 rounded-xl overflow-hidden flex flex-col group transition-all hover:border-white/20 cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
                                        {isProcessing ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                                                <Loader2 className="animate-spin text-[#22c55e]" size={24} />
                                            </div>
                                        ) : null}
                                        {v.images[0] ? (
                                            // ✅ FIX: loading="lazy" para no cargar todas las imágenes a la vez
                                            <img src={v.images[0]} alt="" loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700 text-[9px] font-black uppercase tracking-tighter">Sin foto</div>
                                        )}
                                        {!v.isProprio && (
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#2596be] rounded flex items-center gap-1 text-[8px] font-black text-white z-10 shadow-lg border border-white/20 uppercase tracking-tighter animate-pulse">
                                                <Zap size={8} fill="currentColor" /> Flip Compartido
                                            </div>
                                        )}
                                        {v.isProprio && isExpired && (
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 rounded text-[9px] font-bold text-white z-10">VENCIDA</div>
                                        )}
                                        {v.commercial_status === 'reservado' && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-600 rounded text-[9px] font-bold text-white z-10">RESERVADO</div>
                                        )}
                                        {v.commercial_status === 'vendido' && (
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
                                        <button 
                                            disabled={!v.isProprio}
                                            onClick={() => handleAction(v, 'EDIT')} 
                                            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : 'text-slate-500 hover:text-blue-400'}`}
                                        >
                                            <Pencil size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Editar</span>
                                        </button>
                                        
                                        {isExpired ? (
                                            <button 
                                                disabled={!v.isProprio}
                                                onClick={() => handleAction(v, 'RENEW')} 
                                                className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : 'text-blue-500 bg-blue-500/5'}`}
                                            >
                                                <RefreshCcw size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Renovar</span>
                                            </button>
                                        ) : (
                                            <>
                                                {v.inventory_status === 'pausado' ? (
                                                    <button 
                                                        disabled={!v.isProprio}
                                                        onClick={() => handleAction(v, 'ACTIVATE')} 
                                                        className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : 'text-green-500 bg-green-500/5'}`}
                                                    >
                                                        <Play size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Activar</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        disabled={!v.isProprio}
                                                        onClick={() => handleAction(v, 'PAUSE')} 
                                                        className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : 'text-slate-500 hover:text-yellow-500'}`}
                                                    >
                                                        <PauseCircle size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Pausar</span>
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        <button 
                                            disabled={!v.isProprio}
                                            onClick={() => handleAction(v, v.commercial_status === 'reservado' ? 'SET_AVAILABLE' : 'RESERVE')} 
                                            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : (v.commercial_status === 'reservado' ? 'text-orange-500 bg-orange-500/5' : 'text-slate-500 hover:text-orange-500')}`}
                                        >
                                            <DollarSign size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">{v.commercial_status === 'reservado' ? 'Quitar Res.' : 'Reservar'}</span>
                                        </button>

                                        <button 
                                            disabled={!v.isProprio}
                                            onClick={() => handleAction(v, v.commercial_status === 'vendido' ? 'SET_AVAILABLE' : 'SELL')} 
                                            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${!v.isProprio ? 'opacity-20 grayscale cursor-not-allowed' : (v.commercial_status === 'vendido' ? 'text-green-500 bg-green-500/5' : 'text-slate-500 hover:text-[#22c55e]')}`}
                                        >
                                            <Check size={13}/><span className="text-[7px] font-black uppercase tracking-tighter">Vendido</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleAction(v, 'DELETE')} 
                                            className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-slate-600 hover:text-red-500"
                                        >
                                            {v.isProprio ? <Trash2 size={13}/> : <LogOut size={13}/>}
                                            <span className="text-[7px] font-black uppercase tracking-tighter">{v.isProprio ? 'Borrar' : 'Quitar'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
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
                                {filtered.map((v) => {
                                    const isExpired = v.expires_at && new Date(v.expires_at) < new Date();
                                    const isProcessing = processingId === v.id;
                                    return (
                                        <tr key={v.id} onClick={() => !isProcessing && setSelectedAuto(v)} className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <td className="p-4 font-black text-white uppercase tracking-tight flex items-center gap-2 text-left">
                                                {isProcessing ? <Loader2 size={12} className="animate-spin text-[#22c55e]" /> : null}
                                                {v.brand} {v.model}
                                                {!v.isProprio && (
                                                    <span className="text-[7px] bg-[#2596be]/20 text-[#2596be] px-1.5 py-0.5 rounded border border-[#2596be]/30 flex items-center gap-1">
                                                        <Zap size={7} fill="currentColor"/> FLIP
                                                    </span>
                                                )}
                                                {v.isProprio && isExpired && <span className="text-[8px] bg-red-600 px-1 rounded text-white">VENCIDA</span>}
                                            </td>
                                            <td className="p-4 text-right font-mono opacity-50 text-[10px] uppercase">
                                                {v.isProprio ? 'MÍO' : 'TERCERO'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-black text-[#22c55e] text-sm" suppressHydrationWarning>
                                                {v.prices.currency}{isMounted ? v.prices.salePrice.toLocaleString('es-AR') : '--'}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                                    {isExpired ? (
                                                        <button 
                                                            disabled={!v.isProprio}
                                                            onClick={() => handleAction(v, 'RENEW')} 
                                                            className={`text-blue-500 ${!v.isProprio ? 'opacity-0 pointer-events-none' : ''}`}
                                                        >
                                                            <RefreshCcw size={14}/>
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {v.inventory_status === 'pausado' ? (
                                                                <button 
                                                                    disabled={!v.isProprio}
                                                                    onClick={() => handleAction(v, 'ACTIVATE')} 
                                                                    className={`text-green-500 ${!v.isProprio ? 'opacity-0 pointer-events-none' : ''}`}
                                                                >
                                                                    <Play size={14}/>
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    disabled={!v.isProprio}
                                                                    onClick={() => handleAction(v, 'PAUSE')} 
                                                                    className={`text-yellow-500 ${!v.isProprio ? 'opacity-0 pointer-events-none' : ''}`}
                                                                >
                                                                    <PauseCircle size={14}/>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    <button 
                                                        disabled={!v.isProprio}
                                                        onClick={() => handleAction(v, v.commercial_status === 'reservado' ? 'SET_AVAILABLE' : 'RESERVE')} 
                                                        className={`${v.commercial_status === 'reservado' ? 'text-orange-500' : 'hover:text-orange-400'} ${!v.isProprio ? 'opacity-0 pointer-events-none' : ''}`}
                                                    >
                                                        <DollarSign size={14}/>
                                                    </button>
                                                    <button 
                                                        disabled={!v.isProprio}
                                                        onClick={() => handleAction(v, v.commercial_status === 'vendido' ? 'SET_AVAILABLE' : 'SELL')} 
                                                        className={`${v.commercial_status === 'vendido' ? 'text-green-500' : 'hover:text-[#22c55e]'} ${!v.isProprio ? 'opacity-0 pointer-events-none' : ''}`}
                                                    >
                                                        <Check size={14}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(v, 'DELETE')} 
                                                        className="hover:text-red-500"
                                                    >
                                                        {v.isProprio ? <Trash2 size={14}/> : <LogOut size={14}/>}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAuto && (() => {
                const isExpired = selectedAuto.expires_at && new Date(selectedAuto.expires_at) < new Date();
                const isProcessingModal = processingId === selectedAuto.id;
                return (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-[#f3f4f6] w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden text-slate-800">
                            <div className="bg-[#111827] p-5 flex justify-between items-center text-white text-left">
                                <span className="font-black italic tracking-tighter text-xl uppercase">Hot<span className="text-[#22c55e]">Cars</span> ADMIN</span>
                                <button onClick={() => setSelectedAuto(null)}><X size={24}/></button>
                            </div>

                            <div className={`p-4 space-y-2 bg-white text-left ${isProcessingModal ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <button onClick={() => setOpenSection(openSection === 'unidad' ? null : 'unidad')} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información de la Unidad</span>
                                        {openSection === 'unidad' ? <ChevronDown size={18} className="text-[#22c55e]"/> : <ChevronRight size={18}/>}
                                    </button>
                                    {openSection === 'unidad' && (
                                        <div className="p-4 grid grid-cols-2 gap-y-3 border-t border-slate-100 animate-in slide-in-from-top duration-200">
                                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Marca</span><span className="text-xs font-black uppercase">{selectedAuto.brand}</span></div>
                                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Modelo</span><span className="text-xs font-black uppercase">{selectedAuto.model}</span></div>
                                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Estado Inv.</span><span className="text-xs font-black uppercase text-[#00984a]">{isExpired ? 'VENCIDA' : selectedAuto.inventory_status}</span></div>
                                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Relación</span><span className="text-xs font-black uppercase text-orange-600">{selectedAuto.isProprio ? 'PROPIO (MÍO)' : 'TERCERO (FLIP)'}</span></div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4">
                                    <button 
                                        disabled={!selectedAuto.isProprio}
                                        className={`bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${!selectedAuto.isProprio ? 'opacity-20 grayscale' : ''}`}
                                    >
                                        <Pencil size={14}/> Editar
                                    </button>
                                    
                                    {isExpired ? (
                                        <button 
                                            disabled={!selectedAuto.isProprio}
                                            onClick={() => handleAction(selectedAuto, 'RENEW')} 
                                            className={`bg-blue-600 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg ${!selectedAuto.isProprio ? 'opacity-20 grayscale' : ''}`}
                                        >
                                            {isProcessingModal ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14}/>} Renovar
                                        </button>
                                    ) : (
                                        <>
                                            {selectedAuto.inventory_status === 'pausado' ? (
                                                <button 
                                                    disabled={!selectedAuto.isProprio}
                                                    onClick={() => handleAction(selectedAuto, 'ACTIVATE')} 
                                                    className={`bg-green-600 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg ${!selectedAuto.isProprio ? 'opacity-20 grayscale' : ''}`}
                                                >
                                                    {isProcessingModal ? <Loader2 className="animate-spin" size={14} /> : <Play size={14}/>} Activar
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled={!selectedAuto.isProprio}
                                                    onClick={() => handleAction(selectedAuto, 'PAUSE')} 
                                                    className={`bg-yellow-500 text-white py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg ${!selectedAuto.isProprio ? 'opacity-20 grayscale' : ''}`}
                                                >
                                                    {isProcessingModal ? <Loader2 className="animate-spin" size={14} /> : <PauseCircle size={14}/>} Pausar
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <button 
                                        disabled={!selectedAuto.isProprio}
                                        onClick={() => handleAction(selectedAuto, selectedAuto.commercial_status === 'reservado' ? 'SET_AVAILABLE' : 'RESERVE')} 
                                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase border flex items-center justify-center gap-2 transition-all ${!selectedAuto.isProprio ? 'opacity-20 grayscale' : (selectedAuto.commercial_status === 'reservado' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}`}
                                    >
                                        <DollarSign size={14}/> {selectedAuto.commercial_status === 'reservado' ? 'Quitar Res.' : 'Reservar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}