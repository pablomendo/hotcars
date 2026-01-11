"use client";

import { AlertTriangle, Car } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryCard } from './inventory-card';
import type { InventoryItem } from '@/types/inventory';
import { placeholderInventory } from '@/lib/placeholder-data';

export function InventoryList() {
  const inventoryData: InventoryItem[] = placeholderInventory;

  const filters = ['Todos', 'Propios', 'Flip Compartido', 'En Riesgo'];

  const filteredData = (filter: string): InventoryItem[] => {
    switch (filter) {
      case 'Propios':
        return inventoryData.filter((item) => item.type === 'Propia');
      case 'Flip Compartido':
        return inventoryData.filter((item) => item.type === 'Flip compartido');
      case 'En Riesgo':
        return inventoryData.filter((item) => item.status.name === 'En riesgo');
      case 'Todos':
      default:
        return inventoryData;
    }
  };

  return (
    <Tabs defaultValue="Todos" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 mb-4 h-auto">
        <TabsTrigger value="Todos" className="text-sm data-[state=active]:bg-card/80 data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent">Todos</TabsTrigger>
        <TabsTrigger value="Propios" className="text-sm data-[state=active]:bg-card/80 data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent">Propios</TabsTrigger>
        <TabsTrigger value="Flip Compartido" className="text-sm data-[state=active]:bg-card/80 data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent">Flip Compartido</TabsTrigger>
        <TabsTrigger value="En Riesgo" className="text-sm data-[state=active]:bg-card/80 data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent flex items-center gap-2">
            En Riesgo <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </TabsTrigger>
      </TabsList>
      
      {filters.map((filter) => (
        <TabsContent key={filter} value={filter}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredData(filter).map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
