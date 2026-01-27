import { Alert } from '@/lib/types';
import { Bell, Search, TrendingDown, UserPlus } from 'lucide-react';

export default function AlertsList({ alerts }: { alerts: Alert[] }) {
    if (alerts.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 h-full flex items-center justify-center">
                <p className="text-text-secondary">Sin alertas nuevas</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-warning" />
                    Alertas Inteligentes
                </h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{alerts.length} nuevas</span>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    );
}

function AlertItem({ alert }: { alert: Alert }) {
    const iconMap = {
        'SEARCH_MATCH': <Search className="w-4 h-4 text-primary" />,
        'PRICE_CHANGE': <TrendingDown className="w-4 h-4 text-success" />, // Price drop usually
        'LEAD': <UserPlus className="w-4 h-4 text-success" />,
        'FLIP_REQ': <Zap className="w-4 h-4 text-warning" />,
        'CLAVO_RISK': <Bell className="w-4 h-4 text-error" />
    };

    // Lucide Zap was not imported in map scope, let's just use Bell fallback or import it.
    // Importing Zap
    const ZapIcon = <Zap className="w-4 h-4 text-warning" />;

    return (
        <div className="bg-background/40 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors flex gap-3 items-start group">
            <div className="mt-1 bg-card p-1.5 rounded-md border border-border">
                {iconMap[alert.type] || <Bell className="w-4 h-4 text-text-secondary" />}
            </div>
            <div className="flex-1">
                <p className="text-sm text-text-main leading-tight mb-1">{alert.message}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Hace un momento</span>
                    {alert.actionLabel && (
                        <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                            {alert.actionLabel} →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

import { Zap } from 'lucide-react';
