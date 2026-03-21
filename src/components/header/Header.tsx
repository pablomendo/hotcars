'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, User, Settings, LogOut, Heart, Car, MapPin, Trash2, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationsPanel from './NotificationsPanel';
import MobilePanelMenu from './MobilePanelMenu';
import MobileBottomNav from './MobileBottomNav';

function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className={`relative text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 ${isActive ? 'bg-[#134e4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {children}
            {badge && badge > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full text-[8px] font-black bg-[#00984a] text-white">
                    {badge > 9 ? '+9' : badge}
                </span>
            ) : null}
        </Link>
    );
}

function FavoritesPanel({ favorites, onRemove, onNavigate, removing, isMobile = false }: {
    favorites: any[];
    onRemove: (favId: string, autoId: string) => void;
    onNavigate: (autoId: string) => void;
    removing: string | null;
    isMobile?: boolean;
}) {
    return (
        <div className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-80 bg-[#1a2e38] border border-white/10 rounded-xl shadow-xl z-[110] animate-in fade-in zoom-in duration-200 overflow-hidden`}>
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Favoritos</h3>
                <span className="text-[10px] text-slate-400">{favorites.length} guardado{favorites.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
                {favorites.length > 0 ? favorites.map((f) => (
                    <div key={f.id} className="flex gap-3 p-2 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer" onClick={() => onNavigate(f.auto.id)}>
                            {f.auto.fotos?.[0]
                                ? <img src={f.auto.fotos[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Car size={18} className="text-slate-600" /></div>
                            }
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate(f.auto.id)}>
                            <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{f.auto.marca} {f.auto.modelo}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{f.auto.version}</p>
                            <div className="flex items-center gap-1 text-slate-500 text-[9px] mt-0.5">
                                <MapPin size={8} />{f.auto.localidad}
                            </div>
                            <p className="text-[12px] font-black text-white mt-0.5">
                                {f.auto.moneda === 'USD' ? 'U$S' : '$'} {Number(f.auto.pv).toLocaleString('de-DE')}
                            </p>
                        </div>
                        <button
                            onClick={() => onRemove(f.id, f.auto.id)}
                            disabled={removing === f.auto.id}
                            className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 self-center"
                        >
                            {removing === f.auto.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                    </div>
                )) : (
                    <div className="px-4 py-8 text-center text-slate-500 text-xs">No tenés favoritos guardados</div>
                )}
            </div>
            <Link href="/favoritos" className="block w-full py-3 text-center text-[10px] font-bold text-[#22c55e] hover:bg-white/5 border-t border-white/5 transition-colors uppercase tracking-wider">
                Ver todos los favoritos
            </Link>
        </div>
    );
}

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadQuestions, setUnreadQuestions] = useState(0);
    const [ticketsBuscados, setTicketsBuscados] = useState(0);
    const [activeCategory, setActiveCategory] = useState('todas');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [userData, setUserData] = useState({ name: "Cargando...", avatar: null, plan: "Gratis" });
    const [favorites, setFavorites] = useState<any[]>([]);
    const [removingFav, setRemovingFav] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const pathname = usePathname();
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const favoritesRef = useRef<HTMLDivElement>(null);
    const favoritesRefMobile = useRef<HTMLDivElement>(null);

    const activeCategoryRef = useRef(activeCategory);
    useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

    const fetchFavorites = useCallback(async (uid: string) => {
        const { data, error } = await supabase
            .from('favoritos')
            .select('id, auto_id, created_at')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !data?.length) { setFavorites([]); return; }

        const autoIds = data.map((f: any) => f.auto_id);
        const { data: autos } = await supabase
            .from('inventario')
            .select('id, marca, modelo, anio, km, pv, moneda, fotos, localidad, provincia, version')
            .in('id', autoIds);

        const autosMap: Record<string, any> = {};
        for (const a of autos || []) autosMap[a.id] = a;

        setFavorites(data.map((f: any) => ({ ...f, auto: autosMap[f.auto_id] || null })).filter((f: any) => f.auto));
    }, []);

    const handleRemoveFav = async (favId: string, autoId: string) => {
        if (!currentUserId) return;
        setRemovingFav(autoId);
        await supabase.from('favoritos').delete().eq('id', favId);
        setFavorites(prev => prev.filter(f => f.id !== favId));
        setRemovingFav(null);
    };

    const handleFavNavigate = (autoId: string) => {
        setIsFavoritesOpen(false);
        router.push(`/vehiculos/${autoId}`);
    };

    const fetchNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: unreadData } = await supabase
            .from('notifications')
            .select('id, category')
            .eq('user_id', user.id)
            .eq('is_read', false);

        const unreadList = unreadData || [];
        setUnreadCount(unreadList.length);

        const counts: Record<string, number> = {};
        unreadList.forEach((n: any) => { counts[n.category] = (counts[n.category] || 0) + 1; });
        setCategoryCounts(counts);

        let query = supabase.from('notifications').select('*').eq('user_id', user.id);
        const cat = activeCategoryRef.current;
        if (cat !== 'todas') query = query.eq('category', cat);
        const { data } = await query.order('created_at', { ascending: false });
        setNotifications(data || []);

        const { data: msgData } = await supabase
            .from('messages')
            .select('id')
            .eq('receiver_user_id', user.id)
            .eq('is_read', false);
        setUnreadMessages(msgData?.length || 0);

        const { data: qData } = await supabase
            .from('consultas_publicaciones')
            .select('id')
            .eq('owner_id', user.id)
            .is('respuesta', null);
        setUnreadQuestions(qData?.length || 0);

        const { data: tData } = await supabase
            .from('tickets_busqueda')
            .select('id')
            .eq('status', 'activo');
        setTicketsBuscados(tData?.length ?? 0);
    }, []);

    useEffect(() => { fetchNotifications(); }, [activeCategory, fetchNotifications]);

    useEffect(() => {
        setIsMounted(true);
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                const { data: profile } = await supabase.from('usuarios').select('full_name, profile_pic, plan_type').eq('auth_id', session.user.id).single();
                if (profile) {
                    setUserData({ name: profile.full_name || "Usuario", avatar: profile.profile_pic || null, plan: profile.plan_type ? profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1) : "Gratis" });
                } else {
                    setUserData({ name: "Usuario", avatar: null, plan: "Gratis" });
                }
                fetchNotifications();
                fetchFavorites(session.user.id);
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

        const favChannel = supabase.channel('favoritos_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'favoritos' }, () => {
                if (currentUserId) fetchFavorites(currentUserId);
            })
            .subscribe();

        const questionsChannel = supabase.channel('questions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas_publicaciones' }, fetchNotifications)
            .subscribe();

        const interval = setInterval(fetchNotifications, 15000);

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
            supabase.removeChannel(favChannel);
            supabase.removeChannel(questionsChannel);
            clearInterval(interval);
        };
    }, [pathname, fetchNotifications, fetchFavorites]);

    // ── Marca como leídas todas las notificaciones de una categoría ───────────
    const handleMarkCategoryAsRead = useCallback(async (categoryId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (categoryId !== 'todas') {
            query = query.eq('category', categoryId);
        }

        await query;
        await fetchNotifications();
    }, [fetchNotifications]);

    // ── Cambia pestaña y marca como leídas las de esa categoría ──────────────
    const handleCategoryChange = useCallback((categoryId: string) => {
        setActiveCategory(categoryId);
        handleMarkCategoryAsRead(categoryId);
    }, [handleMarkCategoryAsRead]);

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notification.id);
            await fetchNotifications();
        }
        const url = notification.action_url || null;
        if (url) {
            setTimeout(() => { setIsNotificationsOpen(false); router.push(url); }, 50);
        } else {
            setIsNotificationsOpen(false);
        }
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
        const handleOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(target)) setIsNotificationsOpen(false);
            if (favoritesRef.current && !favoritesRef.current.contains(target) &&
                favoritesRefMobile.current && !favoritesRefMobile.current.contains(target)) {
                setIsFavoritesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#12242e] border-b border-white/5 text-white px-6">

                {/* MOBILE */}
                <div className="lg:hidden flex flex-col pt-3 pb-2 gap-2">
                    <div className="flex justify-center">
                        <Link href="/"><Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={200} height={60} unoptimized className="h-8 w-auto object-contain" priority /></Link>
                    </div>
                    <div className="flex items-center gap-2 px-2 pb-1">
                        <div className="flex-1 relative">
                            <input type="text" placeholder="Buscar en HotCars..." className="w-full bg-white/10 border border-white/10 rounded-xl pl-4 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-[#00984a] text-center placeholder:text-center"
                                onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value.trim(); if (val) router.push(`/?marca=${encodeURIComponent(val)}`); } }}
                            />
                        </div>
                        {isLoggedIn && (
                            <div className="relative flex-shrink-0" ref={favoritesRefMobile}>
                                <button
                                    onClick={() => { setIsFavoritesOpen(!isFavoritesOpen); setIsNotificationsOpen(false); }}
                                    className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                                >
                                    <Heart className="w-6 h-6" />
                                </button>
                                {isFavoritesOpen && (
                                    <FavoritesPanel
                                        favorites={favorites}
                                        onRemove={handleRemoveFav}
                                        onNavigate={handleFavNavigate}
                                        removing={removingFav}
                                        isMobile
                                    />
                                )}
                            </div>
                        )}
                        <div className="relative flex-shrink-0" ref={notificationsRef}>
                            <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsFavoritesOpen(false); }} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>}
                            </button>
                            {isNotificationsOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[105]"
                                        onTouchStart={() => setIsNotificationsOpen(false)}
                                        onClick={() => setIsNotificationsOpen(false)}
                                    />
                                    <div className="relative z-[110]">
                                        <NotificationsPanel
                                            notifications={notifications}
                                            unreadCount={unreadCount}
                                            activeCategory={activeCategory}
                                            categoryCounts={categoryCounts}
                                            onCategoryChange={handleCategoryChange}
                                            onNotificationClick={handleNotificationClick}
                                            formatRelativeDate={formatRelativeDate}
                                        />
                                    </div>
                                </>
                            )}
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
                                <NavLink href="/dashboard/web">Mi Web</NavLink>
                                <NavLink href="/flips-compartidos" badge={categoryCounts['inventory']}>Flips Compartidos</NavLink>
                                <NavLink href="/mensajes" badge={unreadMessages}>Mensajes</NavLink>
                                <NavLink href="/preguntas" badge={unreadQuestions}>Preguntas</NavLink>
                                <NavLink href="/searched" badge={ticketsBuscados}>Vehículos Buscados</NavLink>
                                <NavLink href="/potencial-hotcars">FAQ</NavLink>
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

                                <div className="relative hidden lg:block" ref={favoritesRef}>
                                    <button
                                        onClick={() => { setIsFavoritesOpen(!isFavoritesOpen); setIsNotificationsOpen(false); setIsUserMenuOpen(false); }}
                                        className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </button>
                                    {isFavoritesOpen && (
                                        <FavoritesPanel
                                            favorites={favorites}
                                            onRemove={handleRemoveFav}
                                            onNavigate={handleFavNavigate}
                                            removing={removingFav}
                                        />
                                    )}
                                </div>

                                <div className="relative hidden lg:block" ref={notificationsRef}>
                                    <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsFavoritesOpen(false); setIsUserMenuOpen(false); }} className="text-slate-400 hover:text-white transition-colors p-1 relative cursor-pointer">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{unreadCount > 9 ? '+9' : unreadCount}</span>}
                                    </button>
                                    {isNotificationsOpen && (
                                        <NotificationsPanel
                                            notifications={notifications}
                                            unreadCount={unreadCount}
                                            activeCategory={activeCategory}
                                            categoryCounts={categoryCounts}
                                            onCategoryChange={handleCategoryChange}
                                            onNotificationClick={handleNotificationClick}
                                            formatRelativeDate={formatRelativeDate}
                                        />
                                    )}
                                </div>

                                <div className="relative hidden lg:block" ref={userMenuRef}>
                                    <button onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsFavoritesOpen(false); setIsNotificationsOpen(false); }} className="w-10 h-10 rounded-full bg-[#134e4d] overflow-hidden items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity border border-white/10 flex">
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
                <MobilePanelMenu isLoggedIn={isLoggedIn} userData={userData} onClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} ticketsBuscados={ticketsBuscados} />
            )}

            {isMounted && (
                <MobileBottomNav
                    isLoggedIn={isLoggedIn}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    unreadNotifications={unreadCount}
                    unreadMessages={unreadMessages}
                />
            )}
        </>
    );
}