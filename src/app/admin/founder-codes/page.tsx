'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function generateCode(prefix = 'FOUNDER') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 6; i++) random += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${random}`;
}

export default function FounderCodesPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('FOUNDER');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#0b1114] p-8 font-sans text-white">
      <h1 className="text-2xl font-black uppercase tracking-tighter mb-8">Generador de Códigos Fundadores</h1>

      <div className="bg-[#141b1f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4 max-w-lg">
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
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cantidad de códigos</label>
          <input
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-[#288b55] text-sm font-bold"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Vencimiento del código (días para usarlo)</label>
          <input
            type="number"
            min={1}
            value={expiresInDays}
            onChange={e => setExpiresInDays(Number(e.target.value))}
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
        <div className="bg-[#141b1f] border border-white/5 rounded-2xl p-6 max-w-lg">
          <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Códigos generados</h2>
          <div className="space-y-2 mb-6">
            {codes.map((code, i) => (
              <div key={i} className="bg-black/40 px-4 py-2 rounded-lg font-mono text-sm text-[#288b55] font-black tracking-widest">
                {code}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4">
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          {saved ? (
            <p className="text-[#288b55] text-[10px] font-black uppercase tracking-widest text-center">✓ Códigos guardados en Supabase</p>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 bg-white/5 border border-[#288b55]/40 text-[#288b55] font-black uppercase tracking-widest rounded-xl hover:bg-[#288b55]/10 transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar en Supabase'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}