'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados de Formulario
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Solución para error de Hidratación
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lógica de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (loginError) throw loginError;

      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('plan_status, plan_type')
        .eq('auth_id', data.user.id)
        .single();

      if (profileError || !userProfile || userProfile.plan_status !== 'activo') {
        await supabase.auth.signOut();
        throw new Error('Cuenta inactiva. Contactá a soporte.');
      }

      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Recuperación
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage('Enviamos un enlace de acceso a tu email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // No renderizar hasta que el componente esté montado para evitar error de SSR/Client mismatch
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#12242e] flex flex-col" suppressHydrationWarning>
      {/* HEADER FIJO Y LOGO CENTRADO EN MÓVIL */}
      <header className="w-full bg-[#12242e] h-20 flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center justify-center md:justify-start w-full max-w-[1600px] mx-auto">
            <Link href="/" className="relative w-40 h-10 md:ml-20">
                <Image 
                  src="/logo_hotcars_blanco.png" 
                  alt="HotCars" 
                  fill 
                  className="object-contain object-center md:object-left" 
                  priority
                />
            </Link>
        </div>
      </header>

      {/* SECCIÓN FRANJA VERDE */}
      <div className="w-full bg-[#00984a] h-64 md:h-72 shadow-inner"></div>

      {/* SECCIÓN FORMULARIO */}
      <div className="flex-1 flex items-start justify-center px-6 -mt-32 md:-mt-40 pb-20">
        <div className="w-full max-w-md bg-[#12242e] border border-white/5 rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
          
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter mb-2 text-center transition-all">
            {isRecovery ? 'Recuperar' : 'Ingresar a'} <span className="text-[#00984a]">{isRecovery ? 'ACCESO' : 'SISTEMA'}</span>
          </h1>
          
          <p className={`text-slate-500 text-[10px] font-bold uppercase text-center mb-8 transition-all ${isRecovery ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
            Ingresá tu email para restablecer tu clave
          </p>

          <form onSubmit={isRecovery ? handleRecoverySubmit : handleLoginSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Email de Usuario</label>
              <input 
                type="email" 
                required
                placeholder="ej: usuario@hotcars.com"
                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#00984a] transition-all font-bold text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isRecovery ? 'max-h-0 opacity-0 pointer-events-none overflow-hidden' : 'max-h-40 opacity-100'}`}>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Contraseña</label>
              <input 
                type="password" 
                required={!isRecovery}
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#00984a] transition-all font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-2 pr-1">
                <button 
                  type="button"
                  onClick={() => { setIsRecovery(true); setError(null); setMessage(null); }}
                  className="text-[9px] font-black text-slate-600 hover:text-[#00984a] uppercase tracking-tighter transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                <p className="text-red-500 text-[10px] font-black uppercase text-center leading-tight">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-[#00984a]/10 border border-[#00984a]/20 p-4 rounded-2xl">
                <p className="text-[#00984a] text-[10px] font-black uppercase text-center leading-tight">{message}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-[#00984a] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#007a3b] shadow-lg shadow-[#00984a]/20 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Procesando...' : (isRecovery ? 'Enviar Enlace' : 'Entrar al Sistema')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
            {isRecovery ? (
                <button 
                  onClick={() => { setIsRecovery(false); setError(null); setMessage(null); }}
                  className="text-[#00984a] text-[10px] font-black uppercase hover:underline"
                >
                  Volver al Login
                </button>
            ) : (
                <p className="text-slate-500 text-center text-xs font-bold uppercase tracking-tight">
                  ¿No tenés cuenta? <Link href="/register" className="text-[#00984a] hover:underline ml-1">Registrate acá</Link>
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}