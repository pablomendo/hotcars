'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, Star, Shield, Clock, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('PRO'); 
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prices = {
    FREE: { monthly: 0, yearly: 0 },
    PRO: { monthly: 15000, yearly: 15000 * 0.7 }, 
    VIP: { monthly: 18000, yearly: 18000 * 0.7 }  
  };

  const plans = [
    { 
      id: 'FREE', 
      name: 'Plan Free', 
      icon: <Shield size={32} className="text-slate-400 stroke-[1.5px]"/>, 
      features: ['Pagina Web (10 unidades)', 'Dashboard de gestión', 'Gestión de inventario (12 unidades)', 'Soporte Básico']
    },
    { 
      id: 'PRO', 
      name: 'Plan Pro', 
      icon: <Star size={32} className="text-yellow-500 stroke-[1.5px]"/>, 
      features: [
        'Pagina Web (20 unidades)',
        'Gestión de unidades destacadas en web',
        'Dashboard de gestión',
        'Gestión de stock inventario (25 unidades)',
        'Alertas inteligentes',
        'Tickets de búsqueda personalizada',
        'Prioridad en Red',
        'Soporte 24/7'
      ],
      popular: true
    },
    { 
      id: 'VIP', 
      name: 'Plan VIP', 
      icon: <Crown size={32} className="text-[#288b55] stroke-[1.5px]"/>, 
      features: [
        'Pagina Web (ilimitada)',
        'dominio propio (provisto por usuario)',
        'Gestión de unidades destacadas en web',
        'Gestion Nuevos ingresos en web',
        'Dashboard de gestión',
        'Gestión de stock inventario (ilimitado)',
        'Alertas inteligentes',
        'Tickets de búsqueda personalizada',
        'Prioridad en Red',
        'Soporte 24/7'
      ]
    }
  ];

  const handlePlanSelect = (id: string) => {
    setPlan(id);
    document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Error al crear usuario.');

      const { error: profileError } = await supabase.from('usuarios').insert([{ 
        auth_id: authData.user.id, 
        email: email,
        nombre: email.split('@')[0], 
        plan_type: plan,
        plan_status: 'activo', 
        billing_cycle: billingCycle
      }]);

      if (profileError) throw profileError;
      router.push('/register/confirm');

    } catch (err: any) {
      if (err.message?.includes('unique constraint') || err.code === '23505' || err.message?.includes('User already registered')) {
        setError('Ya existe un registro de usuario con ese email.');
      } else {
        setError(err.message || 'Ocurrió un error al procesar el registro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1114] flex flex-col items-center justify-start p-4 md:pt-[40px] pb-20 font-sans overflow-y-auto scroll-smooth">
      <div className="max-w-5xl w-full text-center flex flex-col items-center">
        
        {/* HEADER: Ajustado para móviles */}
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10">
          <h1 className="text-white text-[27px] md:text-[27px] font-black uppercase tracking-tighter flex flex-col md:flex-row items-center gap-4 md:gap-6">
            Elegí tu plan 
            <Image 
              src="/logo_hotcars_blanco.png" 
              alt="HotCars ISO" 
              width={160} 
              height={160} 
              className="object-contain md:w-[190px]"
            />
          </h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] mt-4 opacity-70" style={{ fontFamily: 'Genos, sans-serif' }}>
            Profesionalizá tu gestión hoy mismo
          </p>
        </div>

        {/* SELECTOR DE FACTURACIÓN */}
        <div className="flex justify-center mb-10 md:mb-12 w-full max-w-xs md:max-w-none px-4">
          <div className="bg-[#141b1f] p-1.5 rounded-xl border border-white/5 flex items-center shadow-xl w-full md:w-auto">
            <button 
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 md:flex-none px-4 md:px-9 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${
                billingCycle === 'monthly' ? 'bg-[#288b55] text-white shadow-lg' : 'text-slate-500'
              }`}
            >
              Mensual
            </button>
            <button 
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 md:flex-none px-4 md:px-9 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                billingCycle === 'yearly' ? 'bg-[#288b55] text-white shadow-lg' : 'text-slate-500'
              }`}
            >
              Anual 
              <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded text-white">-30%</span>
            </button>
          </div>
        </div>

        {/* GRID DE PLANES */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24 px-2 md:px-4 w-full md:scale-[0.80] md:origin-top">
          {plans.map((p) => {
            const priceMonthly = prices[p.id as keyof typeof prices].monthly;
            const priceYearly = prices[p.id as keyof typeof prices].yearly;

            return (
              <div 
                key={p.id}
                onClick={() => handlePlanSelect(p.id)}
                className={`relative flex flex-col p-8 md:p-10 rounded-[2rem] border transition-all duration-500 cursor-pointer text-left ${
                  plan === p.id 
                    ? 'border-[#288b55] bg-[#288b55]/10 shadow-[0_20px_60px_rgba(40,139,85,0.15)] scale-[1.02] md:scale-105 z-10' 
                    : 'border-white/5 bg-[#141b1f]'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#288b55] text-white text-[11px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">Recomendado</span>
                )}
                
                <div className="flex justify-center items-center mb-8 text-[#288b55]">
                  {p.icon}
                </div>

                <h3 className="text-white text-xl md:text-2xl font-black uppercase mb-2 text-center tracking-tight">{p.name}</h3>
                
                <div className="flex flex-col mb-8 min-h-[60px] md:min-h-[70px] justify-center items-center">
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className={`font-black tracking-tighter ${billingCycle === 'yearly' ? 'text-4xl md:text-5xl text-[#288b55]' : 'text-3xl md:text-4xl text-white'}`}>
                      $ {p.id === 'FREE' ? '0' : (billingCycle === 'yearly' ? priceYearly.toLocaleString('es-AR') : priceMonthly.toLocaleString('es-AR'))}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && p.id !== 'FREE' && (
                    <span className="text-slate-500 text-[10px] font-bold line-through uppercase mt-1">Antes $ {priceMonthly.toLocaleString('es-AR')}</span>
                  )}
                </div>

                <div className="space-y-4 mb-4 flex-1">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={14} className="text-[#288b55] mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400 text-[11px] md:text-[12px] font-bold uppercase tracking-tight leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FORMULARIO */}
        <div id="auth-form" className="w-full max-w-xl mx-auto bg-[#141b1f] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden text-left mb-20">
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter text-center flex items-center gap-4">
                Crea tu acceso 
                <Image 
                  src="/logo_hotcars_allwhite_iso_suelto.png" 
                  alt="HotCars ISO" 
                  width={100} 
                  height={100} 
                  className="object-contain md:w-[125px]"
                />
              </h2>
              <p className="text-slate-500 text-[9px] md:text-xs font-bold uppercase tracking-[0.3em] mt-6 bg-black/40 px-6 py-2 rounded-full border border-[#288b55]/40 shadow-[0_0_25px_rgba(40,139,85,0.3)]">
                Seleccionaste: <span className="text-[#288b55] font-black">{plan}</span>
              </p>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Email de la Agencia / Vendedor</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-white outline-none focus:border-[#288b55] focus:ring-1 focus:ring-[#288b55] transition-all font-bold text-sm" 
                    placeholder="vendedor@hotmail.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">Contraseña de acceso</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-white outline-none focus:border-[#288b55] focus:ring-1 focus:ring-[#288b55] transition-all text-sm" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                  <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#2ecc71] transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(40,139,85,0.3)] hover:scale-[1.02] active:scale-95 text-xs md:text-sm"
              >
                {loading ? 'Sincronizando...' : 'Comenzar ahora'}
              </button>

              <div className="flex items-center justify-center gap-2 mt-6 text-slate-500">
                <Clock size={14} className="animate-pulse" />
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em]">Activación inmediata</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}