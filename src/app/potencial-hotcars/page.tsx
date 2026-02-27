'use client';

import Link from 'next/link';

const features = [
  {
    problem: {
      title: 'Inventario Chico',
      text: 'Tu concesionaria se ve vacía y tus opciones son pocas. El cliente entra, no ve lo que busca y se va a la competencia. Estás perdiendo ventas porque no tenés el auto físico hoy.',
    },
    solution: {
      title: 'Flips Compartidos',
      text: 'Vendé lo que no tenés en stock. Con los Flips de HotCars, tu catálogo se expande al instante. Accedé a las unidades de toda la red, compartilas como si fueran tuyas y cerrá el trato. Pasás de 5 autos a cientos en un segundo.',
    },
  },
  {
    problem: {
      title: 'Pocas ventas por falta de versión',
      text: 'Tenés el modelo, pero el cliente busca el color blanco o la versión 4x4 que no tenés. Esa variante específica es la excusa perfecta para que el cliente siga buscando en Google.',
    },
    solution: {
      title: 'Apalancamiento en la Red',
      text: 'No digas "no lo tengo", decí "te lo consigo". Usá la infraestructura de HotCars para ubicar la unidad exacta en el inventario de otro usuario. Te apalancás en el stock ajeno para que tu respuesta sea siempre: "Sí, lo tenemos".',
    },
  },
  {
    problem: {
      title: 'Falta de presencia y control',
      text: 'Sin datos claros de ganancias o una web que dé confianza, parecés un vendedor más del montón y perdés rastro de tus oportunidades reales.',
    },
    solution: {
      title: 'Dashboard y Web Personal',
      text: 'Tomá el control con un Dashboard inteligente que te muestra potenciales de ganancias y alertas en tiempo real. Proyectá un estatus profesional con tu propia Web Personal sincronizada, validando tu seriedad ante cada cliente.',
    },
  },
];

export default function PotencialHotCarsPage() {
  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans tracking-tight">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&display=swap');
      `}</style>

      {/* Hero */}
      <section className="w-full bg-[#12242e] pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-[#00984a] text-xs font-black uppercase tracking-widest mb-4">✦ Por qué HotCars</p>
          <h1 className="text-white font-black text-3xl md:text-5xl uppercase tracking-tighter leading-tight mb-6" style={{ fontFamily: "'Genos', sans-serif" }}>
            El Potencial que<br />te estás perdiendo
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-[560px] mx-auto">
            Descubrí cómo HotCars transforma los problemas más comunes del vendedor de autos en ventajas competitivas reales.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-[860px] mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-10">
        {features.map((f, idx) => (
          <div key={idx} className="flex flex-col gap-4">
            {/* Problema */}
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">El Problema</p>
              <h2 className="text-[#0f172a] font-black text-lg md:text-xl mb-3 leading-tight">{f.problem.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{f.problem.text}</p>
            </div>
            {/* Flecha */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[#288b55] flex items-center justify-center shadow-md">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M7 12l-4-4M7 12l4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            {/* Solución */}
            <div className="bg-white border border-[#288b55]/30 rounded-2xl p-6 shadow-sm">
              <p className="text-[#288b55] text-[10px] font-black uppercase tracking-widest mb-2">El Remedio</p>
              <h2 className="text-[#0f172a] font-black text-lg md:text-xl mb-3 leading-tight">{f.solution.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{f.solution.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTAs */}
      <section className="w-full bg-[#12242e] py-14 px-4 md:px-8">
        <div className="max-w-[500px] mx-auto flex flex-col items-center gap-4 text-center">
          <h2 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter" style={{ fontFamily: "'Genos', sans-serif" }}>
            ¿Listo para empezar?
          </h2>
          <p className="text-slate-400 text-sm mb-2">Unite a la red de vendedores profesionales de HotCars.</p>
          <Link href="/register" className="w-full py-4 bg-[#288b55] text-white font-black uppercase tracking-widest rounded-xl text-center text-sm hover:opacity-90 transition-all shadow-lg">
            Registrarse
          </Link>
          <Link href="/login" className="w-full py-4 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl text-center text-sm border border-white/20 hover:bg-white/20 transition-all">
            Iniciar Sesión
          </Link>
        </div>
      </section>
    </main>
  );
}