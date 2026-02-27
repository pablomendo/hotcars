'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type UserData = { name: string; avatar: any; plan: string };

type Props = {
    isLoggedIn: boolean;
    userData: UserData;
    onClose: () => void;
    onLogout: () => void;
};

function MobileNavLink({ href, children, onClose }: { href: string; children: React.ReactNode; onClose: () => void }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} onClick={onClose} className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#134e4d] text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
            {children}
        </Link>
    );
}

export default function MobilePanelMenu({ isLoggedIn, userData, onClose, onLogout }: Props) {
    const router = useRouter();
    return (
        <div className="lg:hidden fixed inset-0 top-0 bg-[#12242e] z-[90] p-6 flex flex-col animate-in slide-in-from-left duration-300 pt-24 pb-24 overflow-y-auto">
            {isLoggedIn ? (
                <>
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
                        <MobileNavLink href="/dashboard" onClose={onClose}>Dashboard</MobileNavLink>
                        <MobileNavLink href="/inventario" onClose={onClose}>Inventario</MobileNavLink>
                        <MobileNavLink href="/dashboard/web" onClose={onClose}>Mi Web</MobileNavLink>
                        <MobileNavLink href="/flips-compartidos" onClose={onClose}>Flips Compartidos</MobileNavLink>
                        <MobileNavLink href="/messages" onClose={onClose}>Mensajes</MobileNavLink>
                        <MobileNavLink href="/searched" onClose={onClose}>Vehículos Buscados</MobileNavLink>
                        <MobileNavLink href="/perfil" onClose={onClose}>Configuración</MobileNavLink>
                        <button onClick={() => { onClose(); router.push('/potencial-hotcars'); }} className="text-sm font-semibold px-4 py-2.5 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/5 transition-all">✦ Potencial HotCars</button>
                    </div>
                    <button onClick={() => { onClose(); onLogout(); }} className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 mt-4 border border-red-400/20 rounded-xl">
                        <LogOut size={16} />Cerrar sesión
                    </button>
                </>
            ) : (
                <div className="flex flex-col gap-3 flex-1 justify-center">
                    <Image src="/logo_hotcars_blanco.png" alt="HotCars Logo" width={160} height={48} unoptimized className="h-10 w-auto object-contain mb-2 opacity-60 mx-auto" />
                    <p className="text-slate-400 text-sm font-medium text-center mb-4">Ingresá o registrate para acceder a todas las funciones</p>
                    <button onClick={() => { onClose(); router.push('/potencial-hotcars'); }} className="w-full py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl text-center text-sm border border-white/20 hover:bg-white/20 transition-all">✦ Potencial HotCars</button>
                    <Link href="/login" onClick={onClose} className="w-full py-3 bg-[#134e4d] text-white font-black uppercase tracking-widest rounded-xl text-center text-sm">Iniciar Sesión</Link>
                    <Link href="/register" onClick={onClose} className="w-full py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl text-center text-sm border border-white/20">Registrarse</Link>
                </div>
            )}
        </div>
    );
}
