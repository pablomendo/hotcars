'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, User, Menu, X, Plus, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userData, setUserData] = useState({ 
        name: "Cargando...", 
        avatar: null,
        plan: "Gratis"
    });
    const pathname = usePathname();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('full_name, profile_pic, plan_type')
                    .eq('auth_id', session.user.id)
                    .single();
                
                if (profile) {
                    setUserData({
                        name: profile.full_name || "Usuario",
                        avatar: profile.profile_pic || null,
                        plan: profile.plan_type ? profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1) : "Gratis"
                    });
                } else {
                    setUserData({ name: "Usuario", avatar: null, plan: "Gratis" });
                }
            }
        };
        fetchUserData();
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        setIsUserMenuOpen(false);
    }, [pathname]);

    const authRoutes = ['/register', '/login', '/register/confirm'];
    if (authRoutes.includes(pathname)) {
        return null;
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] w-full h-20 bg-[#12242e] border-b border-white/5 text-white px-6">
                <div className="h-full flex items-center max-w-[1600px] mx-auto justify-between">
                    
                    <div className="flex items-center">
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
                    </div>

                    <nav className="hidden lg:flex items-center space-x-1.5 bg-black/20 rounded-xl px-2 py-1.5 border border-white/5">
                        <NavLink href="/dashboard">Dashboard</NavLink>
                        <NavLink href="/inventario">Inventario</NavLink>
                        <NavLink href="/dashboard/web">
                            Mi Web <span className="text-[#00984a] text-[10px] ml-1">●</span>
                        </NavLink>
                        <NavLink href="/flips">Flips Compartidos</NavLink>
                        <NavLink href="/messages">Mensajes</NavLink>
                        <NavLink href="/searched">Vehículos Buscados</NavLink>
                    </nav>

                    <div className="flex items-center space-x-6 flex-shrink-0">
                        <Link
                            href="/publicar"
                            className="inline-flex items-center h-8 rounded-lg bg-[#134e4d] px-4 text-[12px] font-bold text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm border border-white/10"
                        >
                            <span className="hidden sm:inline">Publicar Unidad</span>
                            <Plus className="sm:hidden w-5 h-5 text-white/40" />
                        </Link>

                        <button className="text-slate-400 hover:text-white transition-colors p-1 relative">
                            <Bell className="w-5 h-5" />
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button 
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="w-10 h-10 rounded-full bg-[#134e4d] overflow-hidden items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity border border-white/10 flex"
                            >
                                {userData.avatar ? (
                                    <img src={userData.avatar} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl py-2 z-[110] animate-in fade-in zoom-in duration-200">
                                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                                        <p className="text-xs font-bold text-white truncate">{userData.name}</p>
                                        <p className="text-[10px] text-[#00984a]">Plan {userData.plan}</p>
                                    </div>
                                    <Link 
                                        href="/perfil"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <Settings size={16} />
                                        Setup
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
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