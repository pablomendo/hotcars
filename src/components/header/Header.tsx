'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationsPanel from './NotificationsPanel';
import MobilePanelMenu from './MobilePanelMenu';
import MobileBottomNav from './MobileBottomNav';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {children}
        </Link>
    );
}

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeCategory, setActiveCategory] = useState('todas');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [userData, setUserData] = useState({ name: "Cargando...", avatar: null, plan: "Gratis" });

    const pathname = usePathname();
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_read', false);
        setUnreadCount(count || 0);
        let query = supabase.from('notifications').select('*').eq('user_id', session.user.id);
        if (activeCategory !== 'todas') query = query.eq('category', activeCategory);
        const { data } = await query.order('priority', { ascending: false }).order('created_at', { ascending: false }).limit(5);
        setNotifications(data || []);
    };

    useEffect(() => {
        setIsMounted(true);
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsLoggedIn(true);
                const { data: profile } = await supabase.from('usuarios').select('full_name, profile_pic, plan_type').eq('auth_id', session.user.id).single();
                if (profile) {
                    setUserData({ name: profile.full_name || "Usuario", avatar: profile.profile_pic || null, plan: profile.plan_type ? profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1) : "Gratis" });
                } else {
                    setUserData({ name: "Usuario", avatar: null, plan: "Gratis" });
                }
                fetchNotifications();
            } else {
                setIsLoggedIn(false);
            }
        };
        fetchUserData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setIsLoggedIn(!!session?.user);
        });

        const channel = supabase.channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
            .subscribe();

        return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
    }, [pathname, activeCategory]);

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notification.id);
            fetchNotifications();
        }
        setIsNotificationsOpen(false);
        if (notification.action_url) router.push(notification.action_url);
        else if (notification.related_entity_type && notification.related_entity_id) router.push(`/${notification.related_entity_type}/${notification.related_entity_id}`);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const formatRelativeDate = (dateString: string) => {
        const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (diffInSeconds < 60) return 'Ahora';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
        return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#12242e] border-b border-white/5 text-white px-6">

                {/* MOBILE: dos filas */}
                <div className="lg:hidden flex flex-col pt-3 pb-2 gap-2">
                    <div className="flex justify-center">
                        <Link href="/"><Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={200} height={60} unoptimized className="h-8 w-auto object-contain" priority /></Link>
                    </div>
                    <div className="flex items-center gap-2 px-2 pb-1">
                        <div className="flex-1 relative">
                            <input type="text" placeholder="Buscar en HotCars..." className="w-full bg-white/10 border border-white/10 rounded-xl pl-4 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-[#00984a]"
                                onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value.trim(); if (val) router.push(`/?marca=${encodeURIComponent(val)}`); } }}
                            />
                        </div>
                        <div className="relative flex-shrink-0" ref={notificationsRef}>
                            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>}
                            </button>
                            {isNotificationsOpen && <NotificationsPanel notifications={notifications} unreadCount={unreadCount} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onNotificationClick={handleNotificationClick} formatRelativeDate={formatRelativeDate} />}
                        </div>
                    </div>
                </div>

                {/* DESKTOP */}
                <div className="hidden lg:flex h-20 items-center max-w-[1600px] mx-auto justify-between">
                    <Link href="/"><Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={200} height={60} unoptimized className="h-10 w-auto object-contain" priority /></Link>

                    <nav className="hidden lg:flex items-center space-x-1.5 bg-black/20 rounded-xl px-2 py-1.5 border border-white/5">
                        {isLoggedIn ? (
                            <>
                                <NavLink href="/dashboard">Dashboard</NavLink>
                                <NavLink href="/inventario">Inventario</NavLink>
                                <NavLink href="/dashboard/web">Mi Web <span className="text-[#00984a] text-[10px] ml-1">●</span></NavLink>
                                <NavLink href="/flips-compartidos">Flips Compartidos</NavLink>
                                <NavLink href="/messages">Mensajes</NavLink>
                                <NavLink href="/searched">Vehículos Buscados</NavLink>
                            </>
                        ) : (
                            <>
                                <button onClick={() => router.push('/potencial-hotcars')} className="text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5">Potencial HotCars</button>
                                <Link href="/login" className="text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5">Iniciar Sesión</Link>
                                <Link href="/register" className="text-[12px] font-bold px-4 py-1.5 rounded-lg transition-all duration-200 bg-[#134e4d] text-white hover:opacity-90">Registrarse</Link>
                            </>
                        )}
                    </nav>

                    <div className="flex items-center space-x-6 flex-shrink-0">
                        {isLoggedIn && (
                            <>
                                <Link href="/publicar" className="hidden lg:inline-flex items-center h-8 rounded-lg bg-[#134e4d] px-4 text-[12px] font-bold text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm border border-white/10">Publicar Unidad</Link>
                                <div className="relative hidden lg:block" ref={notificationsRef}>
                                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>}
                                    </button>
                                    {isNotificationsOpen && <NotificationsPanel notifications={notifications} unreadCount={unreadCount} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onNotificationClick={handleNotificationClick} formatRelativeDate={formatRelativeDate} />}
                                </div>
                                <div className="relative hidden lg:block" ref={userMenuRef}>
                                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-10 h-10 rounded-full bg-[#134e4d] overflow-hidden items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity border border-white/10 flex">
                                        {userData.avatar ? <img src={userData.avatar} alt="Usuario" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl py-2 z-[110] animate-in fade-in zoom-in duration-200">
                                            <div className="px-4 py-2 border-b border-white/5 mb-1">
                                                <p className="text-xs font-bold text-white truncate">{userData.name}</p>
                                                <p className="text-[10px] text-[#00984a]">Plan {userData.plan}</p>
                                            </div>
                                            <Link href="/perfil" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><Settings size={16} />Configuración</Link>
                                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"><LogOut size={16} />Cerrar sesión</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {isMounted && isMobileMenuOpen && (
                <MobilePanelMenu isLoggedIn={isLoggedIn} userData={userData} onClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
            )}

            {isMounted && (
                <MobileBottomNav isLoggedIn={isLoggedIn} isMobileMenuOpen={isMobileMenuOpen} onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            )}
        </>
    );
}