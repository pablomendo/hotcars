'use client';

import Link from 'next/link';

const CATEGORIES = [
    { id: 'todas', label: 'Todas' },
    { id: 'inventory', label: 'Flips' },
    { id: 'message', label: 'Mensajes' },
    { id: 'system', label: 'Sistema' },
];

type Props = {
    notifications: any[];
    unreadCount: number;
    activeCategory: string;
    onCategoryChange: (id: string) => void;
    onNotificationClick: (n: any) => void;
    formatRelativeDate: (d: string) => string;
};

export default function NotificationsPanel({ notifications, unreadCount, activeCategory, onCategoryChange, onNotificationClick, formatRelativeDate }: Props) {
    return (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl z-[110] animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex flex-col gap-2 bg-black/20">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold">Notificaciones</h3>
                    <span className="text-[10px] text-slate-400">{unreadCount} pendientes</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={(e) => { e.stopPropagation(); onCategoryChange(cat.id); }}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat.id ? 'bg-[#00984a] text-white shadow-lg shadow-[#00984a]/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
                {notifications.length > 0 ? (
                    notifications.map((n, index) => (
                        <div
                            key={n.id}
                            onClick={() => onNotificationClick(n)}
                            style={{ animationDelay: `${index * 75}ms` }}
                            className={`p-3 rounded-lg border border-white/5 cursor-pointer hover:border-[#00984a]/30 hover:bg-[#134e4d]/10 transition-all relative animate-in slide-in-from-top-2 duration-300 fill-mode-both ${!n.is_read ? 'bg-white/[0.04] shadow-sm' : 'bg-transparent opacity-80'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${n.category === 'inventory' ? 'bg-blue-500/20 text-blue-400' : n.category === 'message' ? 'bg-[#00984a]/20 text-[#00984a]' : 'bg-slate-500/20 text-slate-400'}`}>
                                    {n.category === 'inventory' ? 'Flip' : n.category === 'message' ? 'Mensaje' : 'Sistema'}
                                </span>
                                <p className="text-[9px] text-slate-500 font-medium">{formatRelativeDate(n.created_at)}</p>
                            </div>
                            <p className="text-[11px] font-bold text-white mb-1 line-clamp-1">{n.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.body}</p>
                            {!n.is_read && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00984a] rounded-full shadow-[0_0_8px_#00984a]" />}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center text-slate-500 text-xs">No hay notificaciones en esta categoría</div>
                )}
            </div>
            <Link href="/notifications" className="block w-full py-3 text-center text-[10px] font-bold text-[#00984a] hover:bg-white/5 border-t border-white/5 transition-colors uppercase tracking-wider">
                Ver todas
            </Link>
        </div>
    );
}
