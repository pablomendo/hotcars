import { AppSidebar } from "../components/dashboard/app-sidebar"
import { Header } from "../components/dashboard/header"
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar"
import { OverviewStats } from "../components/dashboard/overview-stats"
import { InventoryStatus } from "../components/dashboard/inventory-status"
import { DemandRanking } from "../components/dashboard/demand-ranking"

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Dashboard" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <OverviewStats />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <InventoryStatus className="col-span-4" />
            <DemandRanking className="col-span-3" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
