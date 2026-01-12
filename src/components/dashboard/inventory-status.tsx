"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InventoryStatus() {
  const inventoryData = {
    inRotation: 55,
    slowMoving: 30,
    clavoUnits: 15,
  };
  const total = inventoryData.inRotation + inventoryData.slowMoving + inventoryData.clavoUnits;

  return (
    <Card className="bg-[#111c21] border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">Estado del Inventario</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Distribución por velocidad de venta.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div className="bg-[#4caf50]" style={{ width: `${(inventoryData.inRotation / total) * 100}%` }} />
          <div className="bg-[#f59e0b]" style={{ width: `${(inventoryData.slowMoving / total) * 100}%` }} />
          <div className="bg-[#ef4444]" style={{ width: `${(inventoryData.clavoUnits / total) * 100}%` }} />
        </div>
        <div className="mt-4 space-y-2 text-[11px] uppercase font-bold text-muted-foreground">
          <div className="flex items-center justify-between italic">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4caf50]" />
              <span>En Rotación</span>
            </div>
            <span className="text-white">{inventoryData.inRotation}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span>Lento Movimiento</span>
            </div>
            <span className="text-white">{inventoryData.slowMoving}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              <span>Unidades Clavo</span>
            </div>
            <span className="text-white">{inventoryData.clavoUnits}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}