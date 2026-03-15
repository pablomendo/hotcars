'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { mockSearchTickets } from '@/data/mock';
import SortableKPI from '@/components/ui/SortableKPI';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
    rectIntersection,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, rectSortingStrategy,
    horizontalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    TrendingUp, BarChart3, Loader2, ShoppingBag, Crown, Shield,
    Zap, AlertTriangle, GripVertical, Settings, Check,
    ChevronLeft, ChevronRight, Maximize2, Minimize2, X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Card layout config ────────────────────────────────────────────────────────
type ColSpan = 1 | 2 | 3 | 4;
type CardHeight = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface CardConfig { id: string; colSpan: ColSpan; height: CardHeight; }

const DEFAULT_LAYOUT: CardConfig[] = [
    { id: 'potencial',    colSpan: 2, height: 'sm' },
    { id: 'ventas',       colSpan: 1, height: 'md' },
    { id: 'inventario',   colSpan: 1, height: 'sm' },
    { id: 'avisos',       colSpan: 1, height: 'md' },
    { id: 'mercado',      colSpan: 2, height: 'lg' },
    { id: 'top10',        colSpan: 1, height: 'lg' },
    { id: 'miinventario', colSpan: 2, height: 'md' },
];

const STORAGE_KEY = 'hc_dashboard_layout_v2';

function loadLayout(): CardConfig[] {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed: CardConfig[] = JSON.parse(saved);
            // backwards compat: add height if missing
            return parsed.map(c => ({ height: 'md' as CardHeight, ...c }));
        }
    } catch {}
    return DEFAULT_LAYOUT;
}

function saveLayout(layout: CardConfig[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch {}
}

// ── Sortable Card Wrapper ─────────────────────────────────────────────────────
const HEIGHT_LABELS: Record<CardHeight, string> = { xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
const HEIGHT_STEPS: CardHeight[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const HEIGHT_CLASS: Record<CardHeight, string> = {
    xs: 'min-h-[120px]',
    sm: 'min-h-[180px]',
    md: 'min-h-[280px]',
    lg: 'min-h-[380px]',
    xl: 'min-h-[500px]',
};

function SortableCard({
    config, editMode, onResize, onResizeHeight, children,
}: {
    config: CardConfig;
    editMode: boolean;
    onResize: (id: string, span: ColSpan) => void;
    onResizeHeight: (id: string, h: CardHeight) => void;
    children: React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: config.id });

    const colClass: Record<ColSpan, string> = {
        1: 'col-span-1',
        2: 'col-span-1 lg:col-span-2',
        3: 'col-span-1 lg:col-span-3',
        4: 'col-span-1 lg:col-span-4',
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
            }}
            className={`${colClass[config.colSpan]} relative group/card ${HEIGHT_CLASS[config.height]}`}
        >
            {/* En modo edición, overlay que captura el drag sobre toda la card */}
            {editMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute inset-0 rounded-xl z-20 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                />
            )}
            {/* Borde dashed */}
            {editMode && (
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-[#288b55]/50 pointer-events-none z-30" />
            )}
            {/* Controles de tamaño — por encima del overlay */}
            {editMode && (
                <div className="absolute top-2 right-2 z-40 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {/* Width controls */}
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => onResize(config.id, Math.max(1, config.colSpan - 1) as ColSpan)}
                        disabled={config.colSpan <= 1}
                        className="w-7 h-7 rounded-lg bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        title="Menos ancho"
                    >
                        <ChevronLeft size={11} />
                    </button>
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => onResize(config.id, Math.min(4, config.colSpan + 1) as ColSpan)}
                        disabled={config.colSpan >= 4}
                        className="w-7 h-7 rounded-lg bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        title="Más ancho"
                    >
                        <ChevronRight size={11} />
                    </button>
                    {/* Divider */}
                    <div className="w-px h-5 bg-white/10" />
                    {/* Height controls */}
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => {
                            const idx = HEIGHT_STEPS.indexOf(config.height);
                            if (idx > 0) onResizeHeight(config.id, HEIGHT_STEPS[idx - 1]);
                        }}
                        disabled={config.height === 'xs'}
                        className="w-7 h-7 rounded-lg bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        title="Menos alto"
                    >
                        <Minimize2 size={11} />
                    </button>
                    <span className="text-[8px] font-black text-gray-400 w-4 text-center">{HEIGHT_LABELS[config.height]}</span>
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => {
                            const idx = HEIGHT_STEPS.indexOf(config.height);
                            if (idx < HEIGHT_STEPS.length - 1) onResizeHeight(config.id, HEIGHT_STEPS[idx + 1]);
                        }}
                        disabled={config.height === 'xl'}
                        className="w-7 h-7 rounded-lg bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        title="Más alto"
                    >
                        <Maximize2 size={11} />
                    </button>
                    {/* Divider */}
                    <div className="w-px h-5 bg-white/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#288b55]/20 border border-[#288b55]/40 flex items-center justify-center text-[#288b55]">
                        <GripVertical size={11} />
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);
    const [ventas, setVentas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userPlan, setUserPlan] = useState('FREE');
    const [userName, setUserName] = useState('');
    const [totalMessages, setTotalMessages] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [ventasTab, setVentasTab] = useState<'mes' | 'anterior' | 'historico'>('mes');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [layout, setLayout] = useState<CardConfig[]>(DEFAULT_LAYOUT);

    const DOLAR_BLUE = 1500;

    // Load layout from localStorage after mount
    useEffect(() => {
        setLayout(loadLayout());
    }, []);

    const normalizeStatus = (invStatus: string, commStatus: string) => {
        const s = invStatus?.toLowerCase().trim();
        const c = commStatus?.toLowerCase().trim();
        if (c === 'reservado' || c === 'señado') return 'reservado';
        if (s === 'activo' || s === 'publicado') return 'activo';
        if (s === 'reservado' || s === 'señado') return 'reservado';
        if (s === 'pausado') return 'pausado';
        if (s === 'vendido') return 'vendido';
        return 'draft';
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const [profileRes, inventoryRes, flipsRes, messagesRes, ventasRes] = await Promise.all([
                        supabase.from('usuarios').select('plan_type, nombre').eq('auth_id', user.id).single(),
                        supabase.from('inventario')
                            .select('id, marca, modelo, pv, pc, inventory_status, commercial_status, created_at, moneda, owner_user_id, is_flip, ganancia_flipper, ganancia_dueno, categoria')
                            .eq('owner_user_id', user.id)
                            .order('created_at', { ascending: false }),
                        supabase.from('flip_compartido')
                            .select('auto_id, inventario:auto_id(id, marca, modelo, pv, pc, inventory_status, commercial_status, created_at, moneda, owner_user_id, is_flip, ganancia_flipper, ganancia_dueno, categoria)')
                            .eq('vendedor_user_id', user.id)
                            .eq('status', 'approved'),
                        supabase.from('messages').select('id, is_read').eq('receiver_user_id', user.id),
                        supabase.from('ventas')
                            .select('id, marca, modelo, anio, moneda, precio_venta, precio_costo, ganancia, sold_at')
                            .eq('owner_user_id', user.id)
                            .order('sold_at', { ascending: false }),
                    ]);

                    if (profileRes.data) {
                        setUserPlan(profileRes.data.plan_type || 'FREE');
                        setUserName(profileRes.data.nombre || '');
                    }
                    if (inventoryRes.error) throw inventoryRes.error;

                    const msgs = messagesRes.data || [];
                    setTotalMessages(msgs.length);
                    setUnreadMessages(msgs.filter((m: any) => !m.is_read).length);

                    const propios = inventoryRes.data || [];
                    const terceros = (flipsRes.data || []).map((f: any) => f.inventario).filter(Boolean);

                    setInventory([...propios, ...terceros].map((v: any) => ({
                        ...v,
                        brand: v.marca, model: v.modelo, price: v.pv, cost: v.pc,
                        isProprio: v.owner_user_id === user.id,
                        rawStatus: normalizeStatus(v.inventory_status, v.commercial_status),
                    })));
                    setVentas(ventasRes.data || []);
                }
            } catch (err: any) {
                console.error("Error HotCars:", err.message);
            } finally {
                setIsLoading(false);
                setIsMounted(true);
            }
        };
        fetchData();
    }, []);

    // ── Computed values ───────────────────────────────────────────────────────
    const availableVehicles = useMemo(() => inventory.filter((v) => v.inventory_status?.toLowerCase() === 'activo'), [inventory]);
    const reservedVehicles  = useMemo(() => inventory.filter((v) => v.rawStatus === 'reservado'), [inventory]);
    const activeFlips       = useMemo(() => inventory.filter((v) => !v.isProprio && v.inventory_status?.toLowerCase() === 'activo'), [inventory]);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const ventasMes      = useMemo(() => ventas.filter(v => new Date(v.sold_at) >= startOfThisMonth), [ventas]);
    const ventasAnterior = useMemo(() => ventas.filter(v => { const d = new Date(v.sold_at); return d >= startOfLastMonth && d <= endOfLastMonth; }), [ventas]);
    const ventasActivas  = ventasTab === 'mes' ? ventasMes : ventasTab === 'anterior' ? ventasAnterior : ventas;

    const ventasGanancia = useMemo(() =>
        ventasActivas.reduce((sum, v: any) => {
            const g = Number(v.ganancia || 0);
            return sum + (v.moneda === 'ARS' ? g / DOLAR_BLUE : g);
        }, 0), [ventasActivas]);

    const tendencia = useMemo(() => {
        if (ventasAnterior.length === 0) return null;
        const diff = ventasMes.length - ventasAnterior.length;
        return { diff, pct: Math.round((diff / ventasAnterior.length) * 100) };
    }, [ventasMes, ventasAnterior]);

    const potentialValue = useMemo(() =>
        inventory.filter(v => ['activo', 'reservado'].includes(v.rawStatus))
            .reduce((total, v) => {
                const margen = !v.isProprio ? Number(v.ganancia_flipper || 0) : Number(v.price) - Number(v.cost);
                const enDolar = v.moneda === 'ARS' ? margen / DOLAR_BLUE : margen;
                return total + (enDolar > 0 ? enDolar : 0);
            }, 0), [inventory]);

    const inventoryStatus = useMemo(() => {
        const relevant = inventory.filter(v =>
            v.inventory_status?.toLowerCase() === 'activo' &&
            v.commercial_status?.toLowerCase() !== 'vendido' && v.created_at);
        const total = relevant.length;
        if (total === 0) return { r: 0, l: 0, c: 0 };
        const nowMs = Date.now();
        let c = 0, l = 0, r = 0;
        relevant.forEach(v => {
            const diff = Math.floor((nowMs - new Date(v.created_at).getTime()) / 86400000);
            if (diff >= 45) c++; else if (diff >= 28) l++; else r++;
        });
        return { r: Math.round(r/total*100), l: Math.round(l/total*100), c: Math.round(c/total*100) };
    }, [inventory]);

    const autosClavo = useMemo(() => {
        const nowMs = Date.now();
        return inventory
            .filter(v => {
                if (!v.created_at) return false;
                const diff = Math.floor((nowMs - new Date(v.created_at).getTime()) / 86400000);
                return v.inventory_status?.toLowerCase() === 'activo' &&
                       v.commercial_status?.toLowerCase() !== 'vendido' && diff >= 45;
            })
            .map(v => ({ ...v, diasEnStock: Math.floor((nowMs - new Date(v.created_at).getTime()) / 86400000) }))
            .sort((a, b) => b.diasEnStock - a.diasEnStock);
    }, [inventory]);

    const montoInmovilizado = useMemo(() =>
        autosClavo.reduce((sum, v) => {
            const pv = Number(v.price || v.pv || 0);
            return sum + (v.moneda === 'ARS' ? pv / DOLAR_BLUE : pv);
        }, 0), [autosClavo]);

    // ── KPI data ──────────────────────────────────────────────────────────────
    const kpiData = useMemo(() => {
        const nowMs = Date.now();
        const clavoCount = inventory.filter(v => {
            if (!v.created_at) return false;
            const diff = Math.floor((nowMs - new Date(v.created_at).getTime()) / 86400000);
            return v.inventory_status?.toLowerCase() === 'activo' &&
                   v.commercial_status?.toLowerCase() !== 'vendido' && diff >= 45;
        }).length;
        return [
            { id: 'activos',    title: 'Autos Disponibles', value: availableVehicles.length, badge: 'En Stock', badgeType: 'up', subtext: 'Listos para vender' },
            { id: 'reservados', title: 'Autos Reservados', value: reservedVehicles.length, badge: 'Señados', badgeType: 'neutral', subtext: 'Reservas activas' },
            { id: 'mensajes',   title: 'Mensajes', value: totalMessages, badge: unreadMessages > 0 ? `${unreadMessages} sin leer` : 'Al día', badgeType: unreadMessages > 0 ? 'down' : 'up', subtext: unreadMessages > 0 ? `${unreadMessages} pendientes` : 'Sin pendientes' },
            { id: 'buscados',   title: 'Modelos Buscados', value: mockSearchTickets.length, subtext: 'Pedidos comunidad' },
            { id: 'clavos',     title: 'Unidad Clavo', value: clavoCount, isCurrency: false, subtext: clavoCount > 0 ? `USD ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(montoInmovilizado)} inmovilizado` : 'Sin clavos' },
            { id: 'flips',      title: 'Flips Compartidos', value: activeFlips.length, badge: activeFlips.length > 0 ? `${activeFlips.length} activos` : 'Sin flips', badgeType: activeFlips.length > 0 ? 'up' : 'neutral', subtext: 'En tu inventario' },
        ];
    }, [inventory, availableVehicles.length, reservedVehicles.length, activeFlips.length, totalMessages, unreadMessages, montoInmovilizado]);

    const [kpiItems, setKpiItems] = useState<any[]>([]);
    useEffect(() => { if (isMounted) setKpiItems(kpiData); }, [kpiData, isMounted]);

    const kpiSensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    // ── Card drag & drop ──────────────────────────────────────────────────────
    const cardSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor)
    );

    const handleCardDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLayout(prev => {
                const oldIndex = prev.findIndex(i => i.id === active.id);
                const newIndex = prev.findIndex(i => i.id === over.id);
                const next = arrayMove(prev, oldIndex, newIndex);
                saveLayout(next);
                return next;
            });
        }
    };

    const handleResize = (id: string, span: ColSpan) => {
        setLayout(prev => {
            const next = prev.map(c => c.id === id ? { ...c, colSpan: span } : c);
            saveLayout(next);
            return next;
        });
    };

    const handleResizeHeight = (id: string, h: CardHeight) => {
        setLayout(prev => {
            const next = prev.map(c => c.id === id ? { ...c, height: h } : c);
            saveLayout(next);
            return next;
        });
    };

    const resetLayout = () => {
        setLayout(DEFAULT_LAYOUT);
        saveLayout(DEFAULT_LAYOUT);
    };

    // ── SVG Donut helper ──────────────────────────────────────────────────────
    const buildDonut = (data: { value: number }[], size: number, rOuter: number, rInner: number) => {
        const cx = size / 2, cy = size / 2;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const total = data.reduce((s, d) => s + d.value, 0);
        let cum = -90;
        return data.map((d) => {
            const start = cum;
            const sweep = (d.value / total) * 360;
            cum += sweep;
            const end = cum;
            const x1o = cx + rOuter * Math.cos(toRad(start));
            const y1o = cy + rOuter * Math.sin(toRad(start));
            const x2o = cx + rOuter * Math.cos(toRad(end));
            const y2o = cy + rOuter * Math.sin(toRad(end));
            const x1i = cx + rInner * Math.cos(toRad(end));
            const y1i = cy + rInner * Math.sin(toRad(end));
            const x2i = cx + rInner * Math.cos(toRad(start));
            const y2i = cy + rInner * Math.sin(toRad(start));
            const large = sweep > 180 ? 1 : 0;
            return `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i} Z`;
        });
    };

    // ── Formatters ────────────────────────────────────────────────────────────
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
            <Loader2 className="h-12 w-12 animate-spin text-[#288b55]" />
        </div>
    );

    // ── Card content renderers ────────────────────────────────────────────────
    const MARKET_DATA = [
        { label: 'Autos', pct: 52, color: '#3b82f6' },
        { label: 'Pickups', pct: 22, color: '#f97316' },
        { label: 'SUVs', pct: 16, color: '#10b981' },
        { label: 'Utilitarios', pct: 8, color: '#eab308' },
        { label: 'Otros', pct: 2, color: '#6b7280' },
    ];
    const marketPaths = buildDonut(MARKET_DATA.map(d => ({ value: d.pct })), 180, 80, 52);
    const activeMarket = activeIndex !== null ? MARKET_DATA[activeIndex] : null;

    // Inventory by category
    const cats: Record<string, number> = {};
    inventory.filter(v => v.inventory_status?.toLowerCase() === 'activo' && v.commercial_status?.toLowerCase() !== 'vendido')
        .forEach(v => { const cat = v.categoria || 'Sin cat.'; cats[cat] = (cats[cat] || 0) + 1; });
    const catTotal = Object.values(cats).reduce((a, b) => a + b, 0);
    const catSorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const catColors = ['#3b82f6', '#f97316', '#10b981', '#eab308', '#6b7280', '#a855f7'];
    const catPaths = catTotal > 0 ? buildDonut(catSorted.map(([, v]) => ({ value: v })), 160, 68, 44) : [];

    // ── Inventory status bar colors ───────────────────────────────────────────
    const invBarColors: string[] = [];
    for (let i = 0; i < Math.round(inventoryStatus.r / 100 * 6); i++) invBarColors.push('#22c55e');
    for (let i = 0; i < Math.round(inventoryStatus.l / 100 * 6); i++) invBarColors.push('#eab308');
    for (let i = 0; i < Math.round(inventoryStatus.c / 100 * 6); i++) invBarColors.push('#ef4444');
    while (invBarColors.length < 6) invBarColors.push(inventoryStatus.c > 0 ? '#ef4444' : inventoryStatus.l > 0 ? '#eab308' : '#22c55e');

    const renderCard = (id: string) => {
        switch (id) {
            case 'potencial':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white text-xl font-bold">Potencial de Ganancia</h3>
                            <TrendingUp className="text-[#288b55] w-5 h-5" />
                        </div>
                        <div className="flex justify-end items-baseline gap-3 mt-4">
                            <span className="text-[#288b55] text-xs font-black uppercase tracking-widest">USD</span>
                            <span className="text-[#288b55] text-4xl font-black tracking-tighter">{fmt(potentialValue)}</span>
                        </div>
                        <div className="flex gap-1.5 h-1.5 w-full mt-8">
                            {['#ef4444', '#f97316', '#eab308', '#288b55', '#288b55', '#288b55'].map((c, i) => (
                                <div key={i} className="flex-1 rounded-sm opacity-80" style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                );

            case 'ventas':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-white text-xl font-bold">Ventas</h3>
                            <ShoppingBag className="text-[#288b55] w-5 h-5" />
                        </div>
                        <div className="flex gap-1 p-1 bg-black/30 rounded-lg border border-white/5 mb-5">
                            {(['mes', 'anterior', 'historico'] as const).map(t => (
                                <button key={t} onClick={() => setVentasTab(t)}
                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${ventasTab === t ? 'bg-[#288b55] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                    {t === 'mes' ? 'Este mes' : t === 'anterior' ? 'Anterior' : 'Total'}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-baseline mb-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-4xl font-black tracking-tighter">{ventasActivas.length}</span>
                                <span className="text-gray-500 text-sm font-bold uppercase">auto{ventasActivas.length !== 1 ? 's' : ''}</span>
                            </div>
                            {ventasTab === 'mes' && tendencia !== null && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${tendencia.diff >= 0 ? 'text-[#288b55] bg-[#288b55]/10' : 'text-red-400 bg-red-400/10'}`}>
                                    {tendencia.diff >= 0 ? '+' : ''}{tendencia.pct}% vs mes ant.
                                </span>
                            )}
                        </div>
                        {ventasGanancia > 0 && (
                            <div className="flex items-baseline gap-1.5 mb-4">
                                <span className="text-[#288b55] text-[10px] font-black uppercase tracking-widest">USD</span>
                                <span className="text-[#288b55] text-lg font-black tracking-tighter">{fmt(ventasGanancia)}</span>
                                <span className="text-gray-600 text-[9px] font-bold uppercase">ganancia</span>
                            </div>
                        )}
                        {ventasActivas.length > 0 ? (
                            <div className="flex flex-col gap-1 mt-auto max-h-[110px] overflow-y-auto">
                                {ventasActivas.slice(0, 6).map((v: any) => (
                                    <div key={v.id} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[140px]">{v.marca} {v.modelo}</span>
                                        <span className="text-[9px] text-gray-600 flex-shrink-0 ml-2">
                                            {new Date(v.sold_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-auto">Sin ventas en este período</p>
                        )}
                    </div>
                );

            case 'inventario':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white text-xl font-bold">Estado de Inventario</h3>
                            <BarChart3 className="text-blue-400 w-5 h-5" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div>
                                <p className="text-[9px] text-gray-500 font-black uppercase">Rotación</p>
                                <p className="text-lg text-white font-bold">{inventoryStatus.r}%</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">0–27 días</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 font-black uppercase">Lento</p>
                                <p className="text-lg text-yellow-500 font-bold">{inventoryStatus.l}%</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">28–44 días</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-red-400 font-black uppercase">Clavo</p>
                                <p className="text-lg text-red-500 font-bold">{inventoryStatus.c}%</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">45+ días</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 h-1.5 w-full mt-6">
                            {invBarColors.slice(0, 6).map((c, i) => (
                                <div key={i} className="flex-1 rounded-sm opacity-80" style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                );

            case 'avisos':
                return (
                    <div className="bg-[#141b1f] rounded-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden h-full">
                        <div className="flex justify-between items-center px-6 pt-6 pb-4">
                            <div>
                                <h3 className="text-white text-xl font-bold">Avisos en Riesgo</h3>
                                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">Vehículos sin vender 45+ días</p>
                            </div>
                            <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
                        </div>
                        {autosClavo.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 px-6 pb-6 gap-2">
                                <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-[#22c55e]" />
                                </div>
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest text-center">Todo en rotación normal</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-[280px]">
                                {autosClavo.map((v: any) => (
                                    <div key={v.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white text-[11px] font-black uppercase truncate">{v.marca || v.brand} {v.modelo || v.model}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-red-400 text-[9px] font-bold uppercase">{v.diasEnStock} días</span>
                                                <span className="text-gray-600 text-[9px]">•</span>
                                                <span className="text-gray-500 text-[9px] font-bold uppercase">{v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.price || v.pv || 0).toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => router.push('/inventario')}
                                            className="flex-shrink-0 ml-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors">
                                            Revisar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {autosClavo.length > 0 && (
                            <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center mt-auto">
                                <span className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">Total inmovilizado</span>
                                <span className="text-red-400 text-[11px] font-black">USD {fmt(montoInmovilizado)}</span>
                            </div>
                        )}
                    </div>
                );

            case 'mercado':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-white text-xl font-bold">Mercado Usado Argentina</h3>
                            <BarChart3 className="text-blue-400 w-5 h-5 flex-shrink-0" />
                        </div>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-6">Distribución de ventas por categoría · 2024</p>
                        <div className="flex items-center gap-6">
                            <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
                                <svg width={180} height={180}>
                                    {marketPaths.map((path, i) => (
                                        <path key={i} d={path} fill={MARKET_DATA[i].color}
                                            opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                                            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            onMouseLeave={() => setActiveIndex(null)} />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-white text-2xl font-black leading-none">{activeMarket ? `${activeMarket.pct}%` : '100%'}</span>
                                    <span className="text-gray-500 text-[9px] font-bold uppercase mt-1">{activeMarket ? activeMarket.label : 'Mercado'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 flex-1">
                                {MARKET_DATA.map((item, i) => (
                                    <div key={item.label} className="flex items-center gap-3 cursor-default"
                                        onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200"
                                            style={{ background: item.color, transform: activeIndex === i ? 'scale(1.5)' : 'scale(1)' }} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-slate-300 text-[11px] font-bold">{item.label}</span>
                                                <span className="text-white text-[11px] font-black">{item.pct}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${item.pct}%`, background: item.color, opacity: activeIndex === null || activeIndex === i ? 1 : 0.25 }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest mt-1 text-right">Fuente: ACARA · 2024</p>
                            </div>
                        </div>
                    </div>
                );

            case 'top10':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-white text-xl font-bold">Top 10 Usados Argentina</h3>
                            <TrendingUp className="text-[#288b55] w-5 h-5 flex-shrink-0" />
                        </div>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">Transferencias anuales aproximadas · 2024</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { pos: 1,  auto: 'Volkswagen Gol',         k: 96 },
                                { pos: 2,  auto: 'Toyota Hilux',           k: 62 },
                                { pos: 3,  auto: 'Chevrolet Corsa/Classic',k: 58 },
                                { pos: 4,  auto: 'Ford Ranger',            k: 56 },
                                { pos: 5,  auto: 'Volkswagen Amarok',      k: 54 },
                                { pos: 6,  auto: 'Ford EcoSport',          k: 50 },
                                { pos: 7,  auto: 'Toyota Corolla',         k: 47 },
                                { pos: 8,  auto: 'Fiat Palio',             k: 45 },
                                { pos: 9,  auto: 'Ford Fiesta',            k: 42 },
                                { pos: 10, auto: 'Renault Kangoo',         k: 39 },
                            ].map(item => (
                                <div key={item.pos} className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black w-5 text-right flex-shrink-0 ${item.pos <= 3 ? 'text-[#288b55]' : 'text-gray-600'}`}>{item.pos}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-slate-300 text-[10px] font-bold truncate">{item.auto}</span>
                                            <span className="text-gray-500 text-[9px] font-bold ml-2 flex-shrink-0">~{item.k}k</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${Math.round(item.k / 96 * 100)}%`, background: item.pos <= 3 ? '#288b55' : item.pos <= 6 ? '#3b82f6' : '#374151' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest mt-4 text-right">Fuente: DNRPA · 2024</p>
                    </div>
                );

            case 'miinventario':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-white text-xl font-bold">Tu Inventario por Tipo</h3>
                            <BarChart3 className="text-[#288b55] w-5 h-5 flex-shrink-0" />
                        </div>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-5">Composición actual de tus autos activos</p>
                        {catTotal === 0 ? (
                            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin datos de inventario</p>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                                    <svg width={160} height={160}>
                                        {catPaths.map((path, i) => (
                                            <path key={i} d={path} fill={catColors[i % catColors.length]} opacity={0.9} />
                                        ))}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-white text-xl font-black leading-none">{catTotal}</span>
                                        <span className="text-gray-500 text-[9px] font-bold uppercase mt-0.5">Unidades</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5 flex-1">
                                    {catSorted.map(([label, count], i) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColors[i % catColors.length] }} />
                                                <span className="text-slate-400 text-[11px] font-bold">{label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-[9px] font-bold">{Math.round(count / catTotal * 100)}%</span>
                                                <span className="text-white text-[11px] font-black">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="bg-[#0b1114] min-h-screen w-full pt-32 pb-10 px-4 md:px-8 overflow-y-auto font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-white text-2xl font-black uppercase tracking-tighter">Panel de Control</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Bienvenido, {userName || 'Vendedor'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Edit mode toggle */}
                        <button
                            onClick={() => setEditMode(e => !e)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                editMode
                                    ? 'border-[#288b55]/40 bg-[#288b55]/10 text-[#288b55]'
                                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                            {editMode ? <><Check size={14} /> Listo</> : <><Settings size={14} /> Editar Dashboard</>}
                        </button>
                        {editMode && (
                            <button onClick={resetLayout}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                                <X size={12} /> Resetear
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                            userPlan === 'VIP' ? 'border-blue-400/20 bg-blue-400/5 text-blue-400' :
                            userPlan === 'PRO' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500' :
                            'border-white/10 bg-white/5 text-slate-400'
                        }`}>
                            {userPlan === 'VIP' ? <Crown size={16} /> : userPlan === 'PRO' ? <Zap size={16} /> : <Shield size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Plan {userPlan}</span>
                        </div>
                    </div>
                </div>

                {/* KPIs drag & drop */}
                <DndContext sensors={kpiSensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                    if (e.active.id !== e.over?.id) {
                        setKpiItems(prev => {
                            const oi = prev.findIndex(i => i.id === e.active.id);
                            const ni = prev.findIndex(i => i.id === e.over?.id);
                            return arrayMove(prev, oi, ni);
                        });
                    }
                }}>
                    <SortableContext items={kpiItems.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {kpiItems.map(item => <SortableKPI key={item.id} {...item} />)}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Edit mode hint */}
                {editMode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#288b55]/10 border border-[#288b55]/20 rounded-xl">
                        <GripVertical size={14} className="text-[#288b55]" />
                        <p className="text-[#288b55] text-[10px] font-bold uppercase tracking-widest">
                            Arrastrá las cards con el ícono <strong>⠿</strong> · Cambiá el tamaño con <strong>−</strong> y <strong>+</strong> · El diseño se guarda automáticamente
                        </p>
                    </div>
                )}

                {/* Draggable cards grid */}
                <DndContext sensors={cardSensors} collisionDetection={rectIntersection} onDragEnd={handleCardDragEnd}>
                    <SortableContext items={layout.map(c => c.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-auto">
                            {layout.map(config => (
                                <SortableCard key={config.id} config={config} editMode={editMode} onResize={handleResize} onResizeHeight={handleResizeHeight}>
                                    {renderCard(config.id)}
                                </SortableCard>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

            </div>
        </div>
    );
}