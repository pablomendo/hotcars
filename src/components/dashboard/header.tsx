"use client";

import { Bell, Search, Plus, User, Menu, LayoutDashboard, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublishModal } from "@/hooks/use-publish-modal";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Header() {
  const { setOpen } = usePublishModal();

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
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0f172a]">
      <div className="flex h-16 items-center px-4 md:px-8 gap-4 max-w-[1440px] mx-auto">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0f172a] border-white/10 text-white">
              <SheetTitle className="text-white border-b border-white/5 pb-4 text-left uppercase tracking-widest text-xs">
                HotCars Menu
              </SheetTitle>
              <nav className="flex flex-col gap-4 mt-6">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <h1 className="font-headline text-xl font-black tracking-tighter text-white">
            HOT<span className="text-[#4caf50]">CARS</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          <NavLinks />
        </nav>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center max-w-md mx-auto px-4">
          <div className="relative w-full group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#4caf50] transition-colors" />
            <Input 
              type="search" 
              placeholder="Buscar por marca, modelo o cliente..." 
              className="w-full bg-[#111c21] border-white/10 pl-10 h-10 rounded-full text-white focus-visible:ring-[#4caf50] focus-visible:border-[#4caf50] transition-all" 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setOpen(true)} 
            className="bg-[#4caf50] hover:bg-[#4caf50]/90 text-white font-bold rounded-full px-5 h-9 shadow-lg shadow-[#4caf50]/10"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Publicar</span>
          </Button>
          
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative rounded-full text-slate-400 hover:text-white hover:bg-white/5">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-[1px] bg-white/5 mx-1" />
            <div className="h-9 w-9 rounded-full bg-[#111c21] border border-white/10 flex items-center justify-center cursor-pointer hover:border-[#4caf50] transition-colors">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}