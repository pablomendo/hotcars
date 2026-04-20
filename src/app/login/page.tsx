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
      // 1. Intentamos entrar en Supabase Auth
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (loginError) throw loginError;

      // 2. Buscamos el perfil en tu tabla
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('plan_status, plan_type')
        .eq('auth_id', data.user.id)
        .single();

      // 3. VERIFICACIONES ESTRICTAS
      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(`Error de base de datos: ${profileError.message}`);
      }

      if (!userProfile) {
        await supabase.auth.signOut();
        throw new Error('El perfil no se creó correctamente en la tabla usuarios.');
      }

      if (userProfile.plan_status !== 'activo' && userProfile.plan_status !== 'fundador') {
        await supabase.auth.signOut();
        throw new Error(`Acceso denegado. Estado actual: ${userProfile.plan_status}`);
      }

      // 4. Si pasa todo esto, el usuario es legal y entra
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
    <div className="min-h-screen bg-[#0b1114] flex flex-col items-center justify-center p-4 font-sans text-white" suppressHydrationWarning>
      
      <div className="w-full max-w-[436px] mx-auto bg-[#141b1f] border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden text-left">
        
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#288b55] opacity-5 blur-[80px]"></div>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Logo */}
          <Link href="/" className="mb-8 flex justify-center">
            <Image
              src="/logo_hotcars_blanco.png"
              alt="HotCars"
              width={160}
              height={160}
              className="object-contain"
            />
          </Link>

          <h1 className="text-white text-2xl font-black uppercase tracking-tighter mb-2 text-center transition-all" style={{ fontFamily: 'Genos, sans-serif' }}>
            {isRecovery ? 'Recuperar' : 'Ingresar al'} <span className="text-[#288b55]">{isRecovery ? 'ACCESO' : 'SISTEMA'}</span>
          </h1>
          
          <p className={`text-slate-500 text-[12px] font-bold uppercase tracking-widest text-center mb-8 transition-all ${isRecovery ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`} style={{ fontFamily: 'Genos, sans-serif' }}>
            Ingresá tu email para restablecer tu clave
          </p>

          <form onSubmit={isRecovery ? handleRecoverySubmit : handleLoginSubmit} className="space-y-5 w-full">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Email de Usuario</label>
              <input 
                type="email" 
                required
                placeholder="usuario@hotcars.com"
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#288b55] focus:ring-1 focus:ring-[#288b55] transition-all font-bold text-sm"
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
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#288b55] focus:ring-1 focus:ring-[#288b55] transition-all font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-3 pr-1">
                <button 
                  type="button"
                  onClick={() => { setIsRecovery(true); setError(null); setMessage(null); }}
                  className="text-[10px] font-black text-slate-500 hover:text-[#288b55] uppercase tracking-widest transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center mt-4">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-[#288b55]/10 border border-[#288b55]/20 p-4 rounded-xl text-center mt-4">
                <p className="text-[#288b55] text-[10px] font-black uppercase tracking-widest leading-tight">{message}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#2ecc71] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(40,139,85,0.3)] hover:scale-[1.02] active:scale-95 text-sm mt-4"
            >
              {loading ? 'Procesando...' : (isRecovery ? 'Enviar Enlace' : 'Entrar al Sistema')}
            </button>
          </form>

          <div className="w-full mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
            {isRecovery ? (
                <button 
                  onClick={() => { setIsRecovery(false); setError(null); setMessage(null); }}
                  className="text-[#288b55] text-[11px] font-black uppercase hover:text-[#2ecc71] tracking-widest transition-colors"
                >
                  Volver al Login
                </button>
            ) : (
                <p className="text-slate-500 text-center text-[11px] font-black uppercase tracking-widest">
                  ¿No tenés cuenta? <Link href="/register" className="text-[#288b55] hover:text-[#2ecc71] transition-colors ml-1">Registrate acá</Link>
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}