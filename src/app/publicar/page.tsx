import { AppSidebar } from "../../components/dashboard/app-sidebar"
import { Header } from "../../components/dashboard/header"
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar"

export default function PublicarPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Publicar Vehículo" />
        <div className="p-4">
          <h1 className="text-2xl font-bold">Próximamente: Formulario de publicación</h1>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
