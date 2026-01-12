"use client";

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Repeat, AlertTriangle, Pencil, Pause, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function InventoryCard({ item }: any) {
  // Configurado a USD para coherencia con el Dashboard
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);

  const salePrice = Number(item.salePrice);
  const purchasePrice = Number(item.purchasePrice);

  // Lógica de Ganancia Real
  let potentialGain = salePrice - purchasePrice;
  if (item.type === 'Flip compartido') {
    potentialGain = potentialGain / 2;
  }

  // Protección contra números negativos o errores
  if (!Number.isFinite(potentialGain) || potentialGain <= 0) {
    potentialGain = 0;
  }

  return (
    <Card className="bg-[#111c21] border-white/5 overflow-hidden flex h-32 relative">
      {/* Imagen con Badge de Tipo */}
      <div className="relative w-1/3 bg-muted/20">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />
        <Badge
          className={`absolute bottom-1 left-1 text-[10px] border-none px-1.5 h-5 ${
            item.type === 'Propia'
              ? 'bg-[#15803d] text-white'
              : 'bg-[#1d4ed8] text-white'
          }`}
        >
          {item.type === 'Propia' ? <Car className="mr-1 h-3 w-3" /> : <Repeat className="mr-1 h-3 w-3" />}
          <span className="ml-1 uppercase">{item.type}</span>
        </Badge>
      </div>

      {/* Info y Precios */}
      <div className="w-2/3 p-3 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm text-white truncate uppercase tracking-tight">
              {item.name}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              {item.kms?.toLocaleString('es-AR')} KM
            </p>
          </div>

          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bloque de Dinero */}
        <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-auto">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold leading-none mb-1 text-[#4caf50]">Ganancia Est.</p>
            <p className="font-bold text-[#4caf50] text-sm leading-none">
              +{formatCurrency(potentialGain)}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-[11px] font-bold text-white leading-none mb-1">
              PV: {formatCurrency(salePrice)}
            </p>
            <p className="text-[9px] text-muted-foreground leading-none">
              PC: {formatCurrency(purchasePrice)}
            </p>
          </div>
        </div>

        {/* Alerta de Riesgo */}
        {item.status?.name === 'En riesgo' && (
          <div className="absolute top-2 right-2">
            <div className="bg-orange-600/20 text-orange-500 p-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}