'use client';

import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-[#0b1114] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#141b1f] border border-white/5 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#288b55] opacity-5 blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-[#288b55]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-[#288b55]/20">
            <Mail size={40} className="text-[#288b55] animate-bounce" />
          </div>

          <h1 className="text-white text-3xl font-black uppercase tracking-tighter mb-4">
            ¡Revisá tu <span className="text-[#288b55]">Email</span>!
          </h1>
          
          <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8 uppercase tracking-tight">
            Enviamos un boton de activación a tu casilla. <br /><br />
            <span className="text-white">Confirmalo para activar tu cuenta en HotCars.</span>
          </p>

          <div className="space-y-4">
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center gap-3 text-left">
              <CheckCircle2 size={18} className="text-[#288b55] shrink-0" />
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
                Si no lo encontrás, revisá la carpeta de Spam.
              </p>
            </div>

            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
            >
              Ir al Login <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}