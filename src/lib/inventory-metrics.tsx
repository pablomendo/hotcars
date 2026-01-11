"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileSearch, Clock } from "lucide-react";

export function InventoryKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Mensajes pendientes */}
      <Card className="bg-card/70">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Mensajes pendientes</p>
            <p className="text-2xl font-bold">5</p>
          </div>
          <MessageSquare className="h-6 w-6 text-blue-400" />
        </CardContent>
      </Card>

      {/* Vehículos requeridos */}
      <Card className="bg-card/70">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Vehículos requeridos</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">26</p>
              <Badge
                variant="outline"
                className="text-green-400 border-green-400/50"
              >
                Oportunidad
              </Badge>
            </div>
          </div>
          <FileSearch className="h-6 w-6 text-green-400" />
        </CardContent>
      </Card>

      {/* Días promedio de venta */}
      <Card className="bg-card/70">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Días promedio de venta
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">34</p>
              <span className="text-xs text-muted-foreground">días</span>
            </div>
          </div>
          <Clock className="h-6 w-6 text-amber-400" />
        </CardContent>
      </Card>
    </div>
  );
}