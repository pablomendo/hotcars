'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
    { id: 'ranking',      colSpan: 1, height: 'md' },
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
            {editMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute inset-0 rounded-xl z-20 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                />
            )}
            {editMode && (
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-[#288b55]/50 pointer-events-none z-30" />
            )}
            {editMode && (
                <div className="absolute top-2 right-2 z-40 flex items-center gap-1" onClick={e => e.stopPropagation()}>
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
                    <div className="w-px h-5 bg-white/10" />
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

// ── Potencial de Ganancia Card ────────────────────────────────────────────────
const GOAL_KEY = 'hc_potencial_goal';

function PotencialCard({
    potentialValue, inventory, DOLAR_BLUE, fmt, ventasMesGanancia,
}: {
    potentialValue: number;
    inventory: any[];
    DOLAR_BLUE: number;
    fmt: (n: number) => string;
    ventasMesGanancia: number;
}) {
    const [goal, setGoal] = useState<number>(50000);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        try { const v = Number(localStorage.getItem(GOAL_KEY)); if (v > 0) setGoal(v); } catch {}
    }, []);

    const saveGoal = () => {
        const v = Number(draft.replace(/\D/g, ''));
        if (v > 0) { setGoal(v); try { localStorage.setItem(GOAL_KEY, String(v)); } catch {} }
        setEditing(false);
    };

    const activeCount = inventory.filter(v => ['activo', 'reservado'].includes(v.rawStatus)).length;
    const avgMargin   = activeCount > 0 ? Math.round(potentialValue / activeCount) : 0;
    const goalPct     = Math.min(ventasMesGanancia / Math.max(goal, 1), 1);
    const pctLeft     = Math.max(0, Math.round((1 - goalPct) * 100));

    const VW = 240, VH = 120;
    const CX = VW / 2, CY = 116;
    const toRad = (d: number) => d * Math.PI / 180;
    const TICK_COUNT = 40;

    const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
        const frac   = i / (TICK_COUNT - 1);
        const deg    = 180 + frac * 180;
        const rad    = toRad(deg);
        const lit    = frac <= goalPct;
        const major  = i % 5 === 0;
        const f      = goalPct > 0 ? Math.min(frac / goalPct, 1) : 0;
        const gr     = Math.round(20  + 194 * f);
        const gg     = Math.round(83  + 141 * f);
        const gb     = Math.round(45  * (1 - f));
        const color  = lit ? `rgb(${gr},${gg},${gb})` : 'rgba(255,255,255,0.07)';
        const rOuter = major ? 104 : 98;
        const rInner = major ? 88  : 92;
        return {
            x1: CX + rInner * Math.cos(rad), y1: CY + rInner * Math.sin(rad),
            x2: CX + rOuter * Math.cos(rad), y2: CY + rOuter * Math.sin(rad),
            color, major, lit,
        };
    });

    const needleRad = toRad(180 + goalPct * 180);
    const needleTip = { x: CX + 80 * Math.cos(needleRad), y: CY + 80 * Math.sin(needleRad) };

    return (
        <div className="bg-[#141b1f] p-5 rounded-xl border border-white/5 shadow-2xl flex flex-col h-full">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-white text-xl font-bold">Potencial de Ganancia</h3>
                <TrendingUp className="text-[#288b55] w-5 h-5" />
            </div>
            <div className="flex justify-center flex-1" style={{ marginBottom: -14 }}>
                <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ maxWidth: 280, overflow: 'visible' }}>
                    <defs>
                        <filter id="pg-glow" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="2" result="blur"/>
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="pg-needle" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="blur"/>
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>
                    {ticks.filter(t => !t.lit).map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={t.color} strokeWidth={t.major ? 2.5 : 1.5} strokeLinecap="round" />
                    ))}
                    {ticks.filter(t => t.lit).map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={t.color} strokeWidth={t.major ? 3 : 2} strokeLinecap="round"
                            filter="url(#pg-glow)" />
                    ))}
                    <line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y}
                        stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round"
                        filter="url(#pg-needle)" />
                    <circle cx={CX} cy={CY} r={6} fill="#0f1f14" stroke="#288b55" strokeWidth={2} />
                    <text x={CX} y={CY - 30} textAnchor="middle" fill="#4ade80"
                        fontSize={26} fontWeight={900} fontFamily="sans-serif">
                        {Math.round(goalPct * 100)}%
                    </text>
                    <text x={CX} y={CY - 14} textAnchor="middle" fill="#374151"
                        fontSize={8} fontWeight={700} fontFamily="sans-serif" letterSpacing={2}>
                        DE META
                    </text>
                </svg>
            </div>
            <div className="flex flex-col gap-2 mt-auto pt-2">
                <div className="flex gap-2 items-stretch">
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Ganancia total inventario</p>
                        <div className="flex items-baseline gap-0.5 justify-center">
                            <span className="text-[7px] text-[#288b55] font-black">USD</span>
                            <span className="text-[#288b55] text-sm font-black">{fmt(potentialValue)}</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Margen promedio</p>
                        <div className="flex items-baseline gap-0.5 justify-center">
                            <span className="text-[7px] text-[#288b55] font-black">USD</span>
                            <span className="text-[#288b55] text-sm font-black">{fmt(avgMargin)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 items-stretch">
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Vendidos este mes</p>
                        <div className="flex items-baseline gap-0.5 justify-center">
                            <span className="text-[7px] text-[#288b55] font-black">USD</span>
                            <span className="text-[#288b55] text-sm font-black">{fmt(ventasMesGanancia)}</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Meta mensual</p>
                        {editing ? (
                            <div className="flex items-center gap-1 mt-0.5">
                                <input autoFocus type="text" value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditing(false); }}
                                    className="flex-1 min-w-0 bg-white/5 border border-[#288b55]/40 rounded px-1 py-0.5 text-white text-[9px] font-bold outline-none"
                                    placeholder="50000" />
                                <button onClick={saveGoal} className="text-[#288b55] text-[8px] font-black px-1.5 py-0.5 bg-[#288b55]/10 rounded border border-[#288b55]/20 flex-shrink-0">OK</button>
                            </div>
                        ) : (
                            <button onClick={() => { setDraft(String(goal)); setEditing(true); }}
                                className="flex items-baseline gap-0.5 justify-center mt-0.5 hover:opacity-80 transition-opacity w-full">
                                <span className="text-[7px] text-[#288b55] font-black">USD</span>
                                <span className="text-[#288b55] text-sm font-black">{fmt(goal)}</span>
                                <span className="text-gray-600 text-[7px] ml-0.5">✎</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Inventario Radial Card ─────────────────────────────────────────────────────
function InventarioRadialCard({ inventoryStatus }: {
    inventoryStatus: { r: number; l: number; c: number; rCount: number; lCount: number; cCount: number };
}) {
    const [hovered, setHovered] = useState<number | null>(null);
    const totalActive = inventoryStatus.rCount + inventoryStatus.lCount + inventoryStatus.cCount;

    const segments = [
        { label: 'Rotación', sublabel: '0–27 días', count: inventoryStatus.rCount, pct: inventoryStatus.r,
          color: '#22c55e', dimColor: '#14532d', rInner: 78, rOuter: 97 },
        { label: 'Lento',    sublabel: '28–44 días', count: inventoryStatus.lCount, pct: inventoryStatus.l,
          color: '#eab308', dimColor: '#713f12', rInner: 55, rOuter: 74 },
        { label: 'Clavo',    sublabel: '45+ días',   count: inventoryStatus.cCount, pct: inventoryStatus.c,
          color: '#ef4444', dimColor: '#7f1d1d', rInner: 32, rOuter: 51 },
    ];

    const SIZE = 230;
    const CX = SIZE / 2, CY = SIZE / 2;
    const toRad = (d: number) => d * Math.PI / 180;
    const TICK_COUNT = 48;

    const buildRingTicks = (rInner: number, rOuter: number, pct: number, color: string, dimColor: string) => {
        const c1 = { r: parseInt(dimColor.slice(1,3),16), g: parseInt(dimColor.slice(3,5),16), b: parseInt(dimColor.slice(5,7),16) };
        const c2 = { r: parseInt(color.slice(1,3),16),    g: parseInt(color.slice(3,5),16),    b: parseInt(color.slice(5,7),16) };
        return Array.from({ length: TICK_COUNT }, (_, i) => {
            const angle = -90 + (i / TICK_COUNT) * 360;
            const rad = toRad(angle);
            const frac = i / TICK_COUNT;
            const lit = frac * 100 <= pct;
            const f = pct > 0 ? Math.min((frac * 100) / pct, 1) : 0;
            const col = lit
                ? `rgb(${Math.round(c1.r+(c2.r-c1.r)*f)},${Math.round(c1.g+(c2.g-c1.g)*f)},${Math.round(c1.b+(c2.b-c1.b)*f)})`
                : 'rgba(255,255,255,0.05)';
            const major = i % 6 === 0;
            return {
                x1: CX + rInner * Math.cos(rad), y1: CY + rInner * Math.sin(rad),
                x2: CX + rOuter * Math.cos(rad), y2: CY + rOuter * Math.sin(rad),
                col, lit, major,
            };
        });
    };

    return (
        <div className="bg-[#141b1f] p-5 rounded-xl border border-white/5 shadow-2xl flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-xl font-bold">Estado de Inventario</h3>
                <BarChart3 className="text-blue-400 w-5 h-5" />
            </div>
            {totalActive === 0 ? (
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mt-auto">Sin unidades activas</p>
            ) : (
                <>
                    <div className="flex justify-center flex-1">
                        <svg width={SIZE} height={SIZE}>
                            <defs>
                                <filter id="inv-glow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur stdDeviation="2" result="blur"/>
                                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>
                            {segments.map((s, si) => {
                                const isHov = hovered === si;
                                const isDim = hovered !== null && !isHov;
                                const ticks = buildRingTicks(s.rInner, s.rOuter, s.pct, s.color, s.dimColor);
                                return (
                                    <g key={si}
                                        style={{ opacity: isDim ? 0.15 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
                                        onMouseEnter={() => setHovered(si)}
                                        onMouseLeave={() => setHovered(null)}
                                    >
                                        {ticks.map((t, ti) => (
                                            <line key={ti}
                                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                                stroke={t.col}
                                                strokeWidth={t.major ? (isHov ? 3.5 : 3) : (isHov ? 2.5 : 2)}
                                                strokeLinecap="round"
                                                filter={t.lit && isHov ? 'url(#inv-glow)' : undefined}
                                            />
                                        ))}
                                    </g>
                                );
                            })}
                            {hovered !== null ? (
                                <>
                                    <text x={CX} y={CY - 10} textAnchor="middle" fill={segments[hovered].color}
                                        fontSize={26} fontWeight={900} fontFamily="sans-serif">{segments[hovered].count}</text>
                                    <text x={CX} y={CY + 8} textAnchor="middle" fill="#6b7280"
                                        fontSize={8} fontWeight={700} fontFamily="sans-serif" letterSpacing={1}>
                                        {segments[hovered].label.toUpperCase()}
                                    </text>
                                    <text x={CX} y={CY + 22} textAnchor="middle" fill={segments[hovered].color}
                                        fontSize={12} fontWeight={900} fontFamily="sans-serif">{segments[hovered].pct}%</text>
                                </>
                            ) : (
                                <>
                                    <text x={CX} y={CY - 6} textAnchor="middle" fill="white"
                                        fontSize={26} fontWeight={900} fontFamily="sans-serif">{totalActive}</text>
                                    <text x={CX} y={CY + 12} textAnchor="middle" fill="#374151"
                                        fontSize={8} fontWeight={700} fontFamily="sans-serif" letterSpacing={2}>UNIDADES</text>
                                </>
                            )}
                        </svg>
                    </div>
                    <div className="flex gap-2 mt-1">
                        {segments.map((s, i) => {
                            const isHov = hovered === i;
                            const isDim = hovered !== null && !isHov;
                            return (
                                <div key={s.label}
                                    className="flex-1 bg-white/[0.03] rounded-lg px-2 py-2 border cursor-default text-center transition-all duration-200"
                                    style={{
                                        opacity: isDim ? 0.35 : 1,
                                        borderColor: isHov ? `${s.color}55` : 'rgba(255,255,255,0.05)',
                                        boxShadow: isHov ? `0 0 10px ${s.color}22` : 'none',
                                    }}
                                    onMouseEnter={() => setHovered(i)}
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    <p className="text-[7px] font-black uppercase tracking-widest mb-0.5"
                                        style={{ color: isHov ? s.color : '#4b5563' }}>{s.label}</p>
                                    <p className="text-base font-black leading-none"
                                        style={{ color: isHov ? s.color : '#fff' }}>{s.count}</p>
                                    <p className="text-[9px] font-bold mt-0.5"
                                        style={{ color: isHov ? s.color : '#374151' }}>{s.pct}%</p>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Top 10 Card ───────────────────────────────────────────────────────────────
function Top10Card({ top10Data, top10Max }: { top10Data: { pos: number; auto: string; k: number }[]; top10Max: number }) {
    const [hovered, setHovered] = useState<number | null>(null);

    const getGradient = (pos: number) => {
        if (pos <= 3)  return { from: '#1a5c38', via: '#288b55', to: '#4ade80' };
        if (pos <= 6)  return { from: '#133d27', via: '#1e6e42', to: '#288b55' };
        return         { from: '#0d2a1c', via: '#164d30', to: '#1e6e42' };
    };

    return (
        <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-white text-xl font-bold">Top 10 Usados Argentina</h3>
                <TrendingUp className="text-[#288b55] w-5 h-5 flex-shrink-0" />
            </div>
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-5">Transferencias anuales 2025</p>
            <div className="flex flex-col gap-3 flex-1">
                {top10Data.map((item) => {
                    const isHov = hovered === item.pos;
                    const isDim = hovered !== null && !isHov;
                    const widthPct = Math.round(item.k / top10Max * 100);
                    const g = getGradient(item.pos);
                    return (
                        <div key={item.pos} className="flex items-center gap-3 cursor-default"
                            style={{ opacity: isDim ? 0.35 : 1, transition: 'opacity 0.2s' }}
                            onMouseEnter={() => setHovered(item.pos)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span className="text-[10px] font-black w-5 text-right flex-shrink-0 transition-colors duration-200"
                                style={{ color: isHov ? '#4ade80' : item.pos <= 3 ? '#288b55' : '#4b5563' }}>
                                {item.pos}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold truncate transition-colors duration-200"
                                        style={{ color: isHov ? '#fff' : '#94a3b8' }}>{item.auto}</span>
                                    <span className="text-[9px] font-bold ml-2 flex-shrink-0 transition-colors duration-200"
                                        style={{ color: isHov ? '#4ade80' : '#4b5563' }}>{item.k.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <div className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${widthPct}%`,
                                            background: `linear-gradient(90deg, ${g.from}, ${g.via}, ${g.to})`,
                                            boxShadow: isHov ? `0 0 10px ${g.to}88, 0 0 20px ${g.via}44` : 'none',
                                            transition: 'box-shadow 0.25s, width 0.5s',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest mt-4 text-right">Fuente: DNRPA · 2025</p>
        </div>
    );
}

// ── Ranking Card ──────────────────────────────────────────────────────────────
function RankingCard({ userId }: { userId: string }) {
    const [tab, setTab] = useState<'mejores' | 'peores'>('mejores');
    const [metric, setMetric] = useState<'vistas' | 'guardados' | 'consultas'>('guardados');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [invRes, favRes, consultasRes] = await Promise.all([
                    supabase.from('inventario')
                        .select('id, marca, modelo, anio, pv, moneda')
                        .eq('owner_user_id', userId)
                        .eq('inventory_status', 'activo'),
                    supabase.from('favoritos')
                        .select('auto_id')
                        .in('auto_id', (await supabase.from('inventario').select('id').eq('owner_user_id', userId)).data?.map((v: any) => v.id) || []),
                    supabase.from('consultas_publicaciones')
                        .select('auto_id')
                        .in('auto_id', (await supabase.from('inventario').select('id').eq('owner_user_id', userId)).data?.map((v: any) => v.id) || []),
                ]);
                const vehicles = invRes.data || [];
                const favs = favRes.data || [];
                const consultas = consultasRes.data || [];
                const favCount: Record<string, number> = {};
                favs.forEach((f: any) => { favCount[f.auto_id] = (favCount[f.auto_id] || 0) + 1; });
                const consultaCount: Record<string, number> = {};
                consultas.forEach((c: any) => { consultaCount[c.auto_id] = (consultaCount[c.auto_id] || 0) + 1; });
                const merged = vehicles.map((v: any) => ({
                    id: v.id,
                    inventario: { marca: v.marca, modelo: v.modelo, anio: v.anio, pv: v.pv, moneda: v.moneda },
                    vistas: 0,
                    guardados: favCount[v.id] || 0,
                    consultas: consultaCount[v.id] || 0,
                }));
                setData(merged);
            } catch (e) { console.warn('ranking fetch error', e); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [userId]);

    const mejores = [...data].sort((a, b) => (b[metric]||0) - (a[metric]||0)).slice(0, 5);
    const peores  = [...data].sort((a, b) => (a[metric]||0) - (b[metric]||0)).slice(0, 5);
    const list    = tab === 'mejores' ? mejores : peores;
    const maxVal  = Math.max(list[0]?.[metric] || 1, 1);
    const metricIcon  = { vistas: '', guardados: '', consultas: '' };
    const metricColor = { vistas: '#3b82f6', guardados: '#ec4899', consultas: '#f97316' };

    return (
        <div className="bg-[#141b1f] rounded-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="flex justify-between items-start px-5 pt-5 pb-3">
                <div>
                    <h3 className="text-white text-xl font-bold">Ranking Inventario</h3>
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">Datos de visibilidad</p>
                </div>
            </div>
            <div className="flex gap-1 mx-5 p-1 bg-black/30 rounded-lg border border-white/5 mb-3">
                {(['mejores', 'peores'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                            tab === t ? t === 'mejores' ? 'bg-[#288b55] text-white' : 'bg-red-500/80 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}>
                        {t === 'mejores' ? 'Mejores' : 'Peores'}
                    </button>
                ))}
            </div>
            <div className="flex gap-1.5 mx-5 mb-3">
                {(['vistas', 'guardados', 'consultas'] as const).map(m => (
                    <button key={m} onClick={() => setMetric(m)}
                        className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                            metric === m ? 'border-transparent text-white' : 'border-white/5 text-gray-600 hover:text-gray-400'
                        }`}
                        style={metric === m ? { background: metricColor[m] + '33', borderColor: metricColor[m] + '66', color: metricColor[m] } : {}}>
                        {metricIcon[m]} {m}
                    </button>
                ))}
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04] flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center flex-1 py-8">
                        <Loader2 size={18} className="animate-spin text-gray-600" />
                    </div>
                ) : list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 px-5 py-8 gap-2 text-center">
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Sin datos todavía</p>
                        <p className="text-gray-700 text-[8px]">Se registran cuando compradores visitan tus publicaciones</p>
                    </div>
                ) : list.map((v, idx) => {
                    const val = v[metric] || 0;
                    const barW = Math.round(val / maxVal * 100);
                    const isZero = val === 0;
                    const inv = v.inventario || {};
                    return (
                        <div key={v.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                            <span className={`text-[11px] font-black w-4 flex-shrink-0 ${
                                tab === 'mejores' ? idx < 3 ? 'text-[#288b55]' : 'text-gray-600' : idx < 3 ? 'text-red-400' : 'text-gray-600'
                            }`}>{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold text-white truncate">
                                        {inv.marca} {inv.modelo} <span className="text-gray-600">{inv.anio}</span>
                                    </span>
                                    <span className={`text-[11px] font-black flex-shrink-0 ml-2 ${isZero ? 'text-red-400' : 'text-white'}`}>
                                        {metricIcon[metric]} {val.toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${barW}%`,
                                            background: isZero ? '#7f1d1d' : `linear-gradient(90deg, ${metricColor[metric]}66, ${metricColor[metric]})`,
                                            boxShadow: barW > 50 ? `0 0 6px ${metricColor[metric]}66` : 'none',
                                        }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="px-5 py-2.5 border-t border-white/5">
                <p className="text-gray-700 text-[8px] font-bold uppercase tracking-widest">Ranking mejores y peores metricas</p>
            </div>
        </div>
    );
}

// ── Mi Inventario Bar Chart Card ──────────────────────────────────────────────
function MiInventarioCard({ catSorted, catTotal, catColors }: {
    catSorted: [string, number][];
    catTotal: number;
    catColors: string[];
}) {
    const [hoveredCat, setHoveredCat] = useState<number | null>(null);
    const CAT_BAR_MAX_PX = 140;
    const catMax = catSorted.length > 0 ? catSorted[0][1] : 1;

    return (
        <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-white text-xl font-bold">Tu Inventario por Categoría</h3>
                <BarChart3 className="text-[#288b55] w-5 h-5 flex-shrink-0" />
            </div>
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">
                Composición actual · {catTotal} unidades activas
            </p>
            {catTotal === 0 ? (
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin datos de inventario</p>
            ) : (
                <div className="flex gap-2 items-end" style={{ height: CAT_BAR_MAX_PX + 80 }}>
                    {catSorted.map(([label, count], i) => {
                        const barPx = Math.max(Math.round(count / catMax * CAT_BAR_MAX_PX), 8);
                        const isHovered = hoveredCat === i;
                        const isDimmed = hoveredCat !== null && !isHovered;
                        const color = catColors[i % catColors.length];
                        const pct = Math.round(count / catTotal * 100);
                        return (
                            <div key={label} className="flex-1 flex flex-col items-center justify-end cursor-default"
                                style={{ height: '100%' }}
                                onMouseEnter={() => setHoveredCat(i)}
                                onMouseLeave={() => setHoveredCat(null)}
                            >
                                <span className="text-[11px] font-black transition-all duration-200 mb-1"
                                    style={{ color, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(4px)', minHeight: 18 }}>
                                    {count}
                                </span>
                                <div className="w-full rounded-t-md transition-all duration-300"
                                    style={{
                                        height: barPx,
                                        background: `linear-gradient(to top, ${color}55, ${color})`,
                                        opacity: isDimmed ? 0.18 : 1,
                                        transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                                        transformOrigin: 'bottom',
                                        boxShadow: isHovered ? `0 0 14px ${color}66` : 'none',
                                    }}
                                />
                                <div className="flex flex-col items-center mt-2 gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight transition-colors duration-200"
                                        style={{ color: isHovered ? '#fff' : '#6b7280' }}>
                                        {label.length > 7 ? label.slice(0, 7) : label}
                                    </span>
                                    <span className="text-[15px] font-black leading-none transition-colors duration-200"
                                        style={{ color: isHovered ? color : '#cbd5e1' }}>
                                        {pct}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
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
    const [userId, setUserId] = useState('');
    const [totalMessages, setTotalMessages] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    // ── NUEVO: pendientes de flip ──────────────────────────────────────────────
    const [pendingFlips, setPendingFlips] = useState(0);
    const [ticketsBuscados, setTicketsBuscados] = useState(0);
    const [ventasTab, setVentasTab] = useState<'mes' | 'anterior' | 'historico'>('mes');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [layout, setLayout] = useState<CardConfig[]>(DEFAULT_LAYOUT);

    const DOLAR_BLUE = 1500;

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
                    setUserId(user.id);
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

                    // ── NUEVO: contar flips pendientes (recibidos + enviados) ──
                    const propiosIds = (inventoryRes.data || []).map((v: any) => v.id);
                    const [pendingReceivedRes, pendingSentRes] = await Promise.all([
                        propiosIds.length > 0
                            ? supabase.from('flip_compartido').select('id', { count: 'exact', head: true })
                                .in('auto_id', propiosIds).eq('status', 'pending')
                            : Promise.resolve({ count: 0 }),
                        supabase.from('flip_compartido').select('id', { count: 'exact', head: true })
                            .eq('vendedor_user_id', user.id).eq('status', 'pending'),
                    ]);
                    setPendingFlips((pendingReceivedRes.count || 0) + (pendingSentRes.count || 0));

                    const { data: ticketsData } = await supabase
                        .from('tickets_busqueda')
                        .select('id')
                        .eq('status', 'activo');
                    setTicketsBuscados(ticketsData?.length ?? 0);
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
        if (total === 0) return { r: 0, l: 0, c: 0, rCount: 0, lCount: 0, cCount: 0 };
        const nowMs = Date.now();
        let c = 0, l = 0, r = 0;
        relevant.forEach(v => {
            const diff = Math.floor((nowMs - new Date(v.created_at).getTime()) / 86400000);
            if (diff >= 45) c++; else if (diff >= 28) l++; else r++;
        });
        return {
            r: Math.round(r / total * 100),
            l: Math.round(l / total * 100),
            c: Math.round(c / total * 100),
            rCount: r, lCount: l, cCount: c,
        };
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
            { id: 'buscados',   title: 'Vehículos Buscados', value: ticketsBuscados, badge: ticketsBuscados > 0 ? `${ticketsBuscados} activos` : 'Sin tickets', badgeType: ticketsBuscados > 0 ? 'up' : 'neutral', subtext: 'Tickets de la red' },
            { id: 'clavos',     title: 'Unidad Clavo', value: clavoCount, isCurrency: false, subtext: clavoCount > 0 ? `USD ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(montoInmovilizado)} inmovilizado` : 'Sin clavos' },
            // ── NUEVO: badge muestra pendientes si los hay ──
            { id: 'flips', title: 'Flips Compartidos', value: activeFlips.length, badge: pendingFlips > 0 ? `${pendingFlips} pendientes` : activeFlips.length > 0 ? `${activeFlips.length} activos` : 'Sin flips', badgeType: pendingFlips > 0 ? 'down' : activeFlips.length > 0 ? 'up' : 'neutral', subtext: pendingFlips > 0 ? 'Requieren atención' : 'En tu inventario' },
        ];
    }, [inventory, availableVehicles.length, reservedVehicles.length, activeFlips.length, totalMessages, unreadMessages, montoInmovilizado, pendingFlips]);

    const [kpiItems, setKpiItems] = useState<any[]>([]);
    useEffect(() => { setKpiItems(kpiData); }, [kpiData]);

    // Re-fetch tickets separately to avoid timing issues
    useEffect(() => {
        const fetchTickets = async () => {
            const { data } = await supabase
                .from('tickets_busqueda')
                .select('id')
                .eq('status', 'activo');
            if (data) setTicketsBuscados(data.length);
        };
        fetchTickets();
    }, []);

    const kpiSensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

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

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0b1114]">
            <Loader2 className="h-12 w-12 animate-spin text-[#288b55]" />
        </div>
    );

    const MARKET_DATA = [
        { label: 'Autos',       pct: 52, color: '#3b82f6' },
        { label: 'Pickups',     pct: 22, color: '#f97316' },
        { label: 'SUVs',        pct: 16, color: '#10b981' },
        { label: 'Utilitarios', pct:  8, color: '#eab308' },
        { label: 'Otros',       pct:  2, color: '#6b7280' },
    ];
    const activeMarket = activeIndex !== null ? MARKET_DATA[activeIndex] : null;

    const cats: Record<string, number> = {};
    inventory.filter(v => v.inventory_status?.toLowerCase() === 'activo' && v.commercial_status?.toLowerCase() !== 'vendido')
        .forEach(v => { const cat = v.categoria || 'Sin cat.'; cats[cat] = (cats[cat] || 0) + 1; });
    const catTotal = Object.values(cats).reduce((a, b) => a + b, 0);
    const catSorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const catColors = ['#3b82f6', '#f97316', '#10b981', '#eab308', '#6b7280', '#a855f7'];

    const TOP10_DATA = [
        { pos: 1,  auto: 'Volkswagen Gol',     k: 104581 },
        { pos: 2,  auto: 'Toyota Hilux',        k: 74097  },
        { pos: 3,  auto: 'Chevrolet Corsa',     k: 55501  },
        { pos: 4,  auto: 'Volkswagen Amarok',   k: 50957  },
        { pos: 5,  auto: 'Ford Ranger',         k: 50552  },
        { pos: 6,  auto: 'Ford EcoSport',       k: 39401  },
        { pos: 7,  auto: 'Toyota Corolla',      k: 38205  },
        { pos: 8,  auto: 'Peugeot 208',         k: 38079  },
        { pos: 9,  auto: 'Fiat Palio',          k: 35938  },
        { pos: 10, auto: 'Ford Ka',             k: 33516  },
    ];
    const TOP10_MAX = TOP10_DATA[0].k;

    const renderCard = (id: string) => {
        switch (id) {
            case 'potencial':
                return <PotencialCard potentialValue={potentialValue} inventory={inventory} DOLAR_BLUE={DOLAR_BLUE} fmt={fmt} ventasMesGanancia={ventasMes.reduce((sum, v: any) => { const g = Number(v.ganancia || 0); return sum + (v.moneda === 'ARS' ? g / DOLAR_BLUE : g); }, 0)} />;

            case 'ventas':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-white text-xl font-bold">Ventas</h3>
                            <ShoppingBag className="text-[#288b55] w-5 h-5" />
                        </div>
                        <div className="flex gap-1 p-1 bg-black/30 rounded-lg border border-white/5 mb-4">
                            {(['mes', 'anterior', 'historico'] as const).map(t => (
                                <button key={t} onClick={() => setVentasTab(t)}
                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${ventasTab === t ? 'bg-[#288b55] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                    {t === 'mes' ? 'Este mes' : t === 'anterior' ? 'Anterior' : 'Total'}
                                </button>
                            ))}
                        </div>
                        {ventasActivas.length > 0 ? (
                            <div className="flex flex-col divide-y divide-white/[0.04] mb-4 flex-1">
                                {ventasActivas.slice(0, 5).map((v: any) => (
                                    <div key={v.id} className="flex justify-between items-center py-2.5">
                                        <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[150px]">{v.marca} {v.modelo}</span>
                                        <span className="text-[9px] text-gray-600 flex-shrink-0 ml-2">
                                            {new Date(v.sold_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">Sin ventas en este período</p>
                        )}
                        <div className="mt-auto flex flex-col gap-2">
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center">
                                    <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest">Vendidos</p>
                                    <div className="flex items-baseline gap-1 justify-center">
                                        <span className="text-[#288b55] text-base font-black">{ventasActivas.length}</span>
                                        <span className="text-[#288b55] text-[9px] font-bold">autos</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/5 text-center">
                                    <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest">Ganancia</p>
                                    <div className="flex items-baseline gap-0.5 justify-center">
                                        <span className="text-[7px] text-[#288b55] font-black">USD</span>
                                        <span className="text-[#288b55] text-base font-black">{fmt(ventasGanancia)}</span>
                                    </div>
                                </div>
                            </div>
                            {ventasTab === 'mes' && tendencia !== null && (
                                <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border ${tendencia.diff >= 0 ? 'border-[#288b55]/20 bg-[#288b55]/5' : 'border-red-400/20 bg-red-400/5'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${tendencia.diff >= 0 ? 'text-[#288b55]' : 'text-red-400'}`}>
                                        {tendencia.diff >= 0 ? '+' : ''}{tendencia.pct}% vs mes anterior
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'inventario':
                return <InventarioRadialCard inventoryStatus={inventoryStatus} />;

            case 'avisos':
                return (() => {
                    const nowMs = Date.now();
                    const avisosEnhanced = autosClavo.map((v: any) => {
                        const dias = v.diasEnStock;
                        const mockVisitas = Math.floor(Math.random() * 40);
                        const mockConsultas = Math.floor(Math.random() * 5);
                        let problema = '', problemColor = '#ef4444', problemIcon = '⚠️';
                        if (mockConsultas === 0 && dias > 50) { problema = 'Sin consultas'; problemIcon = '👻'; problemColor = '#ef4444'; }
                        else if (mockVisitas < 15) { problema = 'Pocas visitas'; problemIcon = '📉'; problemColor = '#f97316'; }
                        else if (dias > 55) { problema = 'Precio alto'; problemIcon = '💸'; problemColor = '#eab308'; }
                        else { problema = 'Baja rotación'; problemIcon = '🐌'; problemColor = '#f97316'; }
                        return { ...v, mockVisitas, mockConsultas, problema, problemColor, problemIcon };
                    });
                    return (
                        <div className="bg-[#141b1f] rounded-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden h-full">
                            <div className="flex justify-between items-center px-5 pt-5 pb-3">
                                <div>
                                    <h3 className="text-white text-xl font-bold">Avisos en Riesgo</h3>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                        {autosClavo.length > 0 ? `${autosClavo.length} publicación${autosClavo.length > 1 ? 'es' : ''} con problemas` : 'Todo bajo control'}
                                    </p>
                                </div>
                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${autosClavo.length > 0 ? 'text-red-400' : 'text-[#22c55e]'}`} />
                            </div>
                            {avisosEnhanced.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 px-6 pb-6 gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-3xl">🏆</div>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center"><span className="text-[10px]">✓</span></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[#22c55e] text-[11px] font-black uppercase tracking-widest">¡Excelente trabajo!</p>
                                        <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mt-1">No hay avisos en riesgo</p>
                                    </div>
                                    <div className="w-full bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl px-4 py-3 text-center">
                                        <p className="text-[#22c55e]/70 text-[8px] font-bold uppercase tracking-widest leading-relaxed">Todas tus publicaciones están en rotación normal · Seguí así 💪</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-white/[0.04] overflow-y-auto flex-1">
                                    {avisosEnhanced.map((v: any) => (
                                        <div key={v.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-white text-[11px] font-black uppercase truncate block">{v.marca || v.brand} {v.modelo || v.model}</span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[10px]">{v.problemIcon}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: v.problemColor }}>{v.problema}</span>
                                                        <span className="text-gray-700 text-[9px]">·</span>
                                                        <span className="text-red-400 text-[9px] font-bold">{v.diasEnStock} días</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => router.push('/inventario')}
                                                    className="flex-shrink-0 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors whitespace-nowrap">
                                                    Optimizar
                                                </button>
                                            </div>
                                            <div className="flex gap-3">
                                                <span className="text-[8px] text-gray-600 font-bold">👁 {v.mockVisitas} vistas</span>
                                                <span className="text-[8px] text-gray-600 font-bold">💬 {v.mockConsultas} consultas</span>
                                                <span className="text-[8px] text-gray-600 font-bold">{v.moneda === 'USD' ? 'U$S' : '$'} {Number(v.price || v.pv || 0).toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {avisosEnhanced.length > 0 && (
                                <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-gray-600 text-[8px] font-bold uppercase tracking-widest">Inmovilizado</span>
                                    <span className="text-red-400 text-[11px] font-black">USD {fmt(montoInmovilizado)}</span>
                                </div>
                            )}
                        </div>
                    );
                })();

            case 'ranking':
                return <RankingCard userId={userId} />;

            case 'mercado':
                return (
                    <div className="bg-[#141b1f] p-6 rounded-xl border border-white/5 shadow-2xl h-full flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-white text-xl font-bold">Mercado Usado Argentina</h3>
                            <BarChart3 className="text-blue-400 w-5 h-5 flex-shrink-0" />
                        </div>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">Distribución de ventas por categoría · 2025</p>
                        <div className="flex justify-center flex-1">
                            <div className="relative" style={{ width: 240, height: 240 }}>
                                <svg width={240} height={240} style={{ overflow: 'visible' }}>
                                    <defs>
                                        {MARKET_DATA.map((item, i) => (
                                            <filter key={i} id={`glow-${i}`} x="-40%" y="-40%" width="180%" height="180%">
                                                <feGaussianBlur stdDeviation="6" result="blur" />
                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                            </filter>
                                        ))}
                                    </defs>
                                    {buildDonut(MARKET_DATA.map(d => ({ value: d.pct })), 240, 106, 68).map((path, i) => {
                                        const isActive = activeIndex === i;
                                        const isDimmed = activeIndex !== null && !isActive;
                                        return (
                                            <path key={i} d={path} fill={MARKET_DATA[i].color}
                                                opacity={isDimmed ? 0.2 : 1}
                                                filter={isActive ? `url(#glow-${i})` : undefined}
                                                style={{ cursor: 'pointer', transition: 'opacity 0.25s, transform 0.25s',
                                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                                    transformOrigin: '120px 120px' }}
                                                onMouseEnter={() => setActiveIndex(i)}
                                                onMouseLeave={() => setActiveIndex(null)}
                                            />
                                        );
                                    })}
                                    <circle cx={120} cy={120} r={66} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    {activeMarket ? (
                                        <>
                                            <span className="text-2xl font-black leading-none" style={{ color: activeMarket.color }}>{activeMarket.pct}%</span>
                                            <span className="text-gray-400 text-[9px] font-bold uppercase mt-1">{activeMarket.label}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white text-lg font-black leading-none tracking-tighter">1.887.024</span>
                                            <span className="text-gray-500 text-[8px] font-bold uppercase mt-1">transferencias</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-2">
                            {MARKET_DATA.map((item, i) => {
                                const isActive = activeIndex === i;
                                const isDimmed = activeIndex !== null && !isActive;
                                const TOTAL_TICKS = 20;
                                const litTicks = Math.round(item.pct / 100 * TOTAL_TICKS);
                                return (
                                    <div key={item.label}
                                        className="flex items-center gap-2 cursor-default transition-all duration-200"
                                        style={{ opacity: isDimmed ? 0.25 : 1 }}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        <span className="text-[9px] font-black uppercase w-16 flex-shrink-0 transition-colors duration-200"
                                            style={{ color: isActive ? '#fff' : '#6b7280' }}>{item.label}</span>
                                        <div className="flex gap-[3px] flex-1">
                                            {Array.from({ length: TOTAL_TICKS }, (_, ti) => {
                                                const lit = ti < litTicks;
                                                return (
                                                    <div key={ti} className="flex-1 rounded-sm transition-all duration-200"
                                                        style={{
                                                            height: 10,
                                                            background: lit ? item.color : 'rgba(255,255,255,0.06)',
                                                            opacity: lit ? (0.4 + 0.6 * (ti / Math.max(litTicks - 1, 1))) : 1,
                                                            boxShadow: lit && isActive ? `0 0 6px ${item.color}88` : 'none',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <span className="text-[13px] font-black w-9 text-right flex-shrink-0 transition-colors duration-200"
                                            style={{ color: isActive ? item.color : '#e2e8f0' }}>{item.pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest mt-2 text-right">Fuente: ACARA · 2025</p>
                    </div>
                );

            case 'top10':
                return <Top10Card top10Data={TOP10_DATA} top10Max={TOP10_MAX} />;

            case 'miinventario':
                return <MiInventarioCard catSorted={catSorted} catTotal={catTotal} catColors={catColors} />;

            default: return null;
        }
    };

    return (
        <div className="bg-[#0b1114] min-h-screen w-full font-sans">

            {/* ── SUBHEADER FIJO ── */}
            <style>{`@font-face { font-family: 'Genos'; src: url('/fonts/genos/Genos-VariableFont_wght.ttf') format('truetype'); }`}</style>
            <div className="fixed top-[100px] lg:top-[80px] left-0 right-0 z-[40] bg-[#1c2e38] backdrop-blur-md border-b border-white/5 px-4 py-3 lg:h-20 lg:py-0 flex items-center justify-center">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center gap-2">

                    {/* Desktop: Dashboard + bienvenida | Mobile: fila Dashboard + bienvenida */}
                    <div className="flex items-center justify-center gap-2">
                        <span
                            style={{ fontFamily: 'Genos', fontWeight: 300, letterSpacing: '4px', fontSize: '14px' }}
                            className="text-white uppercase opacity-40 whitespace-nowrap"
                        >
                            Dashboard
                        </span>
                        <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                            · {userName || 'Vendedor'}
                        </span>
                    </div>

                    {/* Mobile: Editar + Plan en fila | Desktop: misma fila a la derecha */}
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setEditMode(e => !e)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                editMode
                                    ? 'border-[#288b55]/40 bg-[#288b55]/10 text-[#288b55]'
                                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                            {editMode ? <><Check size={13} /> Listo</> : <><Settings size={13} /> Editar</>}
                        </button>
                        {editMode && (
                            <button onClick={resetLayout}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                                <X size={11} /> Resetear
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                            userPlan === 'VIP' ? 'border-blue-400/20 bg-blue-400/5 text-blue-400' :
                            userPlan === 'PRO' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500' :
                            'border-white/10 bg-white/5 text-slate-400'
                        }`}>
                            {userPlan === 'VIP' ? <Crown size={14} /> : userPlan === 'PRO' ? <Zap size={14} /> : <Shield size={14} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Plan {userPlan}</span>
                        </div>
                    </div>

                </div>
            </div>

        <div className="pt-[200px] lg:pt-44 pb-10 px-4 md:px-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto space-y-6">

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

                {editMode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#288b55]/10 border border-[#288b55]/20 rounded-xl">
                        <GripVertical size={14} className="text-[#288b55]" />
                        <p className="text-[#288b55] text-[10px] font-bold uppercase tracking-widest">
                            Arrastrá las cards con el ícono <strong>⠿</strong> · Cambiá el tamaño con <strong>−</strong> y <strong>+</strong> · El diseño se guarda automáticamente
                        </p>
                    </div>
                )}

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
        </div>
    );
}