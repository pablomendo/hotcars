'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-[#0b1114] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-[#141b1f] border border-white/5 rounded-[2rem] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
        
        <div className="flex justify-center mb-8">
          <Image
            src="/logo_hotcars_blanco.png"
            alt="HotCars"
            width={180}
            height={180}
            className="object-contain"
          />
        </div>

        <div className="flex justify-center mb-6 text-[#288b55]">
          <div className="bg-[#288b55]/10 p-4 rounded-full">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: 'Genos, sans-serif' }}>
          Verificación de Acceso
        </h1>
        
        <p className="text-slate-400 text-sm font-bold uppercase tracking-wide leading-relaxed mb-8" style={{ fontFamily: 'Genos, sans-serif' }}>
          El enlace de verificación ha caducado o ya ha sido utilizado. <br/>
          <span className="text-[#288b55]">No te preocupes, tu cuenta ya se encuentra activa.</span>
        </p>

        <Link
          href="/login"
          className="group w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#2ecc71] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(40,139,85,0.2)]"
        >
          Ir al Dashboard
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <p className="mt-8 text-slate-600 text-[9px] font-black uppercase tracking-widest opacity-50">
          HotCars Security System v1.0
        </p>
      </div>
    </div>
  );
}