"use client";

import { Car, Share2, MessageSquare, Clock, Search, AlertCircle } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: string;
}

function KpiCard({ title, value, description, icon: Icon, trend }: KpiCardProps) {
  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {trend && (
          <p className="text-xs text-primary font-medium mt-1">
            {trend} <span className="text-muted-foreground font-normal">desde el mes pasado</span>
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export function OverviewStats() {
  // En el futuro, estos datos vendrán de tu sección de Inventario
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard 
        title="Autos Activos" 
        value="14" 
        trend="↑ 15.2%" 
        icon={Car} 
      />
      <KpiCard 
        title="Flips Compartidos" 
        value="11" 
        description="1 solicitud de flip" 
        icon={Share2} 
      />
      <KpiCard 
        title="Mensajes" 
        value="9" 
        description="Pendientes" 
        icon={MessageSquare} 
      />
      <KpiCard 
        title="Días Prom. Venta" 
        value="28" 
        trend="↓ 2.5%" 
        icon={Clock} 
      />
      <KpiCard 
        title="Vehículos Requeridos" 
        value="23" 
        description="Oportunidad de venta" 
        icon={Search} 
      />
      <KpiCard 
        title="Unidad Clavo" 
        value="USD $3.200" 
        icon={AlertCircle} 
      />
    </div>
  );
}
