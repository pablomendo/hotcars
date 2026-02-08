'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Bell, User, Menu, X, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const userProfile = {
        name: "Benito",
        plan: "Pro", 
        avatar: null
    };

    // 1. TODOS los Hooks se ejecutan siempre al principio
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = ''; 
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // 2. Lógica de ocultamiento DESPUÉS de los hooks
    const authRoutes = ['/register', '/login', '/register/confirm'];
    if (authRoutes.includes(pathname)) {
        return null;
    }

    // 3. Renderizado normal
    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] w-full h-20 bg-[#12242e] border-b border-white/5 text-white px-6">
                <div className="h-full flex items-center max-w-[1600px] mx-auto">
                    
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden mr-4 text-slate-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <Image 
                                src="/logo_hotcars_blanco.png" 
                                alt="HotCars Logo" 
                                width={200} 
                                height={60} 
                                unoptimized 
                                className="h-10 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </div>

                    <nav className="hidden lg:flex items-center ml-auto mr-12 space-x-1.5 bg-black/20 rounded-xl px-2 py-1.5 border border-white/5">
                        <NavLink href="/dashboard">Dashboard</NavLink>
                        <NavLink href="/inventario">Inventario</NavLink>
                        <NavLink href="/dashboard/web">
                            Mi Web <span className="text-[#00984a] text-[10px] ml-1">●</span>
                        </NavLink>
                        <NavLink href="/flips">Flips Compartidos</NavLink>
                        <NavLink href="/messages">Mensajes</NavLink>
                        <NavLink href="/searched">Vehículos Buscados</NavLink>
                    </nav>

                    <div className="flex items-center space-x-4 ml-auto lg:ml-0 flex-shrink-0">
                        <Link
                            href="/publicar"
                            className="inline-flex items-center h-8 rounded-lg bg-[#134e4d] px-4 text-[12px] font-bold text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm border border-white/10"
                        >
                            <span className="hidden sm:inline">Publicar Unidad</span>
                            <Plus className="sm:hidden w-5 h-5 text-white/40" />
                        </Link>

                        <div className="hidden sm:flex items-center h-9 gap-2 rounded-lg bg-black/30 px-3 border border-white/5">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar…"
                                className="bg-transparent text-xs text-white focus:outline-none w-24 xl:w-32 font-medium"
                            />
                        </div>

                        <button className="text-slate-400 hover:text-white transition-colors p-1">
                            <Bell className="w-5 h-5" />
                        </button>

                        <button className="hidden sm:flex w-10 h-10 rounded-full bg-[#134e4d] items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity border border-white/10">
                            <User className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 top-20 bg-[#12242e] z-[90] p-6 flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="flex flex-col space-y-4 flex-1">
                            <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
                            <MobileNavLink href="/inventario">Inventario</MobileNavLink>
                            <MobileNavLink href="/dashboard/web">Mi Web</MobileNavLink>
                            <MobileNavLink href="/flips">Flips Compartidos</MobileNavLink>
                            <MobileNavLink href="/messages">Mensajes</MobileNavLink>
                            <MobileNavLink href="/searched">Vehículos Buscados</MobileNavLink>
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`text-lg font-bold p-4 rounded-xl transition-all
                ${isActive ? 'bg-[#134e4d] text-white shadow-lg' : 'bg-black/20 text-slate-300'}
            `}
        >
            {children}
        </Link>
    );
}