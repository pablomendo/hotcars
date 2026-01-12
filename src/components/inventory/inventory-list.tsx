"use client";

import { AlertTriangle } from 'lucide-react';
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
      <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 mb-4 h-auto border-b border-white/10">
        <TabsTrigger 
          value="Todos" 
          className="text-sm data-[state=active]:bg-[#111c21] data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-[#4caf50] pb-2"
        >
          Todos
        </TabsTrigger>
        <TabsTrigger 
          value="Propios" 
          className="text-sm data-[state=active]:bg-[#111c21] data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-[#4caf50] pb-2"
        >
          Propios
        </TabsTrigger>
        <TabsTrigger 
          value="Flip Compartido" 
          className="text-sm data-[state=active]:bg-[#111c21] data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-[#4caf50] pb-2"
        >
          Flip Compartido
        </TabsTrigger>
        <TabsTrigger 
          value="En Riesgo" 
          className="text-sm data-[state=active]:bg-[#111c21] data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-orange-500 pb-2 flex items-center gap-2"
        >
          En Riesgo <AlertTriangle className="h-4 w-4 text-orange-500" />
        </TabsTrigger>
      </TabsList>
      
      {filters.map((filter) => (
        <TabsContent key={filter} value={filter} className="mt-6">
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