"use client";

import {
  Bell,
  Car,
  LayoutDashboard,
  Settings,
  Users,
  FileSearch,
} from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "../ui/sidebar";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center p-4">
        <Image
          src="/Logo_Hotcars_blanco.png"
          alt="HotCars Logo"
          width={140}
          height={32}
        />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/"}
              onClick={() => router.push("/")}
            >
              <LayoutDashboard />
              Resumen
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/inventory")}
              onClick={() => router.push("/inventory")}
            >
              <Car />
              Inventario
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton>
              <Users />
              Mensajes
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton>
              <FileSearch />
              Vehículos Requeridos
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton>
              <Bell />
              Alertas Inteligentes
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings />
              Configuración
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-card/50 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold">John Doe</p>
            <p className="truncate text-xs text-muted-foreground">
              john.doe@example.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
