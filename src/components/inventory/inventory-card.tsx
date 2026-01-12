"use client";

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Repeat, AlertTriangle, Pencil, Pause, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function InventoryCard({ item }: any) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);

  const salePrice = Number(item.salePrice);
  const purchasePrice = Number(item.purchasePrice);

  let potentialGain = salePrice - purchasePrice;
  if (item.type === 'Flip compartido') {
    potentialGain = potentialGain / 2;
  }

  if (!Number.isFinite(potentialGain) || potentialGain <= 0) {
    potentialGain = 0;
  }

  return (
    <Card className="bg-[#111c21] border-border/40 overflow-hidden flex h-32">
      <div className="relative w-1/3 bg-muted/20">
        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        <Badge 
          className={`absolute bottom-1 left-1 text-[10px] h-4 border-none ${
            item.type === 'Propia' ? 'bg-[#15803d] text-white' : 'bg-[#1d4ed8] text-white'
          }`}
        >
          {item.type === 'Propia' ? <Car className="mr-1 h-3 w-3" /> : <Repeat className="mr-1 h-3 w-3" />}
          {item.type}
        </Badge>
      </div>

      <div className="w-2/3 p-3 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm truncate text-white uppercase">{item.name}</h3>
            <p className="text-[11px] text-muted-foreground uppercase">
              {item.kms?.toLocaleString('es-AR')} KM
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/10"><Pause className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/10"><Check className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="flex justify-between items-end mb-1">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Ganancia Potencial:</p>
            <p className="font-bold text-[#4caf50] text-sm leading-none">+{formatCurrency(potentialGain)}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-[12px] font-bold text-white">PV: {formatCurrency(salePrice)}</p>
            <p className="text-[10px] text-muted-foreground">PC: {formatCurrency(purchasePrice)}</p>
          </div>
        </div>

        {item.status?.name === 'En riesgo' && (
          <Badge className="absolute bottom-2 right-2 bg-[#92400e] text-white border-none text-[10px] h-5">
            <AlertTriangle className="mr-1 h-3 w-3" />
            En riesgo +45d
          </Badge>
        )}
      </div>
    </Card>
  );
}