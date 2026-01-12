import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export const SidebarContext = React.createContext<any>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <SidebarContext.Provider value={{}}><div className="flex min-h-svh w-full">{children}</div></SidebarContext.Provider>
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return <aside className="w-64 border-r bg-background">{children}</aside>
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-auto">{children}</div>
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-t">{children}</div>
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <nav className="p-2">{children}</nav>
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function SidebarMenuButton({ asChild, children }: any) {
  const Comp = asChild ? Slot : "button"
  return <Comp className="flex w-full items-center gap-2 p-2 hover:bg-accent">{children}</Comp>
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>
}

export function SidebarTrigger() {
  return <button className="p-2">☰</button>
}
