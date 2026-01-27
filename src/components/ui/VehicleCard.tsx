import { Vehicle } from '@/lib/types';
import { calculateGain, isClavo, isValidForKPI } from '@/lib/logic';
import { AlertTriangle, Clock } from 'lucide-react';

interface VehicleCardProps {
    vehicle: Vehicle;
    hasOpportunity?: boolean; // Phase 2: From Search Match
}

export default function VehicleCard({ vehicle, hasOpportunity }: VehicleCardProps) {
    const gain = calculateGain(vehicle);
    const clavo = isClavo(vehicle);
    const valid = isValidForKPI(vehicle);

    // Format currency
    const fmt = (n?: number) => n ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n) : 'N/A';

    return (
        <div className="bg-card rounded-xl p-4 border border-border flex flex-col gap-3 relative hover:border-primary transition-colors duration-200">
            {/* Header Info */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-semibold text-white">{vehicle.brand} {vehicle.model}</h2>
                    <p className="text-sm text-text-secondary">{vehicle.year} • {vehicle.operationType === 'CONSIGNACION_PROPIA' ? 'Propia' : 'Flip Compartido'}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap justify-end">
                    {hasOpportunity && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary flex items-center gap-1 border border-primary/20 animate-pulse">
                            ★ Oportunidad
                        </span>
                    )}
                    {!valid && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-error/20 text-error flex items-center gap-1">
                            <AlertTriangle className='w-3 h-3' /> Incompleto
                        </span>
                    )}
                    {valid && clavo && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning flex items-center gap-1">
                            <Clock className='w-3 h-3' /> Clavo
                        </span>
                    )}
                    {valid && !clavo && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success/20 text-success">
                            Activo
                        </span>
                    )}
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2 bg-background/50 p-3 rounded-lg">
                <div>
                    <span className="text-xs text-text-secondary block">Precio Compra</span>
                    <span className="text-sm font-medium text-white">{fmt(vehicle.prices.purchasePrice)}</span>
                </div>
                <div>
                    <span className="text-xs text-text-secondary block">Precio Venta</span>
                    <span className="text-sm font-medium text-white">{fmt(vehicle.prices.salePrice)}</span>
                </div>
            </div>

            {/* Gain Section (Calculated) */}
            <div className="mt-2 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Ganancia Potencial</span>
                    <span className={`text-xl font-bold ${valid ? 'text-success' : 'text-text-disabled'}`}>
                        {valid && gain ? fmt(gain.userGain) : '---'}
                    </span>
                </div>
                {gain?.isProportional && (
                    <p className="text-xs text-text-secondary text-right mt-1">
                        (Tu parte: {vehicle.prices.flipPercent ?? 40}%)
                    </p>
                )}
            </div>
        </div>
    );
}
