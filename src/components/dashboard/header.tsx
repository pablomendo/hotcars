"use client";

import { Bell, Search, Plus, User, Menu, LayoutDashboard, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublishModal } from "@/hooks/use-publish-modal";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Header() {
  const { setOpen } = usePublishModal();

  // Componente interno para los links, se usa en Desktop y en el menú del Celular
  const NavLinks = () => (
    <>
      <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 px-3 justify-start lg:justify-center">
        <LayoutDashboard className="h-4 w-4 text-[#4caf50]" />
        <span className="text-sm font-medium">Dashboard</span>
      </Button>
      <Button variant="ghost" className="text-slate-400 hover:bg-white/10 gap-2 px-3 justify-start lg:justify-center">
        <Car className="h-4 w-4" />
        <span className="text-sm font-medium">Inventario</span>
      </Button>
      <Button variant="ghost" className="text-slate-400 hover:bg-white/10 gap-2 px-3 justify-start lg:justify-center">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">Clientes</span>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0f172a] backdrop-blur-md">
      <div className="flex h-16 items-center px-4 md:px-8 gap-4 max-w-[1440px] mx-auto">
        
        {/* LADO IZQUIERDO: Menú Hamburguesa (Solo Móvil) */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0f172a] border-white/10 text-white">
              <SheetTitle className="text-white border-b border-white/5 pb-4">Menú HotCars</SheetTitle>
              <nav className="flex flex-col gap-4 mt-6">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* LOGO */}
        <div className="flex items-center gap-2 mr-4">
          <h1 className="font-headline text-xl font-bold tracking-tight text-white">
            Hot<span className="text-[#4caf50]">Cars</span>
          </h1>
        </div>

        {/* NAVEGACIÓN PRINCIPAL (Solo Desktop) */}
        <nav className="hidden lg:flex items-center gap-2">
          <NavLinks />
        </nav>

        {/* BUSCADOR CENTRAL */}
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <div className="relative w-full group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#4caf50] transition-colors" />
            <Input
              type="search"
              placeholder="Buscar unidad..."
              className="w-full bg-[#111c21] border-white/10 pl-10 h-10 rounded-full focus-visible:ring-1 focus-visible:ring-[#4caf50] text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-2 md:gap-4">
          
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#4caf50] hover:bg-[#4caf50]/90 text-white font-bold rounded-full px-2 sm:px-5 h-9"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Publicar</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative rounded-full text-slate-400 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0f172a]" />
          </Button>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white leading-none">Pablo Ariel</span>
              <span className="text-[10px] uppercase text-[#4caf50] font-bold">Admin</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-[#111c21] border border-white/10 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}