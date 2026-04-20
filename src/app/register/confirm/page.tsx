'use client';

import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-[#0b1114] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-[#141b1f] border border-white/5 rounded-[2rem] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#288b55] opacity-5 blur-[80px]"></div>
        
        <div className="relative z-10">
          
          {/* Logo opcional arriba, como en el error */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo_hotcars_blanco.png"
              alt="HotCars"
              width={160}
              height={160}
              className="object-contain opacity-80"
            />
          </div>

          <div className="w-20 h-20 bg-[#288b55]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#288b55]/20 shadow-[0_10px_30px_rgba(40,139,85,0.15)]">
            <Mail size={36} className="text-[#288b55] animate-bounce" />
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: 'Genos, sans-serif' }}>
            ¡Revisá tu <span className="text-[#288b55]">Email</span>!
          </h1>
          
          <p className="text-slate-400 text-[15px] font-bold uppercase tracking-wide leading-relaxed mb-8" style={{ fontFamily: 'Genos, sans-serif' }}>
            Enviamos un botón de activación a tu casilla. <br /><br />
            <span className="text-white">Confirmalo para activar tu cuenta.</span>
          </p>

          <div className="space-y-4">
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-3">
              <CheckCircle2 size={18} className="text-[#288b55] shrink-0" />
              <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-1" style={{ fontFamily: 'Genos, sans-serif' }}>
                Si no lo encontrás, revisá el Spam.
              </p>
            </div>

            <Link 
              href="/login" 
              className="group flex items-center justify-center gap-2 w-full py-4 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white text-[13px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all border border-white/10"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              Ir al Login 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <p className="mt-8 text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ fontFamily: 'Genos, sans-serif' }}>
            HotCars Security System v1.0
          </p>

        </div>
      </div>
    </div>
  );
}