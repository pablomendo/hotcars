
"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';

const opportunities = [
  { id: 'suv-1', name: 'VW Nivus 2022', marketDiff: '-1500 U$S' },
  { id: 'pickup-1', name: 'RAM 1500 Laramie', marketDiff: '-2100 U$S' },
  { id: 'sedan-1', name: 'Peugeot 208 Like', marketDiff: '-800 U$S' },
  { id: 'suv-2', name: 'Toyota Corolla Cross', marketDiff: '-1800 U$S' },
];

export function RiskListings() {
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-base">Oportunidad de Compra</CardTitle>
        <CardDescription className="text-xs">Vehículos con alto margen y potencial.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 px-2 pb-2">
        <div className="space-y-0.5">
          {opportunities.map((opp, index) => {
            return (
              <React.Fragment key={opp.name}>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="font-bold text-sm p-1 text-center w-7">{index + 1}</div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">{opp.name}</p>
                    <p className="font-semibold text-emerald-500" style={{fontSize: '0.65rem'}}>{opp.marketDiff} vs Mercado</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-5 text-xs w-[80px] justify-center">Ver Detalle</Button>
                </div>
                {index < opportunities.length - 1 && <Separator className="my-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
