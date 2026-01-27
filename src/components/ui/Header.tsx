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

    // CORRECCIÓN: Manejo de scroll más limpio para no romper componentes largos
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            // Quitamos el forzado de documentElement que colapsa acordeones
            document.body.style.overflow = ''; 
        }
        
        // Limpieza al desmontar el componente
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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
                        <Link href="/dashboard" className="flex items-center">
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
                            
                            <div className="pt-4">
                                <div className="flex items-center gap-3 bg-black/30 rounded-xl p-4 border border-white/5">
                                    <Search className="w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar unidades..."
                                        className="bg-transparent text-sm text-white focus:outline-none w-full font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/10">
                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#134e4d] flex items-center justify-center text-white border border-white/10">
                                        <User size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{userProfile.name}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00984a]">Plan {userProfile.plan}</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
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