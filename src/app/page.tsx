"use client";

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DemandRanking } from '@/components/dashboard/demand-ranking';
import { Header } from '@/components/dashboard/header';
import { InventoryStatus } from '@/components/dashboard/inventory-status';
import { OverviewStats } from '@/components/dashboard/overview-stats';
import { PurchaseOpportunities } from '@/components/dashboard/purchase-opportunities';
import { RiskListings } from '@/components/dashboard/risk-listings';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { SmartAlerts } from '@/components/dashboard/smart-alerts';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SalesByTypeChart } from '@/components/dashboard/sales-by-type-chart';
import { PublishNewUnit } from '@/components/dashboard/publish-new-unit';
import { CommunityStrength } from '@/components/dashboard/community-strength';
import { EarningsPotential } from '@/components/dashboard/earnings-potential';

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar Lateral */}
        <AppSidebar />
        
        {/* Contenedor Principal */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          
          {/* Header de ancho total y fijo arriba */}
          <Header />
          
          {/* Área de Contenido con Scroll */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
              
              {/* Stats Superiores (Autos Activos, Flips, etc) */}
              <OverviewStats />

              {/* Grid Principal de dos columnas */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                
                {/* Columna Izquierda (Ancha) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <EarningsPotential />
                  <PublishNewUnit />
                  <DemandRanking />
                  <RiskListings />
                </div>

                {/* Columna Derecha (Estrecha) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SalesByTypeChart />
                    <CommunityStrength />
                  </div>
                  <InventoryStatus />
                  <PurchaseOpportunities />
                  <SmartAlerts />
                </div>

              </div>

              {/* Gráfico de Tendencia inferior */}
              <div className="w-full">
                <SalesTrendChart />
              </div>

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}