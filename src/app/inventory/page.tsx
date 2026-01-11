"use client";

import { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { Header } from '@/components/dashboard/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { InventoryCard } from '@/components/inventory/inventory-card';
import { placeholderInventory } from '@/lib/placeholder-data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('Todos');
  const tabs = ['Todos', 'Propios', 'Flip Compartido', 'En Riesgo'];

  const filteredData = (tab: string) => {
    switch (tab) {
      case 'Propios':
        return placeholderInventory.filter(i => i.type === 'Propia');
      case 'Flip Compartido':
        return placeholderInventory.filter(i => i.type === 'Flip compartido');
      case 'En Riesgo':
        return placeholderInventory.filter(i => i.status?.name === 'En riesgo');
      case 'Todos':
      default:
        return placeholderInventory;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
              <TabsList className="grid w-full grid-cols-4 gap-2 mb-4">
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="hover:bg-[#13333e] text-white transition-colors rounded-md"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-grow">
                {tabs.map(tab => (
                  <TabsContent key={tab} value={tab} className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredData(tab).map(item => (
                        <InventoryCard key={item.id} item={item} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
              
              <div className="flex items-center justify-center mt-auto p-4">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm mx-4">1 / 4</span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}