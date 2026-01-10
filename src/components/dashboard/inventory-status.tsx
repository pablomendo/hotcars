
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InventoryStatus() {
  const inventoryData = {
    inRotation: 55,
    slowMoving: 30,
    keyCars: 15,
  };
  const total = inventoryData.inRotation + inventoryData.slowMoving + inventoryData.keyCars;

  return (
    <Card>
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-base">Estado del Inventario</CardTitle>
        <CardDescription className="text-xs">Resumen visual del inventario actual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-3.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-[hsl(var(--chart-3))]"
            style={{ width: `${(inventoryData.inRotation / total) * 100}%` }}
            title={`En Rotación: ${inventoryData.inRotation}%`}
          />
          <div
            className="bg-[hsl(var(--chart-4))]"
            style={{ width: `${(inventoryData.slowMoving / total) * 100}%` }}
            title={`Lento Movimiento: ${inventoryData.slowMoving}%`}
          />
          <div
            className="bg-[hsl(var(--destructive))]"
            style={{ width: `${(inventoryData.keyCars / total) * 100}%` }}
            title={`Unidades Clavo: ${inventoryData.keyCars}%`}
          />
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-3))]" />
              <span>En Rotación</span>
            </div>
            <span className="font-medium text-foreground">{inventoryData.inRotation}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" />
              <span>Lento Movimiento</span>
            </div>
            <span className="font-medium text-foreground">{inventoryData.slowMoving}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]" />
              <span>Unidades Clavo</span>
            </div>
            <span className="font-medium text-foreground">{inventoryData.keyCars}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
