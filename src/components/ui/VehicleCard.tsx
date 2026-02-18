'use client';

import { calculateGain, isClavo, isValidForKPI } from '@/lib/logic';
import { AlertTriangle, Clock, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VehicleCardProps {
    vehicle: any; // Usamos any para mapear directamente los campos de la tabla 'inventario'
    hasOpportunity?: boolean;
}

export default function VehicleCard({ vehicle, hasOpportunity }: VehicleCardProps) {
    const router = useRouter();
    const gain = calculateGain(vehicle);
    const clavo = isClavo(vehicle);
    const valid = isValidForKPI(vehicle);

    const fmt = (n?: number) => n ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n) : 'N/A';

    /**
     * Navegación con URL Amigable (Slug + ID)
     * Extrae los datos de las columnas de la tabla 'inventario'
     */
    const handleNavigate = () => {
        const marca = vehicle.marca || '';
        const modelo = vehicle.modelo || '';
        const anio = vehicle.anio || '';

        const slug = `${marca}-${modelo}-${anio}`
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-') // Limpia caracteres especiales
            .replace(/(^-|-$)+/g, '');    // Quita guiones sobrantes

        // Si el slug existe, lo une al ID. Si no, manda solo el ID.
        const path = slug ? `${slug}-${vehicle.id}` : vehicle.id;
        router.push(`/vehiculos/${path}`);
    };

    const handleGeneratePlate = (e: React.MouseEvent) => {
        e.stopPropagation(); // Importante: evita que se dispare el handleNavigate
        const baseUrl = '/api/og';
        const timestamp = Date.now();
        window.open(`${baseUrl}?id=${vehicle.id}&t=${timestamp}`, '_blank');
    };

    return (
        <div 
            onClick={handleNavigate}
            className="bg-card rounded-xl p-4 border border-border flex flex-col gap-3 relative hover:border-primary transition-colors duration-200 cursor-pointer"
        >
            {/* Header Info - Usando campos de tabla inventario */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-semibold text-white">{vehicle.marca} {vehicle.modelo}</h2>
                    <p className="text-sm text-text-secondary">{vehicle.anio} • {vehicle.operationType === 'CONSIGNACION_PROPIA' ? 'Propia' : 'Flip Compartido'}</p>
                </div>

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

            {/* Pricing Grid - Usando campos de tabla inventario */}
            <div className="grid grid-cols-2 gap-4 mt-2 bg-background/50 p-3 rounded-lg">
                <div>
                    <span className="text-xs text-text-secondary block">Precio Compra</span>
                    <span className="text-sm font-medium text-white">{fmt(vehicle.precio_compra)}</span>
                </div>
                <div>
                    <span className="text-xs text-text-secondary block">Precio Venta</span>
                    <span className="text-sm font-medium text-white">{fmt(vehicle.pv)}</span>
                </div>
            </div>

            {/* Gain Section */}
            <div className="mt-2 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Ganancia Potencial</span>
                    <span className={`text-xl font-bold ${valid ? 'text-success' : 'text-text-disabled'}`}>
                        {valid && gain ? fmt(gain.userGain) : '---'}
                    </span>
                </div>
                {gain?.isProportional && (
                    <p className="text-xs text-text-secondary text-right mt-1">
                        (Tu parte: {vehicle.porcentaje_flip ?? 40}%)
                    </p>
                )}
            </div>

            {/* BOTÓN GENERAR PLACA INSTAGRAM */}
            <button
                onClick={handleGeneratePlate}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-[#2596be]/10 hover:bg-[#2596be]/20 text-[#2596be] py-2 rounded-lg border border-[#2596be]/30 transition-all duration-200 cursor-pointer group"
            >
                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Crear Placa IG</span>
            </button>
        </div>
    );
}