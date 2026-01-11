import * as React from "react"

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => <div className="flex">{children}</div>
export const Sidebar = ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>
export const SidebarTrigger = () => <button>Toggle</button>
export const SidebarHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
export const SidebarContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
export const SidebarFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
export const SidebarMenu = ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>
export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <li>{children}</li>
export const SidebarMenuButton = ({ children }: { children: React.ReactNode }) => <button>{children}</button>
export const SidebarInset = ({ children }: { children: React.ReactNode }) => <main>{children}</main>
export const useSidebar = () => ({ open: true, setOpen: () => {} })
