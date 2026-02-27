'use client';

import Link from 'next/link';
import { Home, Heart, Plus, Settings, Menu, X, User, LogOut, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
    isLoggedIn: boolean;
    isMobileMenuOpen: boolean;
    onToggleMenu: () => void;
};

export default function MobileBottomNav({ isLoggedIn, isMobileMenuOpen, onToggleMenu }: Props) {
    const router = useRouter();
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#12242e] border-t border-white/10 grid grid-cols-5 px-2 py-2" style={{ bottom: 0 }}>
            {isLoggedIn ? (
                <>
                    <Link href="/" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <Home size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Inicio</span>
                    </Link>
                    <Link href="/favoritos" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <Heart size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Favoritos</span>
                    </Link>
                    <div className="flex items-center justify-center">
                        <button onClick={() => router.push('/publicar')} className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#134e4d] border-4 border-[#12242e] -mt-6 shadow-lg hover:opacity-90 active:scale-95 transition-all">
                            <Plus size={26} className="text-white" />
                        </button>
                    </div>
                    <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <Settings size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Panel</span>
                    </Link>
                    <button onClick={onToggleMenu} className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        <span className="text-[10px] font-bold uppercase tracking-wide">{isMobileMenuOpen ? 'Cerrar' : 'Más'}</span>
                    </button>
                </>
            ) : (
                <>
                    <Link href="/" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <Home size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Inicio</span>
                    </Link>
                    <Link href="/register" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <User size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Registrar</span>
                    </Link>
                    <div className="flex items-center justify-center">
                        <button onClick={() => router.push('/potencial-hotcars')} className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#134e4d] border-4 border-[#12242e] -mt-6 shadow-lg hover:opacity-90 active:scale-95 transition-all">
                            <HelpCircle size={26} className="text-white" />
                        </button>
                    </div>
                    <Link href="/login" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <LogOut size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Ingresar</span>
                    </Link>
                    <button onClick={onToggleMenu} className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        <span className="text-[10px] font-bold uppercase tracking-wide">{isMobileMenuOpen ? 'Cerrar' : 'Más'}</span>
                    </button>
                </>
            )}
        </nav>
    );
}