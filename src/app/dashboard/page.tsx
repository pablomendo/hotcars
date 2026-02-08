'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockSearchTickets, mockCommunityStats } from '@/data/mock';
import { generateMatchingAlerts } from '@/lib/logic';
import SortableKPI from '@/components/ui/SortableKPI';
import CommunityCard from '@/components/ui/CommunityCard';
import AlertsList from '@/components/ui/AlertsList';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { TrendingUp, BarChart3, Loader2, Clock, Crown, Shield, Zap } from 'lucide-react';

export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userPlan, setUserPlan] = useState('FREE'); // Estado para el plan
    const [userName, setUserName] = useState('');
    
    const DOLAR_BLUE = 1500;

    const normalizeStatus = (status: string) => {
        const s = status?.toLowerCase().trim();
        if (s === 'activo' || s === 'publicado') return 'activo';
        if (s === 'reservado' || s === 'señado') return 'reservado';
        if (s === 'pausado') return 'pausado';
        if (s === 'vendido') return 'vendido';
        return 'draft';
    };

    useEffect(() => {
        const fetchUserDataAndInventory = async () => {
            setIsLoading(true);
            try {
                // 1. Obtener sesión actual
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    // 2. Obtener perfil del usuario (Plan y Nombre)
                    const { data: profile } = await supabase
                        .from('usuarios')
                        .select('plan_type, nombre')
                        .eq('auth_id', user.id)
                        .single();
                    
                    if (profile) {
                        setUserPlan(profile.plan_type);
                        setUserName(profile.nombre);
                    }
                }

                // 3. Obtener Inventario
                const { data, error } = await supabase
                    .from('inventario')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const mappedData = (data || []).map(v => ({
                    ...v,
                    brand: v.marca,
                    model: v.modelo,
                    price: v.pv,
                    cost: v.pc,
                    rawStatus: normalizeStatus(v.inventory_status || v.estado)
                }));

                setInventory(mappedData);
            } catch (err: any) {
                console.error("Error HotCars:", err.message);
            } finally {
                setIsLoading(false);
                setIsMounted(true);
            }
        };

        fetchUserDataAndInventory();
    }, []);

    const availableVehicles = useMemo(() => inventory.filter((v: any) => v.rawStatus === 'activo'), [inventory]);
    const reservedVehicles = useMemo(() => inventory.filter((v: any) => v.rawStatus === 'reservado'), [inventory]);

    const potentialValue = useMemo(() => {
        const relevantVehicles = inventory.filter((v: any) => ['activo', 'reservado', 'pausado'].includes(v.rawStatus));
        return relevantVehicles.reduce((total, v: any) => {
            const margen = Number(v.price) - Number(v.cost);
            const margenDolar = v.moneda === 'ARS' ? (margen / DOLAR_BLUE) : margen;
            return total + (margenDolar > 0 ? margenDolar : 0);
        }, 0);
    }, [inventory]);

    const inventoryStatus = useMemo(() => {
        const relevantVehicles = inventory.filter((v: any) => ['activo', 'reservado', 'pausado'].includes(v.rawStatus));
        const total = relevantVehicles.length;
        if (total === 0) return { r: 0, l: 0, c: 0 };
        const now = new Date().getTime();
        let c = 0, l = 0, r = 0;
        relevantVehicles.forEach((v: any) => {
            const diff = Math.floor((now - new Date(v.created_at).getTime()) / 86400000);
            if (diff >= 45) c++; else if (diff >= 31) l++; else r++;
        });
        return { r: Math.round((r/total)*100), l: Math.round((l/total)*100), c: Math.round((c/total)*100) };
    }, [inventory]);

    const kpiData = useMemo(() => {
        const now = new Date().getTime();
        const clavoCount = inventory.filter((v: any) => {
            const diff = Math.floor((now - new Date(v.created_at).getTime()) / 86400000);
            return v.rawStatus === 'activo' && diff >= 45;
        }).length;

        return [
            { id: 'activos', title: 'Autos Disponibles', value: availableVehicles.length, badge: 'En Stock', badgeType: 'up', subtext: 'Listos para vender' },
            { id: 'reservados', title: 'Autos Reservados', value: reservedVehicles.length, badge: 'Señados', badgeType: 'neutral', subtext: 'Reservas activas' },
            { id: 'mensajes', title: 'Mensajes', value: 15, subtext: 'Leads acumulados' },
            { id: 'buscados', title: 'Modelos Buscados', value: mockSearchTickets.length, subtext: 'Pedidos comunidad' },
            { id: 'clavos', title: 'Unidad Clavo', value: clavoCount, isCurrency: false, subtext: 'Revisar precio' },
            { id: 'flips', title: 'Flips Compartidos', value: 1, subtext: 'Solicitudes' }
        ];
    }, [inventory, availableVehicles.length, reservedVehicles.length]);

    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (isMounted) setItems(kpiData); }, [kpiData, isMounted]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
    
    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]"><Loader2 className="h-12 w-12 animate-spin text-[#288b55]" /></div>;

    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(potentialValue);

    return (
        <div className="bg-[#0b1114] min-h-screen w-full pt-32 pb-10 px-4 md:px-8 overflow-y-auto font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* HEADER CON INFO DE PLAN */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-white text-2xl font-black uppercase tracking-tighter">Panel de Control</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Bienvenido, {userName || 'Vendedor'}</p>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        userPlan === 'VIP' ? 'border-blue-400/20 bg-blue-400/5 text-blue-400' :
                        userPlan === 'PRO' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500' :
                        'border-white/10 bg-white/5 text-slate-400'
                    }`}>
                        {userPlan === 'VIP' ? <Crown size={16} /> : userPlan === 'PRO' ? <Zap size={16} /> : <Shield size={16} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Plan {userPlan}</span>
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                    if (e.active.id !== e.over?.id) {
                        setItems((prev) => {
                            const oldIndex = prev.findIndex((i) => i.id === e.active.id);
                            const newIndex = prev.findIndex((i) => i.id === e.over?.id);
                            return arrayMove(prev, oldIndex, newIndex);
                        });
                    }
                }}>
                    <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {items.map((item) => <SortableKPI key={item.id} {...(item as any)} />)}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* POTENCIAL DE GANANCIA */}
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white text-xl font-bold">Potencial de Ganancia</h3>
                            <TrendingUp className="text-[#288b55] w-5 h-5" />
                        </div>
                        <div className="flex justify-end items-baseline gap-3 mt-4">
                            <span className="text-[#288b55] text-xs font-black uppercase tracking-widest">USD</span>
                            <span className="text-[#288b55] text-4xl font-black tracking-tighter">{formatter}</span>
                        </div>
                        <div className="flex gap-1.5 h-1.5 w-full mt-8">
                            {['bg-red-600', 'bg-orange-500', 'bg-yellow-500', 'bg-[#288b55]', 'bg-[#288b55]', 'bg-[#288b55]'].map((color, i) => (
                                <div key={i} className={`flex-1 ${color} rounded-sm opacity-80 shadow-[0_0_8px_rgba(40,139,85,0.1)]`}></div>
                            ))}
                        </div>
                    </div>

                    {/* DIAS PROMEDIO DE VENTAS */}
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white text-xl font-bold tracking-tight">Días Promedio de Ventas</h3>
                            <Clock className="text-blue-400 w-5 h-5" />
                        </div>
                        <div className="flex justify-end items-baseline gap-2 mt-4">
                            <span className="text-white text-4xl font-black tracking-tighter">28</span>
                            <span className="text-gray-500 text-sm font-bold uppercase">Días</span>
                        </div>
                        <div className="flex gap-1.5 h-1.5 w-full mt-8 opacity-20">
                            {[...Array(6)].map((_, i) => <div key={i} className="flex-1 bg-blue-400 rounded-sm"></div>)}
                        </div>
                    </div>

                    {/* ESTADO DE INVENTARIO */}
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white text-xl font-bold">Estado de Inventario</h3>
                            <BarChart3 className="text-blue-400 w-5 h-5" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div><p className="text-[9px] text-gray-500 font-black uppercase">Rotación</p><p className="text-lg text-white font-bold">{inventoryStatus.r}%</p></div>
                            <div><p className="text-[9px] text-gray-500 font-black uppercase">Lento</p><p className="text-lg text-yellow-500 font-bold">{inventoryStatus.l}%</p></div>
                            <div><p className="text-[9px] text-red-400 font-black uppercase tracking-tighter">Clavo</p><p className="text-lg text-red-500 font-bold">{inventoryStatus.c}%</p></div>
                        </div>
                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5 mt-4 border border-white/5">
                            <div style={{ width: `${inventoryStatus.r}%` }} className="bg-[#22c55e]" />
                            <div style={{ width: `${inventoryStatus.l}%` }} className="bg-[#eab308]" />
                            <div style={{ width: `${inventoryStatus.c}%` }} className="bg-[#ef4444]" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <CommunityCard stats={mockCommunityStats} />
                    </div>
                    <div className="h-full">
                        <AlertsList alerts={generateMatchingAlerts(availableVehicles, mockSearchTickets)} />
                    </div>
                </div>
            </div>
        </div>
    );
}