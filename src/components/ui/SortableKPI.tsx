'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SortableKPIProps {
    id: string;
    title: string;
    value: string | number;
    badge?: string;
    badgeType?: 'up' | 'down';
    subtext?: string;
    isCurrency?: boolean;
}

export default function SortableKPI({ id, title, value, badge, badgeType, subtext, isCurrency }: SortableKPIProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative p-5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                isDragging 
                    ? 'bg-[#1c232b] border-blue-500 shadow-2xl scale-105' 
                    : 'bg-[#11191f] border-[#1e293b] hover:border-gray-700'
            }`}
        >
            {/* Título: Agrandado a 20px, Blanco, Neue Bold, Mayúscula/Minúscula */}
            <p className="text-[20px] font-bold text-white tracking-tight mb-3 font-sans">
                {title}
            </p>

            {/* Valor: Neue Bold (text-4xl) */}
            <div className="flex items-baseline gap-1">
                <h3 className={`text-4xl font-bold tracking-tighter font-sans ${isCurrency ? 'text-[#a3e635]' : 'text-white'}`}>
                    {value}
                </h3>
                
                {badge && (
                    <span className={`ml-2 flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md font-sans ${
                        badgeType === 'up' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'
                    }`}>
                        {badgeType === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {badge}
                    </span>
                )}
            </div>

            {/* Subtexto: Neue Bold */}
            {subtext && (
                <p className="text-[11px] text-gray-500 mt-2 font-bold font-sans">
                    {subtext}
                </p>
            )}
        </div>
    );
}