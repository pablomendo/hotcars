'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ImageIcon, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function FlipsCompartidosPage() {
    const [receivedFlips, setReceivedFlips] = useState<any[]>([]);
    const [sentFlips, setSentFlips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [receivedPage, setReceivedPage] = useState(1);
    const [sentPage, setSentPage] = useState(1);
    const [confirmCancel, setConfirmCancel] = useState<any>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

    useEffect(() => {
        const initialize = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('plan_type')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                if (profile) setUserPlan((profile.plan_type || 'free').toLowerCase());
                fetchFlips(user.id);
            }
        };
        initialize();
    }, []);

    const fetchFlips = async (uId: string) => {
        setIsLoading(true);
        try {
            const { data: allFlips, error } = await supabase
                .from('flip_compartido')
                .select(`
                    *,
                    inventario:auto_id (
                        id, marca, modelo, version, anio, km, fotos,
                        owner_user_id, moneda, pv, pc, ganancia_dueno, ganancia_flipper,
                        provincia, localidad
                    )
                `);

            if (error) throw error;

            if (allFlips) {
                const received = allFlips.filter(f => f.inventario?.owner_user_id === uId);
                const sent = allFlips.filter(f => f.vendedor_user_id === uId);

                const allIds = new Set<string>();
                allFlips.forEach(f => {
                    if (f.vendedor_user_id) allIds.add(f.vendedor_user_id);
                    if (f.inventario?.owner_user_id) allIds.add(f.inventario.owner_user_id);
                });

                const idsArray = Array.from(allIds);
                if (idsArray.length > 0) {
                    const { data: usuarios } = await supabase
                        .from('usuarios')
                        .select('auth_id, nombre')
                        .in('auth_id', idsArray);
                    if (usuarios) {
                        const namesMap: Record<string, string> = {};
                        usuarios.forEach((u: any) => { namesMap[u.auth_id] = u.nombre || u.auth_id.slice(0, 8) + '...'; });
                        setUserNames(namesMap);
                    }
                }

                setReceivedFlips(received);
                setSentFlips(sent);
                setReceivedPage(1);
                setSentPage(1);
            }
        } catch (error) {
            console.error("Error HotCars:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (flipId: string, newStatus: 'approved' | 'rejected') => {
        setProcessingId(flipId);
        try {
            const { error } = await supabase.from('flip_compartido').update({ status: newStatus }).eq('id', flipId);
            if (error) throw error;
            if (userId) fetchFlips(userId);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const executeCancelFlip = async () => {
        if (!confirmCancel) return;
        const flipId = confirmCancel.id;
        setConfirmCancel(null);
        setProcessingId(flipId);
        try {
            const { error } = await supabase.from('flip_compartido').delete().eq('id', flipId);
            if (error) throw error;
            if (userId) fetchFlips(userId);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="px-2.5 py-0.5 bg-[#22c55e] text-white rounded-full text-[10px] font-black uppercase tracking-wide">Aceptada</span>;
            case 'rejected': return <span className="px-2.5 py-0.5 bg-[#ef4444] text-white rounded-full text-[10px] font-black uppercase tracking-wide">Rechazada</span>;
            default:         return <span className="px-2.5 py-0.5 bg-[#f59e0b] text-white rounded-full text-[10px] font-black uppercase tracking-wide">Pendiente</span>;
        }
    };

    const formatCurrency = (val: any, moneda: string) => {
        const num = Number(val) || 0;
        return (moneda === 'USD' ? 'USD ' : '$ ') + num.toLocaleString('es-AR');
    };

    const paginate = (arr: any[], page: number) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = (arr: any[]) => Math.ceil(arr.length / PAGE_SIZE);

    const Pagination = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => {
        if (total <= 1) return null;
        return (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all">
                    <ChevronLeft size={14}/> Anterior
                </button>
                <span className="text-[11px] font-bold text-slate-400">{page} / {total}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === total} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all">
                    Siguiente <ChevronRight size={14}/>
                </button>
            </div>
        );
    };

    // Card mobile para cada flip
    const FlipCard = ({ flip, tipo }: { flip: any; tipo: 'recibida' | 'enviada' }) => {
        const inv = flip.inventario;
        const contactName = tipo === 'recibida'
            ? (userNames[flip.vendedor_user_id] || flip.vendedor_user_id?.slice(0, 8) + '...')
            : (userNames[inv?.owner_user_id] || inv?.owner_user_id?.slice(0, 8) + '...');
        const contactLabel = tipo === 'recibida' ? 'Vendedor' : 'Dueño';
        const isProcessing = processingId === flip.id;

        return (
            <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <button onClick={() => setSelectedVehicle({ flip, tipo })} className="w-full text-left">
                    <div className="flex gap-3 p-3">
                        <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            {inv?.fotos?.[0]
                                ? <img src={inv.fotos[0]} alt="" className="w-full h-full object-cover"/>
                                : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={16}/></div>
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black uppercase text-slate-800 truncate leading-tight">{inv?.marca} {inv?.modelo}</p>
                            {inv?.version && <p className="text-[10px] text-slate-400 truncate">{inv.version}</p>}
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(flip.status)}
                                <span className="text-[10px] text-slate-400">{new Date(flip.created_at).toLocaleDateString('es-AR')}</span>
                            </div>
                        </div>
                    </div>
                </button>

                <div className="flex items-center justify-between px-3 pb-3 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex-shrink-0">{contactLabel}:</span>
                        <span className="text-[11px] font-bold text-slate-600 truncate">{contactName}</span>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        {tipo === 'recibida' && flip.status === 'pending' && (
                            <>
                                <button onClick={() => handleUpdateStatus(flip.id, 'approved')} className="bg-[#22c55e] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Aceptar</button>
                                <button onClick={() => handleUpdateStatus(flip.id, 'rejected')} className="bg-[#ef4444] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Rechazar</button>
                            </>
                        )}
                        {tipo === 'recibida' && flip.status === 'approved' && userPlan !== 'free' && (
                            <button onClick={() => setConfirmCancel({ id: flip.id, marca: inv?.marca, modelo: inv?.modelo, tipo: 'recibida' })} className="border border-[#ef4444] text-[#ef4444] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Cancelar</button>
                        )}
                        {tipo === 'enviada' && (
                            <button onClick={() => setConfirmCancel({ id: flip.id, marca: inv?.marca, modelo: inv?.modelo, tipo: 'enviada' })} className="border border-[#ef4444] text-[#ef4444] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Cancelar</button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-[#22c55e]" /></div>;

    const receivedPaged = paginate(receivedFlips, receivedPage);
    const sentPaged = paginate(sentFlips, sentPage);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-28 pt-28 font-sans text-slate-800 text-left">

            {/* Modal detalle vehículo */}
            {selectedVehicle && (() => {
                const inv = selectedVehicle.flip.inventario;
                const esDueno = selectedVehicle.tipo === 'recibida';
                const ganancia = esDueno ? Number(inv?.ganancia_dueno) || 0 : Number(inv?.ganancia_flipper) || 0;
                return (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="relative w-full aspect-[16/9] bg-slate-100">
                                {inv?.fotos?.[0]
                                    ? <img src={inv.fotos[0]} alt="" className="w-full h-full object-cover"/>
                                    : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={32}/></div>
                                }
                                <button onClick={() => setSelectedVehicle(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all">
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="p-5">
                                <h3 className="text-base font-black uppercase text-[#1e293b] leading-tight">{inv?.marca} {inv?.modelo}</h3>
                                {inv?.version && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{inv.version}</p>}
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {inv?.anio}{inv?.km ? ` • ${Number(inv.km).toLocaleString('es-AR')} km` : ''}{inv?.provincia ? ` • ${inv.provincia}` : ''}
                                </p>
                                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Precio venta</span>
                                        <span className="text-sm font-black text-[#22c55e]">{formatCurrency(inv?.pv, inv?.moneda)}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Precio compra</span>
                                        <span className="text-xs font-bold text-slate-600">{formatCurrency(inv?.pc, inv?.moneda)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{esDueno ? 'Tu ganancia (dueño)' : 'Tu ganancia (flipper)'}</span>
                                        <span className="text-sm font-black text-[#1e293b]">{formatCurrency(ganancia, inv?.moneda)}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedVehicle(null)} className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Cerrar</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal confirmar cancelación */}
            {confirmCancel && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-100">
                            <LogOut size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-black uppercase text-[#1e293b] mb-3">{confirmCancel.tipo === 'recibida' ? 'Cancelar Flip' : 'Cancelar Solicitud'}</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-2 font-medium text-center">{confirmCancel.tipo === 'recibida' ? 'Estás por cancelar el flip activo de' : 'Estás por cancelar tu solicitud para'}</p>
                        <p className="text-[#1e293b] text-[14px] font-black uppercase mb-8">{confirmCancel.marca} {confirmCancel.modelo}</p>
                        <button onClick={executeCancelFlip} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-700 transition-all active:scale-95 mb-3">Sí, cancelar</button>
                        <button onClick={() => setConfirmCancel(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all active:scale-95">Volver</button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-12">

                {/* SOLICITUDES RECIBIDAS */}
                <section>
                    <h2 className="text-xl font-bold text-[#334155] mb-1">Solicitudes Recibidas</h2>
                    <p className="text-sm text-slate-400 italic mb-4">
                        Solicitudes de otros usuarios para vender tus vehículos
                        {receivedFlips.length > 0 && <span className="ml-2 text-slate-500 not-italic font-bold">({receivedFlips.length})</span>}
                    </p>

                    {/* Mobile: cards */}
                    <div className="flex flex-col gap-3 lg:hidden">
                        {receivedPaged.length === 0
                            ? <p className="text-center text-slate-400 font-medium py-8">No tienes solicitudes recibidas</p>
                            : receivedPaged.map(flip => <FlipCard key={flip.id} flip={flip} tipo="recibida" />)
                        }
                        <Pagination page={receivedPage} setPage={setReceivedPage} total={totalPages(receivedFlips)} />
                    </div>

                    {/* Desktop: tabla */}
                    <div className="hidden lg:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f1f5f9] border-b border-slate-200 text-[#64748b] text-[12px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 w-[40%]">Vehículo</th>
                                    <th className="px-6 py-3 w-[18%]">Vendedor</th>
                                    <th className="px-6 py-3 w-[12%]">Fecha</th>
                                    <th className="px-6 py-3 w-[12%] text-center">Estado</th>
                                    <th className="px-6 py-3 w-[18%] text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {receivedPaged.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No tienes solicitudes recibidas</td></tr>
                                ) : receivedPaged.map((flip) => (
                                    <tr key={flip.id} className={`text-sm hover:bg-slate-50 transition-colors ${processingId === flip.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <td className="px-6 py-2">
                                            <button onClick={() => setSelectedVehicle({ flip, tipo: 'recibida' })} className="flex items-center gap-4 group cursor-pointer text-left">
                                                <div className="w-12 h-9 bg-slate-100 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                    {flip.inventario?.fotos?.[0]
                                                        ? <img src={flip.inventario.fotos[0]} alt="" className="w-full h-full object-cover"/>
                                                        : <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400"><ImageIcon size={14}/></div>
                                                    }
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-[#22c55e] transition-colors uppercase">{flip.inventario?.marca} {flip.inventario?.modelo}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-2 text-slate-600 font-medium text-[13px]">{userNames[flip.vendedor_user_id] || flip.vendedor_user_id?.slice(0, 8) + '...'}</td>
                                        <td className="px-6 py-2 text-slate-500 font-medium whitespace-nowrap">{new Date(flip.created_at).toLocaleDateString('es-AR')}</td>
                                        <td className="px-6 py-2 text-center">{getStatusBadge(flip.status)}</td>
                                        <td className="px-6 py-2 text-right">
                                            {flip.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateStatus(flip.id, 'approved')} className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-1.5 rounded text-xs font-bold transition-all active:scale-95">Aceptar</button>
                                                    <button onClick={() => handleUpdateStatus(flip.id, 'rejected')} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-1.5 rounded text-xs font-bold transition-all active:scale-95">Rechazar</button>
                                                </div>
                                            )}
                                            {flip.status === 'approved' && userPlan !== 'free' && (
                                                <button onClick={() => setConfirmCancel({ id: flip.id, marca: flip.inventario?.marca, modelo: flip.inventario?.modelo, tipo: 'recibida' })} className="border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Cancelar Flip</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination page={receivedPage} setPage={setReceivedPage} total={totalPages(receivedFlips)} />
                    </div>
                </section>

                {/* SOLICITUDES ENVIADAS */}
                <section>
                    <h2 className="text-xl font-bold text-[#334155] mb-1">Solicitudes Enviadas</h2>
                    <p className="text-sm text-slate-400 italic mb-4">
                        Solicitudes que has enviado para vender vehículos ajenos
                        {sentFlips.length > 0 && <span className="ml-2 text-slate-500 not-italic font-bold">({sentFlips.length})</span>}
                    </p>

                    {/* Mobile: cards */}
                    <div className="flex flex-col gap-3 lg:hidden">
                        {sentPaged.length === 0
                            ? <p className="text-center text-slate-400 font-medium py-8">No has enviado solicitudes aún</p>
                            : sentPaged.map(flip => <FlipCard key={flip.id} flip={flip} tipo="enviada" />)
                        }
                        <Pagination page={sentPage} setPage={setSentPage} total={totalPages(sentFlips)} />
                    </div>

                    {/* Desktop: tabla */}
                    <div className="hidden lg:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f1f5f9] border-b border-slate-200 text-[#64748b] text-[12px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 w-[40%]">Vehículo</th>
                                    <th className="px-6 py-3 w-[18%]">Dueño</th>
                                    <th className="px-6 py-3 w-[12%]">Fecha</th>
                                    <th className="px-6 py-3 w-[12%] text-center">Estado</th>
                                    <th className="px-6 py-3 w-[18%] text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sentPaged.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No has enviado solicitudes aún</td></tr>
                                ) : sentPaged.map((flip) => (
                                    <tr key={flip.id} className={`text-sm hover:bg-slate-50 transition-colors ${processingId === flip.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <td className="px-6 py-2">
                                            <button onClick={() => setSelectedVehicle({ flip, tipo: 'enviada' })} className="flex items-center gap-4 group cursor-pointer text-left">
                                                <div className="w-12 h-9 bg-slate-100 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                    {flip.inventario?.fotos?.[0]
                                                        ? <img src={flip.inventario.fotos[0]} alt="" className="w-full h-full object-cover"/>
                                                        : <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400"><ImageIcon size={14}/></div>
                                                    }
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-[#22c55e] transition-colors uppercase">{flip.inventario?.marca} {flip.inventario?.modelo}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-2 text-slate-600 font-medium text-[13px]">{userNames[flip.inventario?.owner_user_id] || flip.inventario?.owner_user_id?.slice(0, 8) + '...'}</td>
                                        <td className="px-6 py-2 text-slate-500 font-medium whitespace-nowrap">{new Date(flip.created_at).toLocaleDateString('es-AR')}</td>
                                        <td className="px-6 py-2 text-center">{getStatusBadge(flip.status)}</td>
                                        <td className="px-6 py-2 text-right">
                                            <button onClick={() => setConfirmCancel({ id: flip.id, marca: flip.inventario?.marca, modelo: flip.inventario?.modelo, tipo: 'enviada' })} className="border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Cancelar Solicitud</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination page={sentPage} setPage={setSentPage} total={totalPages(sentFlips)} />
                    </div>
                </section>
            </div>
        </div>
    );
}