
"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const riskListings = [
  { name: 'Chevrolet Cruze 2016', price: 'u$S 17.000', days: 48 },
  { name: 'Ford Fiesta 2012', price: 'U$S 10.500', days: 0 }, // Assuming 0 days or should be specified, I will not show it if 0
  { name: 'Renault Sandero 2018', price: 'U$S 12.800', days: 35 },
];

export function PurchaseOpportunities() {
  return (
    <Card>
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-base">Avisos en Riesgo</CardTitle>
        <CardDescription className="text-xs">Vehículos que necesitan ajuste de precio.</CardDescription>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        <div className="space-y-1">
          {riskListings.map((listing, index) => (
            <React.Fragment key={listing.name}>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-xs leading-tight">{listing.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {listing.price} {listing.days > 0 && `- ${listing.days} dias publicado`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">Ver Detalle</Button>
                  <Button variant="destructive" size="sm" className="h-7 text-xs px-2">Bajar Precio</Button>
                </div>
              </div>
              {index < riskListings.length - 1 && <Separator className="my-1" />}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
