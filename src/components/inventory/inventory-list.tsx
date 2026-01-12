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
      default:
        return inventoryData;
    }
  };

  return (
    <Tabs defaultValue="Todos" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-[#1e293b]/50 p-1 mb-6 h-12 rounded-lg border border-white/5">
        {filters.map((f) => (
          <TabsTrigger 
            key={f} 
            value={f} 
            className="text-xs font-semibold data-[state=active]:bg-[#111c21] data-[state=active]:text-white rounded-md transition-all flex items-center gap-2"
          >
            {f} {f === 'En Riesgo' && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {filters.map((filter) => (
        <TabsContent key={filter} value={filter}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {filteredData(filter).map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}