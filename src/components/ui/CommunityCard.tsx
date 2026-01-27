import { CommunityStats } from '@/lib/types';
import { Users, Zap, MessageSquare, TrendingUp } from 'lucide-react';

export default function CommunityCard({ stats }: { stats: CommunityStats }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Users className="text-primary w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Comunidad HotCars</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatItem
                    icon={<div className="w-2 h-2 rounded-full bg-success animate-pulse" />}
                    value={stats.activeUsers}
                    label="Usuarios Online"
                />
                <StatItem
                    icon={<Zap className="w-4 h-4 text-warning" />}
                    value={stats.activeFlips}
                    label="Flips Activos"
                />
                <StatItem
                    icon={<TrendingUp className="w-4 h-4 text-primary" />}
                    value={stats.leadsToday}
                    label="Leads Hoy"
                />
                <StatItem
                    icon={<MessageSquare className="w-4 h-4 text-white" />}
                    value={stats.messagesExchanged}
                    label="Mensajes en Red"
                />
            </div>
        </div>
    );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
    return (
        <div className="bg-background/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-2xl font-bold text-white">{value}</span>
            </div>
            <p className="text-xs text-text-secondary">{label}</p>
        </div>
    );
}
