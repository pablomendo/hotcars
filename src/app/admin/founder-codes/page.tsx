'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function generateCode(prefix = 'PRO') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 6; i++) random += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${random}`;
}

export default function FounderCodesPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('PRO');
  const [expiresInDays, setExpiresInDays] = useState(30); // Cuándo vence el código para ser usado
  const [accessDays, setAccessDays] = useState(30); // Cuántos días de PRO le damos al usuario
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Solo Pablo puede generar estos códigos
      if (user?.email === 'pabloarmendoza@gmail.com') {
        setAuthorized(true);
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const handleGenerate = () => {
    const generated = Array.from({ length: quantity }, () => generateCode(prefix));
    setCodes(generated);
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const rows = codes.map(code => ({
        code,
        used: false,
        expires_at: expiresAt.toISOString(),
        access_days: accessDays,
        assigned_plan: 'pro' // Estos códigos siempre activan el plan PRO
      }));

      const { error: insertError } = await supabase.from('founder_codes').insert(rows);
      if (insertError) throw insertError;
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los códigos.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0b1114] p-8 font-sans text-white flex flex-col items-center">
      <h1 className="text-2xl font-black uppercase tracking-tighter mb-8 text-center text-[#288b55]">Generador de Códigos PRO</h1>

      <div className="bg-[#141b1f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4 w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Prefijo</label>
            <input
              type="text"
              value={prefix}
              onChange={e => setPrefix(e.target.value.toUpperCase())}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-[#288b55] text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-[#288b55] text-sm font-bold"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Días de Suscripción PRO</label>
          <input
            type="number"
            value={accessDays}
            onChange={e => setAccessDays(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-[#288b55] text-sm font-bold"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#2ecc71] transition-all text-xs"
        >
          Generar códigos
        </button>
      </div>

      {codes.length > 0 && (
        <div className="bg-[#141b1f] border border-white/5 rounded-2xl p-6 w-full max-w-md">
          <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 text-center">Códigos Listos</h2>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {codes.map((code, i) => (
              <div key={i} className="bg-black/40 px-4 py-2 rounded-lg font-mono text-sm text-[#288b55] font-black tracking-widest text-center border border-[#288b55]/20">
                {code}
              </div>
            ))}
          </div>

          {saved ? (
            <div className="text-center space-y-2">
              <p className="text-[#288b55] text-[10px] font-black uppercase tracking-widest">✓ Códigos Pro guardados con éxito</p>
              <p className="text-slate-500 text-[9px] uppercase">Vencen en {expiresInDays} días si no se usan.</p>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 bg-white/5 border border-[#288b55]/40 text-[#288b55] font-black uppercase tracking-widest rounded-xl hover:bg-[#288b55]/10 transition-all text-xs"
            >
              {loading ? 'Guardando...' : 'Confirmar y Guardar en Supabase'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}