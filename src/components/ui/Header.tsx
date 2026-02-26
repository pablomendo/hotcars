'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, User, Menu, X, Plus, Settings, LogOut, Home, Heart } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeCategory, setActiveCategory] = useState('todas');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState({ 
        name: "Cargando...", 
        avatar: null,
        plan: "Gratis"
    });

    const categories = [
        { id: 'todas', label: 'Todas' },
        { id: 'inventory', label: 'Flips' },
        { id: 'message', label: 'Mensajes' },
        { id: 'system', label: 'Sistema' }
    ];

    const pathname = usePathname();
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false);
            
            setUnreadCount(count || 0);

            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id);

            if (activeCategory !== 'todas') {
                query = query.eq('category', activeCategory);
            }

            const { data } = await query
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(5);
            
            setNotifications(data || []);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsLoggedIn(true);
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
                fetchNotifications();
            } else {
                setIsLoggedIn(false);
            }
        };
        fetchUserData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        const channel = supabase
            .channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [pathname, activeCategory]);

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', notification.id);
            fetchNotifications();
        }

        setIsNotificationsOpen(false);

        if (notification.action_url) {
            router.push(notification.action_url);
        } else if (notification.related_entity_type && notification.related_entity_id) {
            router.push(`/${notification.related_entity_type}/${notification.related_entity_id}`);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Ahora';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
        return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    };

    const authRoutes = ['/register', '/login', '/register/confirm'];
    if (authRoutes.includes(pathname)) return null;

    return (
        <>
            {/* HEADER DESKTOP */}
            <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#12242e] border-b border-white/5 text-white px-6">

                {/* MOBILE: dos filas */}
                <div className="lg:hidden flex flex-col pt-3 pb-2 gap-2">
                    {/* Fila 1: logo centrado */}
                    <div className="flex justify-center">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={200} height={60} unoptimized className="h-8 w-auto object-contain" priority />
                        </Link>
                    </div>
                    {/* Fila 2: buscador + campanita */}
                    <div className="flex items-center gap-2 px-2 pb-1">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Buscar en HotCars..."
                                className="w-full bg-white/10 border border-white/10 rounded-xl pl-4 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-[#00984a]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) router.push(`/?marca=${encodeURIComponent(val)}`);
                                    }
                                }}
                            />
                        </div>
                        {/* Campanita mobile */}
                        <div className="relative flex-shrink-0" ref={notificationsRef}>
                            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl z-[110] animate-in fade-in zoom-in duration-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/5 flex flex-col gap-2 bg-black/20">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-bold">Notificaciones</h3>
                                            <span className="text-[10px] text-slate-400">{unreadCount} pendientes</span>
                                        </div>
                                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={(e) => { e.stopPropagation(); setActiveCategory(cat.id); }}
                                                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat.id ? 'bg-[#00984a] text-white shadow-lg shadow-[#00984a]/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
                                        {notifications.length > 0 ? (
                                            notifications.map((n, index) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotificationClick(n)}
                                                    style={{ animationDelay: `${index * 75}ms` }}
                                                    className={`p-3 rounded-lg border border-white/5 cursor-pointer hover:border-[#00984a]/30 hover:bg-[#134e4d]/10 transition-all relative animate-in slide-in-from-top-2 duration-300 fill-mode-both ${!n.is_read ? 'bg-white/[0.04] shadow-sm' : 'bg-transparent opacity-80'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${n.category === 'inventory' ? 'bg-blue-500/20 text-blue-400' : n.category === 'message' ? 'bg-[#00984a]/20 text-[#00984a]' : 'bg-slate-500/20 text-slate-400'}`}>
                                                            {n.category === 'inventory' ? 'Flip' : n.category === 'message' ? 'Mensaje' : 'Sistema'}
                                                        </span>
                                                        <p className="text-[9px] text-slate-500 font-medium">{formatRelativeDate(n.created_at)}</p>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-white mb-1 line-clamp-1">{n.title}</p>
                                                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.body}</p>
                                                    {!n.is_read && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00984a] rounded-full shadow-[0_0_8px_#00984a]" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-slate-500 text-xs">No hay notificaciones en esta categoría</div>
                                        )}
                                    </div>
                                    <Link href="/notifications" className="block w-full py-3 text-center text-[10px] font-bold text-[#00984a] hover:bg-white/5 border-t border-white/5 transition-colors uppercase tracking-wider">
                                        Ver todas
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DESKTOP: una fila */}
                <div className="hidden lg:flex h-20 items-center max-w-[1600px] mx-auto justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center">
                                <Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={200} height={60} unoptimized className="h-10 w-auto object-contain" priority />
                            </Link>
                        </div>
                    </div>

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
                                {/* Publicar Unidad */}
                                <Link href="/publicar" className="hidden lg:inline-flex items-center h-8 rounded-lg bg-[#134e4d] px-4 text-[12px] font-bold text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm border border-white/10">
                                    Publicar Unidad
                                </Link>

                                {/* Bell: solo desktop */}
                                <div className="relative hidden lg:block" ref={notificationsRef}>
                                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>
                                        )}
                                    </button>

                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl z-[110] animate-in fade-in zoom-in duration-200 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-white/5 flex flex-col gap-2 bg-black/20">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-sm font-bold">Notificaciones</h3>
                                                    <span className="text-[10px] text-slate-400">{unreadCount} pendientes</span>
                                                </div>
                                                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                    {categories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={(e) => { e.stopPropagation(); setActiveCategory(cat.id); }}
                                                            className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat.id ? 'bg-[#00984a] text-white shadow-lg shadow-[#00984a]/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                                        >
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n, index) => (
                                                        <div 
                                                            key={n.id} 
                                                            onClick={() => handleNotificationClick(n)} 
                                                            style={{ animationDelay: `${index * 75}ms` }}
                                                            className={`p-3 rounded-lg border border-white/5 cursor-pointer hover:border-[#00984a]/30 hover:bg-[#134e4d]/10 transition-all relative animate-in slide-in-from-top-2 duration-300 fill-mode-both ${!n.is_read ? 'bg-white/[0.04] shadow-sm' : 'bg-transparent opacity-80'}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${n.category === 'inventory' ? 'bg-blue-500/20 text-blue-400' : n.category === 'message' ? 'bg-[#00984a]/20 text-[#00984a]' : 'bg-slate-500/20 text-slate-400'}`}>
                                                                    {n.category === 'inventory' ? 'Flip' : n.category === 'message' ? 'Mensaje' : 'Sistema'}
                                                                </span>
                                                                <p className="text-[9px] text-slate-500 font-medium">{formatRelativeDate(n.created_at)}</p>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-white mb-1 line-clamp-1">{n.title}</p>
                                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.body}</p>
                                                            {!n.is_read && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00984a] rounded-full shadow-[0_0_8px_#00984a]" />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-slate-500 text-xs">No hay notificaciones en esta categoría</div>
                                                )}
                                            </div>
                                            <Link href="/notifications" className="block w-full py-3 text-center text-[10px] font-bold text-[#00984a] hover:bg-white/5 border-t border-white/5 transition-colors uppercase tracking-wider">
                                                Ver todas
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* User menu */}
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

            {/* Mobile menu panel — abre desde el botón Más de la barra inferior */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-0 bg-[#12242e] z-[90] p-6 flex flex-col animate-in slide-in-from-left duration-300 pt-24 pb-24 overflow-y-auto">
                    {isLoggedIn ? (
                        <>
                            {/* Bloque usuario logueado */}
                            <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl mb-6 border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-[#134e4d] overflow-hidden flex items-center justify-center border border-white/10 flex-shrink-0">
                                    {userData.avatar ? <img src={userData.avatar} alt="Usuario" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-white" />}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-white truncate">{userData.name}</p>
                                    <p className="text-[11px] text-[#00984a]">Plan {userData.plan}</p>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1 flex-1">
                                <MobileNavLink href="/dashboard" onClose={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                                <MobileNavLink href="/inventario" onClose={() => setIsMobileMenuOpen(false)}>Inventario</MobileNavLink>
                                <MobileNavLink href="/dashboard/web" onClose={() => setIsMobileMenuOpen(false)}>Mi Web</MobileNavLink>
                                <MobileNavLink href="/flips-compartidos" onClose={() => setIsMobileMenuOpen(false)}>Flips Compartidos</MobileNavLink>
                                <MobileNavLink href="/messages" onClose={() => setIsMobileMenuOpen(false)}>Mensajes</MobileNavLink>
                                <MobileNavLink href="/searched" onClose={() => setIsMobileMenuOpen(false)}>Vehículos Buscados</MobileNavLink>
                                <MobileNavLink href="/perfil" onClose={() => setIsMobileMenuOpen(false)}>Configuración</MobileNavLink>
                                <button onClick={() => { setIsMobileMenuOpen(false); router.push('/potencial-hotcars'); }} className="text-sm font-semibold px-4 py-2.5 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/5 transition-all">✦ Potencial HotCars</button>
                            </div>
                            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 mt-4 border border-red-400/20 rounded-xl"><LogOut size={16} />Cerrar sesión</button>
                        </>
                    ) : (
                        <>
                            {/* Sin sesión */}
                            <div className="flex flex-col gap-3 flex-1 justify-center">
                                <Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={160} height={48} unoptimized className="h-10 w-auto object-contain mb-2 opacity-60 mx-auto" />
                                <p className="text-slate-400 text-sm font-medium text-center mb-4">Ingresá o registrate para acceder a todas las funciones</p>
                                <button onClick={() => { setIsMobileMenuOpen(false); router.push('/potencial-hotcars'); }} className="w-full py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl text-center text-sm border border-white/20 hover:bg-white/20 transition-all">✦ Potencial HotCars</button>
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 bg-[#134e4d] text-white font-black uppercase tracking-widest rounded-xl text-center text-sm">Iniciar Sesión</Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl text-center text-sm border border-white/20">Registrarse</Link>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ✅ Barra inferior mobile — solo visible en mobile (lg:hidden) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#12242e] border-t border-white/10 flex items-center justify-around px-2 py-2">

                {isLoggedIn ? (
                    <>
                        {/* Inicio */}
                        <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <Home size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Inicio</span>
                        </Link>

                        {/* Favoritos */}
                        <Link href="/favoritos" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <Heart size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Favoritos</span>
                        </Link>

                        {/* Botón + central */}
                        <button
                            onClick={() => router.push('/publicar')}
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#134e4d] border-4 border-[#12242e] -mt-6 shadow-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus size={26} className="text-white" />
                        </button>

                        {/* Dashboard */}
                        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <Settings size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Panel</span>
                        </Link>

                        {/* Más / Cerrar */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            <span className="text-[10px] font-bold uppercase tracking-wide">{isMobileMenuOpen ? 'Cerrar' : 'Más'}</span>
                        </button>
                    </>
                ) : (
                    <>
                        {/* Inicio */}
                        <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <Home size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Inicio</span>
                        </Link>

                        {/* Registrarse */}
                        <Link href="/register" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <User size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Registrar</span>
                        </Link>

                        {/* Botón + central → login */}
                        <button
                            onClick={() => router.push('/login')}
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#134e4d] border-4 border-[#12242e] -mt-6 shadow-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus size={26} className="text-white" />
                        </button>

                        {/* Ingresar */}
                        <Link href="/login" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            <LogOut size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Ingresar</span>
                        </Link>

                        {/* Más / Cerrar */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            <span className="text-[10px] font-bold uppercase tracking-wide">{isMobileMenuOpen ? 'Cerrar' : 'Más'}</span>
                        </button>
                    </>
                )}
            </nav>

        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {children}
        </Link>
    );
}

function MobileNavLink({ href, children, onClose }: { href: string; children: React.ReactNode; onClose?: () => void }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} onClick={onClose} className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#134e4d] text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
            {children}
        </Link>
    );
}