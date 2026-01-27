'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockSearchTickets, mockCommunityStats } from '@/data/mock';
import { isClavo, generateMatchingAlerts } from '@/lib/logic';
import SortableKPI from '@/components/ui/SortableKPI';
import CommunityCard from '@/components/ui/CommunityCard';
import AlertsList from '@/components/ui/AlertsList';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { TrendingUp, BarChart3, Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Cotización Blue de la API: 1500
    const DOLAR_BLUE = 1500;

    useEffect(() => {
        const fetchInventory = async () => {
            setIsLoading(true);
            try {
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
                    status: v.estado?.toUpperCase() || 'DRAFT'
                }));

                setInventory(mappedData);
            } catch (err) {
                console.error("Error HotCars:", err.message);
            } finally {
                setIsLoading(false);
                setIsMounted(true);
            }
        };

        fetchInventory();
    }, []);

    const activeVehicles = useMemo(() => {
        return inventory.filter(v => 
            v.status === 'ACTIVE' || 
            v.status === 'PUBLICADO' || 
            v.status === 'ACTIVO'
        );
    }, [inventory]);

    // Lógica corregida: Suma total de (Venta - Compra) de inventario real con conversión API
    const potentialValue = useMemo(() => {
        return activeVehicles.reduce((total, v) => {
            const margen = Number(v.price) - Number(v.cost);
            // Si la unidad está en pesos (ARS), divide por 1500
            const margenDolar = v.moneda === 'ARS' ? (margen / DOLAR_BLUE) : margen;
            return total + (margenDolar > 0 ? margenDolar : 0);
        }, 0);
    }, [activeVehicles]);

    const inventoryStatus = useMemo(() => {
        const total = activeVehicles.length;
        if (total === 0) return { r: 0, l: 0, c: 0 };
        const now = new Date().getTime();
        let c = 0, l = 0, r = 0;
        activeVehicles.forEach(v => {
            const diff = Math.floor((now - new Date(v.created_at).getTime()) / 86400000);
            if (diff > 45) c++; else if (diff >= 21) l++; else r++;
        });
        return { 
            r: Math.round((r/total)*100), 
            l: Math.round((l/total)*100), 
            c: Math.round((c/total)*100) 
        };
    }, [activeVehicles]);

    const kpiData = useMemo(() => {
        const clavoCount = activeVehicles.filter(v => isClavo(v)).length;
        return [
            { id: 'activos', title: 'Autos Activos', value: activeVehicles.length, badge: 'En vivo', badgeType: 'up', subtext: 'Inventario real' },
            { id: 'mensajes', title: 'Mensajes', value: 15, subtext: 'Leads acumulados' },
            { id: 'flips', title: 'Flips Compartidos', value: 1, subtext: '1 solicitud de flip' },
            { id: 'dias', title: 'Días Prom. Venta', value: 28, badge: '2.5%', badgeType: 'down', subtext: 'desde mes pasado' },
            { id: 'buscados', title: 'Modelos Buscados', value: mockSearchTickets.length, subtext: 'Pedidos comunidad' },
            { id: 'clavos', title: 'Unidad Clavo', value: clavoCount, isCurrency: false, subtext: 'Acción requerida' }
        ];
    }, [activeVehicles]);

    const [items, setItems] = useState(kpiData);
    useEffect(() => { if (isMounted) setItems(kpiData); }, [kpiData, isMounted]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
    
    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
            <Loader2 className="h-12 w-12 animate-spin text-[#a3e635]" />
        </div>
    );

    // Formateador corregido: Sin símbolo de moneda, solo el número con comas
    const formatter = new Intl.NumberFormat('en-US', { 
        maximumFractionDigits: 0 
    }).format(potentialValue);

    return (
        /* FIX: Se agregó 'pt-32' para compensar el Header estático y un contenedor max-width para centrar */
        <div className="bg-[#0b1114] min-h-screen w-full pt-32 pb-10 px-4 md:px-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto space-y-6">
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
                            {items.map((item) => (
                                <SortableKPI key={item.id} {...(item as any)} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CARD POTENCIAL DE GANANCIA CORREGIDA */}
                    <div className="bg-[#1a2b2b] p-6 rounded-xl border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="text-white text-lg font-bold tracking-tight">Potencial de Ganancia</h3>
                                <p className="text-gray-500 text-xs italic">Comisión Neta (Venta - Compra)</p>
                            </div>
                            <TrendingUp className="text-[#a3e635] w-5 h-5" />
                        </div>
                        <div className="flex items-baseline gap-3 mt-6">
                            <span className="text-[#a3e635] text-xs font-bold uppercase">USD</span>
                            <span className="text-[#a3e635] text-4xl font-bold tracking-tighter">
                                {formatter}
                            </span>
                        </div>
                        {/* BARRA SEGMENTADA DE COLORES */}
                        <div className="flex gap-1.5 h-1.5 w-full mt-8">
                            <div className="flex-1 bg-red-500 rounded-sm opacity-80"></div>
                            <div className="flex-1 bg-orange-500 rounded-sm opacity-80"></div>
                            <div className="flex-1 bg-yellow-500 rounded-sm opacity-80"></div>
                            <div className="flex-1 bg-lime-500 rounded-sm opacity-80"></div>
                            <div className="flex-1 bg-green-500 rounded-sm opacity-80"></div>
                            <div className="flex-1 bg-emerald-600 rounded-sm opacity-80"></div>
                        </div>
                    </div>

                    <div className="bg-[#1a2b2b] p-6 rounded-xl border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white text-lg font-bold">Estado de Inventario</h3>
                                <p className="text-gray-400 text-xs italic text-blue-400">Salud según días publicados</p>
                            </div>
                            <BarChart3 className="text-blue-400 w-5 h-5" />
                        </div>
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5 mt-6">
                            <div style={{ width: `${inventoryStatus.r}%` }} className="bg-[#22c55e]" />
                            <div style={{ width: `${inventoryStatus.l}%` }} className="bg-[#eab308]" />
                            <div style={{ width: `${inventoryStatus.c}%` }} className="bg-[#ef4444]" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center font-bold">
                            <div><p className="text-[10px] text-gray-500 uppercase">Rotación</p><p className="text-lg text-white">{inventoryStatus.r}%</p></div>
                            <div><p className="text-[10px] text-gray-500 uppercase">Lento</p><p className="text-lg text-yellow-500">{inventoryStatus.l}%</p></div>
                            <div><p className="text-[10px] text-red-400 uppercase">Riesgo</p><p className="text-lg text-red-500">{inventoryStatus.c}%</p></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <CommunityCard stats={mockCommunityStats} />
                    </div>
                    <div className="h-full">
                        <AlertsList alerts={generateMatchingAlerts(activeVehicles, mockSearchTickets)} />
                    </div>
                </div>
            </div>
        </div>
    );
}