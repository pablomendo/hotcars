"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileSearch, Clock } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import { getAverageDaysToSell } from "@/lib/inventory-metrics";

interface Props {
  inventory: InventoryItem[];
}

export function InventoryKpis({ inventory }: Props) {
  // Datos que luego se conectarán dinámicamente
  const mensajesPendientes = 7; 
  const vehiculosRequeridos = 26; 
  const avgDays = getAverageDaysToSell(inventory);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Mensajes Pendientes */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mensajes
            </p>
            <p className="text-2xl font-bold tracking-tight">{mensajesPendientes}</p>
            <p className="text-[10px] text-blue-400 font-medium">7 nuevos hoy</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* Vehículos Requeridos */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vehículos Requeridos
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight">{vehiculosRequeridos}</p>
              <Badge
                variant="outline"
                className="text-[9px] h-4 uppercase border-primary text-primary bg-primary/5"
              >
                Oportunidad
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Demanda de la red hoy</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Días Promedio de Venta */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Días Prom. Venta
            </p>
            <p className="text-2xl font-bold tracking-tight">{avgDays}</p>
            <p className="text-[10px] text-primary font-medium">↑ 2.5% <span className="text-muted-foreground font-normal">desde mes pasado</span></p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}