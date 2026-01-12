import { AppSidebar } from "../../components/dashboard/app-sidebar"
import { Header } from "../../components/dashboard/header"
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar"
import { InventoryCard } from "../../components/inventory/inventory-card"
import { placeholderData } from "../../lib/placeholder-data"

export default function InventoryPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Inventario" />
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {placeholderData.cars.map((car: any) => (
              <InventoryCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
