'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Evitamos errores de hidratación asegurando que el componente esté montado
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.updateUser({ password });
      if (resetError) throw resetError;
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#12242e] flex flex-col" suppressHydrationWarning>
      {/* HEADER FIJO: Idéntico al de Login, fijo y logo centrado en móvil */}
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

      {/* FRANJA VERDE: h-64 md:h-72 */}
      <div className="w-full bg-[#00984a] h-64 md:h-72 shadow-inner"></div>

      {/* CONTENEDOR: Margen negativo -mt-32 md:-mt-40 */}
      <div className="flex-1 flex items-start justify-center px-6 -mt-32 md:-mt-40 pb-20">
        <div className="w-full max-w-md bg-[#12242e] border border-white/5 rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter mb-4 text-center">
            Nueva <span className="text-[#00984a]">CONTRASEÑA</span>
          </h1>

          {success ? (
            <div className="bg-[#00984a]/10 border border-[#00984a]/20 p-6 rounded-2xl text-center">
              <p className="text-[#00984a] text-sm font-black uppercase tracking-tight">¡Contraseña actualizada!</p>
              <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-tighter">Redirigiendo al login...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-slate-500 text-[10px] font-bold uppercase text-center mb-6 leading-tight">
                Ingresá tu nueva clave de acceso para HotCars.
              </p>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#00984a] transition-all font-bold text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <p className="text-red-500 text-[10px] font-black uppercase text-center leading-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-[#00984a] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#007a3b] shadow-lg shadow-[#00984a]/20 transition-all active:scale-95 disabled:opacity-50 mt-4"
              >
                {loading ? 'Actualizando...' : 'Confirmar Cambio'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}