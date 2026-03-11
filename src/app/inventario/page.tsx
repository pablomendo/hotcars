'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import hiddenData from '@/lib/tsconfig.sys.json';
import { 
  Search, Loader2, Trash2, PauseCircle, Play, Check, Pencil, LayoutGrid, List, X, ChevronDown, ChevronRight, DollarSign, AlertTriangle, RefreshCcw, LogOut, Zap, AlertCircle, User, Save, Send
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
    const [userName, setUserName] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('Free'); 

    const [selectedAuto, setSelectedAuto] = useState<any>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // --- modales confirm personalizados ---
    const [confirmDeletePropio, setConfirmDeletePropio] = useState<any>(null);
    const [confirmDeleteFlip, setConfirmDeleteFlip] = useState<any>(null);
    // --------------------------------------

    // --- mensaje al dueño (flip terceros) ---
    const [flipMessage, setFlipMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    // ----------------------------------------

    const clienteOriginalRef = useRef<any>(null);
    const consignatarioOriginalRef = useRef<any>(null);

    // --- estado cliente_comprador ---
    const [clienteData, setClienteData] = useState<any>({
        nombre: '',
        dni: '',
        contacto: '',
        forma_pago: '',
        senia_reserva: '',
        moneda_senia: 'ARS',
        fecha_vencimiento: '',
        notas: ''
    });
    const [isSavingCliente, setIsSavingCliente] = useState(false);
    const [clienteSaved, setClienteSaved] = useState(false);
    // --------------------------------

    // --- estado cliente_consignatario ---
    const [consignatarioData, setConsignatarioData] = useState<any>({
        nombre: '',
        dni: '',
        telefono: '',
        comision_porcentaje: '',
        precio_minimo: '',
        moneda: 'ARS',
        vigencia_hasta: '',
        notas: ''
    });
    const [isSavingConsignatario, setIsSavingConsignatario] = useState(false);
    const [consignatarioSaved, setConsignatarioSaved] = useState(false);
    // ------------------------------------

    const hasUnsavedChanges = () => {
        const clienteChanged = clienteOriginalRef.current &&
            JSON.stringify(clienteData) !== JSON.stringify(clienteOriginalRef.current);
        const consignatarioChanged = consignatarioOriginalRef.current &&
            JSON.stringify(consignatarioData) !== JSON.stringify(consignatarioOriginalRef.current);
        return clienteChanged || consignatarioChanged;
    };

    const handleRequestClose = () => {
        if (hasUnsavedChanges()) {
            setShowCloseConfirm(true);
        } else {
            setSelectedAuto(null);
        }
    };

    const handleForceClose = () => {
        setShowCloseConfirm(false);
        setSelectedAuto(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedAuto) {
                e.preventDefault();
                handleRequestClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAuto, clienteData, consignatarioData]);

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
                        .select('plan_type, nombre')
                        .eq('auth_id', user.id)
                        .maybeSingle();

                    if (profile) {
                        setUserPlan(profile.plan_type || 'Free');
                        setUserName(profile.nombre || null);
                    }
                    
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
    }, []);

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

    const fetchClienteData = async (autoId: string) => {
        try {
            const { data } = await supabase
                .from('cliente_comprador')
                .select('nombre, dni, contacto, forma_pago, senia_reserva, moneda_senia, fecha_vencimiento, notas')
                .eq('auto_id', autoId)
                .maybeSingle();

            const loaded = data ? {
                nombre: data.nombre || '',
                dni: data.dni || '',
                contacto: data.contacto || '',
                forma_pago: data.forma_pago || '',
                senia_reserva: data.senia_reserva || '',
                moneda_senia: data.moneda_senia || 'ARS',
                fecha_vencimiento: data.fecha_vencimiento || '',
                notas: data.notas || ''
            } : { nombre: '', dni: '', contacto: '', forma_pago: '', senia_reserva: '', moneda_senia: 'ARS', fecha_vencimiento: '', notas: '' };

            setClienteData(loaded);
            clienteOriginalRef.current = loaded;
        } catch (err: any) {
            console.error("Error cargando cliente_comprador:", err.message);
        }
    };

    const fetchConsignatarioData = async (autoId: string) => {
        try {
            const { data } = await supabase
                .from('cliente_consignatario')
                .select('nombre, dni, telefono, comision_porcentaje, precio_minimo, moneda, vigencia_hasta, notas')
                .eq('auto_id', autoId)
                .maybeSingle();

            const loaded = data ? {
                nombre: data.nombre || '',
                dni: data.dni || '',
                telefono: data.telefono || '',
                comision_porcentaje: data.comision_porcentaje || '',
                precio_minimo: data.precio_minimo || '',
                moneda: data.moneda || 'ARS',
                vigencia_hasta: data.vigencia_hasta || '',
                notas: data.notas || ''
            } : { nombre: '', dni: '', telefono: '', comision_porcentaje: '', precio_minimo: '', moneda: 'ARS', vigencia_hasta: '', notas: '' };

            setConsignatarioData(loaded);
            consignatarioOriginalRef.current = loaded;
        } catch (err: any) {
            console.error("Error cargando cliente_consignatario:", err.message);
        }
    };

    const handleSaveCliente = async () => {
        if (!selectedAuto?.id) return;
        setIsSavingCliente(true);
        try {
            const { error } = await supabase
                .from('cliente_comprador')
                .upsert({
                    auto_id: selectedAuto.id,
                    nombre: clienteData.nombre,
                    dni: clienteData.dni,
                    contacto: clienteData.contacto,
                    forma_pago: clienteData.forma_pago,
                    senia_reserva: clienteData.senia_reserva ? Number(clienteData.senia_reserva) : null,
                    moneda_senia: clienteData.moneda_senia,
                    fecha_vencimiento: clienteData.fecha_vencimiento || null,
                    notas: clienteData.notas
                }, { onConflict: 'auto_id' });

            if (error) throw error;
            clienteOriginalRef.current = { ...clienteData };
            setClienteSaved(true);
            setTimeout(() => setClienteSaved(false), 2500);
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSavingCliente(false);
        }
    };

    const handleSaveConsignatario = async () => {
        if (!selectedAuto?.id) return;
        setIsSavingConsignatario(true);
        try {
            const { error } = await supabase
                .from('cliente_consignatario')
                .upsert({
                    auto_id: selectedAuto.id,
                    nombre: consignatarioData.nombre,
                    dni: consignatarioData.dni,
                    telefono: consignatarioData.telefono,
                    comision_porcentaje: consignatarioData.comision_porcentaje ? Number(consignatarioData.comision_porcentaje) : null,
                    precio_minimo: consignatarioData.precio_minimo ? Number(consignatarioData.precio_minimo) : null,
                    moneda: consignatarioData.moneda,
                    vigencia_hasta: consignatarioData.vigencia_hasta || null,
                    notas: consignatarioData.notas
                }, { onConflict: 'auto_id' });

            if (error) throw error;
            consignatarioOriginalRef.current = { ...consignatarioData };
            setConsignatarioSaved(true);
            setTimeout(() => setConsignatarioSaved(false), 2500);
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSavingConsignatario(false);
        }
    };

    // NUEVO: enviar mensaje al dueño del flip
    const handleSendFlipMessage = async () => {
        if (!flipMessage.trim() || !selectedAuto || !userId) return;
        setIsSendingMessage(true);
        try {
            const { error: msgError } = await supabase.from('messages').insert({
                sender_user_id: userId,
                receiver_user_id: selectedAuto.owner_user_id,
                sender_name: userName,
                content: flipMessage.trim(),
                related_auto_id: selectedAuto.id,
                type: 'flip'
            });
            if (msgError) throw msgError;

            await supabase.from('notifications').insert({
                user_id: selectedAuto.owner_user_id,
                type: 'mensaje_flip',
                category: 'message',
                title: 'Nuevo mensaje sobre un Flip',
                body: `Tenés un mensaje sobre tu ${selectedAuto.brand} ${selectedAuto.model}.`,
                related_entity_type: 'inventario',
                related_entity_id: selectedAuto.id,
                action_url: '/mensajes'
            });

            setMessageSent(true);
            setFlipMessage('');
            setTimeout(() => setMessageSent(false), 3000);
        } catch (err: any) {
            alert("Error al enviar: " + err.message);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleOpenModal = (v: any) => {
        setSelectedAuto(v);
        setOpenSection(null);
        setClienteSaved(false);
        setConsignatarioSaved(false);
        // NUEVO: reset estados mensaje
        setMessageSent(false);
        setFlipMessage(`Hola, tengo un interesado en tu ${v.brand} ${v.model}. ¿Podemos coordinar una visita?`);
        clienteOriginalRef.current = null;
        consignatarioOriginalRef.current = null;
        if (v.isProprio) {
            fetchClienteData(v.id);
            fetchConsignatarioData(v.id);
        }
    };

    const executeDeletePropio = async (item: any) => {
        const id = item.id;
        setConfirmDeletePropio(null);
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
    };

    const executeDeleteFlip = async (item: any) => {
        const id = item.id;
        setConfirmDeleteFlip(null);
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
    };

    const handleAction = async (item: any, action: string) => {
        const id = item.id;

        if (action === 'EDIT') {
            if (!item.isProprio) return;
            router.push(`/publicar?id=${id}`);
            return;
        }

        if (action === 'DELETE') {
            if (item.isProprio) {
                setConfirmDeletePropio(item);
            } else {
                setConfirmDeleteFlip(item);
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

            {/* Modal límite de plan */}
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

            {/* Modal confirmación cierre con cambios sin guardar */}
            {showCloseConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-6 text-yellow-500 border border-yellow-100">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-black uppercase text-[#1e293b] mb-3">Cambios sin guardar</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-8 font-medium text-center">
                            Tenés cambios que no fueron guardados. ¿Qué querés hacer?
                        </p>
                        <button
                            onClick={handleForceClose}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-700 transition-all active:scale-95 mb-3"
                        >
                            Descartar cambios
                        </button>
                        <button
                            onClick={() => setShowCloseConfirm(false)}
                            className="w-full py-4 bg-[#22c55e] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-[#16a34a] transition-all active:scale-95"
                        >
                            Seguir editando
                        </button>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminar unidad propia */}
            {confirmDeletePropio && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-100">
                            <Trash2 size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-black uppercase text-[#1e293b] mb-3">Eliminar unidad</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-2 font-medium text-center">
                            Estás por eliminar permanentemente
                        </p>
                        <p className="text-[#1e293b] text-[14px] font-black uppercase mb-8">
                            {confirmDeletePropio.brand} {confirmDeletePropio.model}
                        </p>
                        <button
                            onClick={() => executeDeletePropio(confirmDeletePropio)}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-700 transition-all active:scale-95 mb-3"
                        >
                            Sí, eliminar
                        </button>
                        <button
                            onClick={() => setConfirmDeletePropio(null)}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal confirmar quitar flip compartido */}
            {confirmDeleteFlip && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-100">
                            <LogOut size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-black uppercase text-[#1e293b] mb-3">Quitar Flip Compartido</h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-2 font-medium text-center">
                            Esta unidad es un Flip compartido. ¿Deseas quitarla de tu inventario?
                        </p>
                        <p className="text-[#1e293b] text-[14px] font-black uppercase mb-8">
                            {confirmDeleteFlip.brand} {confirmDeleteFlip.model}
                        </p>
                        <button
                            onClick={() => executeDeleteFlip(confirmDeleteFlip)}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-700 transition-all active:scale-95 mb-3"
                        >
                            Sí, quitar
                        </button>
                        <button
                            onClick={() => setConfirmDeleteFlip(null)}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ── SUBHEADER FIJO ── */}
            <div className="fixed top-[82px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 flex flex-col items-center justify-start px-4 py-1 lg:h-20 lg:pt-2">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center gap-2">

                    {/* Chips de tabs */}
                    <div className="grid grid-cols-4 lg:flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/5 w-full lg:w-fit">
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
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${
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

                    {/* Fila inferior: INVENTARIO + plan */}
                    <div className="flex items-center gap-3">
                        <span
                            style={{ fontFamily: 'Genos', fontWeight: 300, letterSpacing: '4px' }}
                            className="text-white text-[13px] lg:text-[15px] uppercase opacity-40"
                        >
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

            {/* ── CONTENIDO ── */}
            {/* FIX: pt aumentado en mobile para compensar subheader de 2 filas */}
            <div className="max-w-[1600px] mx-auto px-6 pt-[225px] pb-20 lg:pt-44">
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
                                <div key={v.id} onClick={() => !isProcessing && handleOpenModal(v)} className={`bg-[#141b1f] border border-white/5 rounded-xl overflow-hidden flex flex-col group transition-all hover:border-white/20 cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
                                        {isProcessing ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                                                <Loader2 className="animate-spin text-[#22c55e]" size={24} />
                                            </div>
                                        ) : null}
                                        {v.images[0] ? (
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
                                        <tr key={v.id} onClick={() => !isProcessing && handleOpenModal(v)} className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
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
                const isProcessingModal = processingId === selectedAuto.id;
                return (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-[#f3f4f6] w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden text-slate-800 max-h-[90vh] overflow-y-auto">

                            {/* Header */}
                            <div className="bg-[#111827] px-5 py-4 flex justify-between items-center sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <img src="/logo_hotcars_blanco.png" alt="HotCars" className="h-6 w-auto object-contain" />
                                    <div className="flex flex-col">
                                        <span className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">
                                            {selectedAuto.brand} {selectedAuto.model}
                                        </span>
                                        <span className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
                                            {selectedAuto.isProprio ? 'Gestión de clientes y señas' : 'Contactar al dueño'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleRequestClose} className="text-white/60 hover:text-white transition-colors">
                                    <X size={22}/>
                                </button>
                            </div>

                            <div className={`p-4 space-y-2 bg-white text-left ${isProcessingModal ? 'opacity-50 pointer-events-none' : ''}`}>

                                {/* NUEVO: Flip de terceros — formulario de mensaje al dueño */}
                                {!selectedAuto.isProprio && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-[#2596be]/10 rounded-xl border border-[#2596be]/20">
                                            <Zap size={16} className="text-[#2596be] flex-shrink-0" fill="currentColor"/>
                                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                                Este auto es un <strong>Flip Compartido</strong>. Podés enviarle un mensaje directo al dueño sobre esta unidad.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Mensaje al dueño</label>
                                            <textarea
                                                value={flipMessage}
                                                onChange={(e) => setFlipMessage(e.target.value)}
                                                rows={4}
                                                placeholder="Escribí tu mensaje..."
                                                className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white resize-none"
                                            />
                                        </div>

                                        {messageSent ? (
                                            <div className="w-full py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                                <Check size={13}/> Mensaje enviado
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleSendFlipMessage}
                                                disabled={isSendingMessage || !flipMessage.trim()}
                                                className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[#22c55e] text-white hover:bg-[#16a34a] disabled:opacity-40 disabled:pointer-events-none"
                                            >
                                                {isSendingMessage ? <Loader2 size={13} className="animate-spin"/> : <><Send size={13}/> Enviar mensaje</>}
                                            </button>
                                        )}

                                        <div className="pt-2">
                                            <button onClick={() => setSelectedAuto(null)} className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-700 transition-all">
                                                <X size={13}/> Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Cliente Consignatario — solo para propios */}
                                {selectedAuto.isProprio && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <button onClick={() => setOpenSection(openSection === 'consignatario' ? null : 'consignatario')} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400"/>
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cliente Consignatario</span>
                                            </div>
                                            {openSection === 'consignatario' ? <ChevronDown size={18} className="text-[#22c55e]"/> : <ChevronRight size={18}/>}
                                        </button>
                                        {openSection === 'consignatario' && (
                                            <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top duration-200 space-y-3">

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nombre</label>
                                                        <input type="text" value={consignatarioData.nombre} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Juan Pérez" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DNI</label>
                                                        <input type="text" value={consignatarioData.dni} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, dni: e.target.value }))} placeholder="Ej: 30123456" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Teléfono</label>
                                                        <input type="text" value={consignatarioData.telefono} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, telefono: e.target.value }))} placeholder="Tel / WhatsApp" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Comisión %</label>
                                                        <input type="number" value={consignatarioData.comision_porcentaje} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, comision_porcentaje: e.target.value }))} placeholder="Ej: 5" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Precio mínimo</label>
                                                        <input type="number" value={consignatarioData.precio_minimo} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, precio_minimo: e.target.value }))} placeholder="0" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Moneda</label>
                                                        <select value={consignatarioData.moneda} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, moneda: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white">
                                                            <option value="ARS">$ ARS</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Vigencia hasta</label>
                                                    <input type="date" value={consignatarioData.vigencia_hasta} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, vigencia_hasta: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Notas</label>
                                                    <textarea value={consignatarioData.notas} onChange={(e) => setConsignatarioData((p: any) => ({ ...p, notas: e.target.value }))} placeholder="Condiciones del acuerdo, observaciones, etc." rows={3} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white resize-none"/>
                                                </div>

                                                <button onClick={handleSaveConsignatario} disabled={isSavingConsignatario} className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[#22c55e] text-white hover:bg-[#16a34a]">
                                                    {isSavingConsignatario ? <Loader2 size={13} className="animate-spin"/> : consignatarioSaved ? <><Check size={13}/> Guardado</> : <><Save size={13}/> Guardar consignatario</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Sección: Comprador / Seña — solo para propios */}
                                {selectedAuto.isProprio && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <button onClick={() => setOpenSection(openSection === 'cliente' ? null : 'cliente')} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400"/>
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Comprador / Seña</span>
                                            </div>
                                            {openSection === 'cliente' ? <ChevronDown size={18} className="text-[#22c55e]"/> : <ChevronRight size={18}/>}
                                        </button>
                                        {openSection === 'cliente' && (
                                            <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top duration-200 space-y-3">

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nombre</label>
                                                        <input type="text" value={clienteData.nombre} onChange={(e) => setClienteData((p: any) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Juan Pérez" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DNI</label>
                                                        <input type="text" value={clienteData.dni} onChange={(e) => setClienteData((p: any) => ({ ...p, dni: e.target.value }))} placeholder="Ej: 30123456" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contacto</label>
                                                        <input type="text" value={clienteData.contacto} onChange={(e) => setClienteData((p: any) => ({ ...p, contacto: e.target.value }))} placeholder="Tel / WhatsApp" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Forma de pago</label>
                                                        <select value={clienteData.forma_pago} onChange={(e) => setClienteData((p: any) => ({ ...p, forma_pago: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white">
                                                            <option value="">Seleccionar</option>
                                                            <option value="Efectivo">Efectivo</option>
                                                            <option value="Transferencia">Transferencia</option>
                                                            <option value="Cripto">Cripto</option>
                                                            <option value="Cheque">Cheque</option>
                                                            <option value="Otro">Otro</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Seña</label>
                                                        <input type="number" value={clienteData.senia_reserva} onChange={(e) => setClienteData((p: any) => ({ ...p, senia_reserva: e.target.value }))} placeholder="0" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Moneda</label>
                                                        <select value={clienteData.moneda_senia} onChange={(e) => setClienteData((p: any) => ({ ...p, moneda_senia: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white">
                                                            <option value="ARS">$ ARS</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Vencimiento de Seña</label>
                                                    <input type="date" value={clienteData.fecha_vencimiento} onChange={(e) => setClienteData((p: any) => ({ ...p, fecha_vencimiento: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white"/>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Notas</label>
                                                    <textarea value={clienteData.notas} onChange={(e) => setClienteData((p: any) => ({ ...p, notas: e.target.value }))} placeholder="Observaciones del trato, condiciones, etc." rows={3} className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#22c55e] transition-all bg-white resize-none"/>
                                                </div>

                                                <button onClick={handleSaveCliente} disabled={isSavingCliente} className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[#22c55e] text-white hover:bg-[#16a34a]">
                                                    {isSavingCliente ? <Loader2 size={13} className="animate-spin"/> : clienteSaved ? <><Check size={13}/> Guardado</> : <><Save size={13}/> Guardar comprador</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Botón cerrar panel — solo para propios */}
                                {selectedAuto.isProprio && (
                                    <div className="pt-4">
                                        <button onClick={handleRequestClose} className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-700 transition-all">
                                            <X size={13}/> Cerrar panel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}