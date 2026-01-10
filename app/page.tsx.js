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
import { SidebarProvider } from '@/components/ui/sidebar';
import { SalesByTypeChart } from '@/components/dashboard/sales-by-type-chart';
import { PublishNewUnit } from '@/components/dashboard/publish-new-unit';
import { CommunityStrength } from '@/components/dashboard/community-strength';
import { EarningsPotential } from '@/components/dashboard/earnings-potential';

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-1 md:p-2 lg:p-3">
            <div className="grid gap-2">
              <OverviewStats />
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <EarningsPotential />
                  <PublishNewUnit />
                  <DemandRanking />
                  <RiskListings />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <SalesByTypeChart />
                    <CommunityStrength />
                  </div>
                  <InventoryStatus />
                  <PurchaseOpportunities />
                  <SmartAlerts />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="">
                  <SalesTrendChart />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}