'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function FlipsCompartidosPage() {
    const [receivedFlips, setReceivedFlips] = useState<any[]>([]);
    const [sentFlips, setSentFlips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialize = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
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
                        id, marca, modelo, anio, owner_user_id, fotos
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
                        usuarios.forEach((u: any) => {
                            namesMap[u.auth_id] = u.nombre || u.auth_id.slice(0, 8) + '...';
                        });
                        setUserNames(namesMap);
                    }
                }

                setReceivedFlips(received);
                setSentFlips(sent);
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
            const { error } = await supabase
                .from('flip_compartido')
                .update({ status: newStatus })
                .eq('id', flipId);

            if (error) throw error;
            if (userId) fetchFlips(userId);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelFlip = async (flipId: string) => {
        if (!confirm("¿Seguro que quieres cancelar esta solicitud?")) return;
        setProcessingId(flipId);
        try {
            const { error } = await supabase
                .from('flip_compartido')
                .delete()
                .eq('id', flipId);

            if (error) throw error;
            if (userId) fetchFlips(userId);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return <span className="px-4 py-1 bg-[#22c55e] text-white rounded-full text-[11px] font-bold">Aceptada</span>;
            case 'rejected': return <span className="px-4 py-1 bg-[#ef4444] text-white rounded-full text-[11px] font-bold">Rechazada</span>;
            default: return <span className="px-4 py-1 bg-[#f59e0b] text-white rounded-full text-[11px] font-bold">Pendiente</span>;
        }
    };

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-[#22c55e]" /></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20 pt-24 font-sans text-slate-800 text-left">
            <div className="max-w-6xl mx-auto px-6 space-y-12">
                
                {/* SOLICITUDES RECIBIDAS */}
                <section>
                    <h2 className="text-xl font-bold text-[#334155] mb-1">Solicitudes Recibidas</h2>
                    <p className="text-sm text-slate-400 italic mb-4">Solicitudes de otros usuarios para vender tus vehículos</p>
                    
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm text-left">
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
                                {receivedFlips.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No tienes solicitudes recibidas</td></tr>
                                ) : receivedFlips.map((flip) => (
                                    <tr key={flip.id} className="text-sm hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-2">
                                            <Link href={`/inventario/${flip.inventario?.id}`} target="_blank" className="flex items-center gap-4 group cursor-pointer">
                                                <div className="w-12 h-9 bg-slate-100 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                    {flip.inventario?.fotos?.[0] ? (
                                                        <img src={flip.inventario.fotos[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400"><ImageIcon size={14}/></div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-[#22c55e] transition-colors uppercase">
                                                    {flip.inventario?.marca} {flip.inventario?.modelo}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-2 text-slate-600 font-medium text-[13px]">
                                            {userNames[flip.vendedor_user_id] || flip.vendedor_user_id?.slice(0, 8) + '...'}
                                        </td>
                                        <td className="px-6 py-2 text-slate-500 font-medium whitespace-nowrap">{new Date(flip.created_at).toLocaleDateString('es-AR')}</td>
                                        <td className="px-6 py-2 text-center">{getStatusLabel(flip.status)}</td>
                                        <td className="px-6 py-2 text-right">
                                            {flip.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateStatus(flip.id, 'approved')} className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap">Aceptar</button>
                                                    <button onClick={() => handleUpdateStatus(flip.id, 'rejected')} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap">Rechazar</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* SOLICITUDES ENVIADAS */}
                <section>
                    <h2 className="text-xl font-bold text-[#334155] mb-1">Solicitudes Enviadas</h2>
                    <p className="text-sm text-slate-400 italic mb-4">Solicitudes que has enviado para vender vehículos ajenos</p>
                    
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm text-left">
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
                                {sentFlips.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No has enviado solicitudes aún</td></tr>
                                ) : sentFlips.map((flip) => (
                                    <tr key={flip.id} className="text-sm hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-2">
                                            <Link href={`/inventario/${flip.inventario?.id}`} target="_blank" className="flex items-center gap-4 group cursor-pointer">
                                                <div className="w-12 h-9 bg-slate-100 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                    {flip.inventario?.fotos?.[0] ? (
                                                        <img src={flip.inventario.fotos[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400"><ImageIcon size={14}/></div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-[#22c55e] transition-colors uppercase">
                                                    {flip.inventario?.marca} {flip.inventario?.modelo}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-2 text-slate-600 font-medium text-[13px]">
                                            {userNames[flip.inventario?.owner_user_id] || flip.inventario?.owner_user_id?.slice(0, 8) + '...'}
                                        </td>
                                        <td className="px-6 py-2 text-slate-500 font-medium whitespace-nowrap">{new Date(flip.created_at).toLocaleDateString('es-AR')}</td>
                                        <td className="px-6 py-2 text-center">{getStatusLabel(flip.status)}</td>
                                        <td className="px-6 py-2 text-right">
                                            <button 
                                                onClick={() => handleCancelFlip(flip.id)}
                                                className="border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-block"
                                            >
                                                Cancelar Solicitud
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}