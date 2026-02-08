'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Intentamos el registro en Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Esta URL debe estar en la whitelist de tu proyecto de Supabase
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      alert('Registro iniciado correctamente. Revisá tu email para confirmar tu cuenta de HotCars.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1114] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#141b1f] border border-white/5 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-white text-2xl font-black uppercase tracking-tighter mb-6 text-center">
          Crear cuenta en <span className="text-[#288b55]">HOTCARS</span>
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[#288b55] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendedor@agencia.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[#288b55] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-slate-500 text-center text-xs mt-6 font-bold uppercase">
          ¿Ya tenés cuenta? <Link href="/login" className="text-[#288b55] hover:underline">Ingresá acá</Link>
        </p>
      </div>
    </div>
  );
}