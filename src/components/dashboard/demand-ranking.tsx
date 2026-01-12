
"use client";

import { useState } from 'react';
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Flame } from "lucide-react";

const demandData = {
  Autos: [
    { rank: 1, model: 'Peugeot 208', score: 95, fires: 5 },
    { rank: 2, model: 'Fiat Cronos', score: 92, fires: 5 },
    { rank: 3, model: 'Toyota Yaris', score: 88, fires: 4 },
    { rank: 4, model: 'Toyota Corolla', score: 86, fires: 3 },
    { rank: 5, model: 'Chevrolet Onix', score: 85, fires: 3 },
  ],
  Pickups: [
    { rank: 1, model: 'Toyota Hilux', score: 98, fires: 5 },
    { rank: 2, model: 'Ford Ranger', score: 96, fires: 5 },
    { rank: 3, model: 'VW Amarok', score: 94, fires: 4 },
    { rank: 4, model: 'Nissan Frontier', score: 89, fires: 4 },
    { rank: 5, model: 'Chevrolet S10', score: 86, fires: 3 },
  ],
  SUVs: [
    { rank: 1, model: 'Toyota Corolla Cross', score: 93, fires: 5 },
    { rank: 2, model: 'VW Taos', score: 90, fires: 4 },
    { rank: 3, model: 'Chevrolet Tracker', score: 87, fires: 4 },
    { rank: 4, model: 'Jeep Renegade', score: 84, fires: 3 },
    { rank: 5, model: 'Nissan Kicks', score: 82, fires: 2 },
  ],
  Utilitarios: [
    { rank: 1, model: 'Renault Kangoo', score: 91, fires: 4 },
    { rank: 2, model: 'Peugeot Partner', score: 88, fires: 4 },
    { rank: 3, model: 'Citroën Berlingo', score: 85, fires: 3 },
    { rank: 4, model: 'Fiat Fiorino', score: 82, fires: 2 },
    { rank: 5, model: 'Mercedes-Benz Sprinter', score: 80, fires: 2 },
  ],
};

const FireRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Flame
        key={i}
        className={`h-3.5 w-3.5 ${i < count ? 'text-orange-500 fill-orange-400' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ))}
  </div>
);

type VehicleType = keyof typeof demandData;

export function DemandRanking() {
  const [activeTab, setActiveTab] = useState<VehicleType>('Pickups');

  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-base">Ranking de Demanda por Tipo</CardTitle>
        <CardDescription className="text-xs">Top 5 modelos con mayor oportunidad de venta.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Pickups" onValueChange={(value) => setActiveTab(value as VehicleType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="Autos" className="text-xs">Autos</TabsTrigger>
            <TabsTrigger value="Pickups" className="text-xs">Pickups</TabsTrigger>
            <TabsTrigger value="SUVs" className="text-xs">SUVs</TabsTrigger>
            <TabsTrigger value="Utilitarios" className="text-xs">Utilitarios</TabsTrigger>
          </TabsList>
          {Object.keys(demandData).map((key) => {
            const vehicleType = key as VehicleType;
            return (
              <TabsContent key={vehicleType} value={vehicleType}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] p-0.5 text-xs">#</TableHead>
                      <TableHead className="p-0.5 text-xs">Modelo</TableHead>
                      <TableHead className="p-0.5 text-xs">Demanda</TableHead>
                      <TableHead className="text-right p-0.5 text-xs">Oportunidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandData[vehicleType].map((vehicle) => (
                      <TableRow key={vehicle.model}>
                        <TableCell className="font-bold text-base p-0.5 align-middle">{vehicle.rank}</TableCell>
                        <TableCell className="font-medium p-0.5 align-middle text-xs">
                           {vehicle.model}
                        </TableCell>
                        <TableCell className="p-0.5 align-middle">
                          <FireRating count={vehicle.fires} />
                        </TableCell>
                        <TableCell className="text-right p-0.5 align-middle">
                          <Badge variant={vehicle.score > 90 ? "destructive" : vehicle.score > 85 ? "secondary" : "outline"} className="text-xs font-bold">
                            {vehicle.score}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
