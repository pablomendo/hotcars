
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, UserCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function SmartAlerts() {
  return (
    <Card>
      <CardHeader className="pb-0 pt-2">
        <CardTitle className="text-base">Alertas Inteligentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 py-1">
        <div className="flex items-start gap-2 p-0.5">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-xs">Amarok v6 2021 bajó 12% en Pilar</p>
            <p className="text-xs text-muted-foreground" style={{fontSize: '0.65rem'}}>Hace 2 horas</p>
          </div>
          <Button variant="outline" size="sm" className="h-5 text-xs w-[80px] justify-center">Ver Detalle</Button>
        </div>
        <Separator />
        <div className="flex items-start gap-2 p-0.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-xs">Passat Gris 2012 que estas siguiendo se vendio</p>
            <p className="text-xs text-muted-foreground" style={{fontSize: '0.65rem'}}>Hace 3 horas</p>
          </div>
          <Button variant="outline" size="sm" className="h-5 text-xs w-[80px] justify-center">Buscar Otro</Button>
        </div>
        <Separator />
        <div className="flex items-start gap-2 p-0.5">
          <UserCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-xs">Al usuario Aut. Montecarlo le interesa hacer un flip con tu pickup</p>
            <p className="text-xs text-muted-foreground" style={{fontSize: '0.65rem'}}>Hace 5 horas</p>
          </div>
          <Button variant="outline" size="sm" className="h-5 text-xs w-[80px] justify-center">Contactar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
