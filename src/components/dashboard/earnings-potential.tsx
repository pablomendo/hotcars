"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const chartData = [
  { value: 800 }, { value: 1200 }, { value: 1000 }, { value: 1500 }, { value: 1300 }, { value: 1800 }, { value: 1600 }, { value: 2200 }, { value: 2000 }, { value: 2500 }, { value: 2300 }, { value: 3000 }, { value: 2800 }, { value: 3200 },
];

const ProgressBar = () => {
  const segments = [
    { color: '#f97316', width: '20%' },
    { color: '#f59e0b', width: '15%' },
    { color: '#eab308', width: '20%' },
    { color: '#84cc16', width: '15%' },
    { color: '#22c55e', width: '10%' },
    { color: '#16a34a', width: '10%' },
    { color: '#15803d', width: '10%' },
  ];

  return (
    <div className="relative w-full h-1.5 rounded-full overflow-hidden flex bg-black/20 mt-2">
      {segments.map((segment, index) => (
        <div key={index} style={{ width: segment.width, backgroundColor: segment.color }} />
      ))}
    </div>
  );
};

export function EarningsPotential() {
  // LÓGICA DE NEGOCIO (Pronto vendrá de tu base de datos)
  // PV - PC = Ganancia Propia
  const gananciaPropia = 5400; 
  // Flips = 50% de la diferencia en autos compartidos
  const gananciaFlips = 2200; 
  const totalPotencial = gananciaPropia + gananciaFlips;

  return (
    <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-border text-white overflow-hidden" style={{ minHeight: '11.5rem' }}>
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="z-10">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Potencial de Ganancia
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Diferencia entre PC y PV + Flips compartidos activos.
          </p>
        </div>
        
        <div className="relative h-24 flex flex-col justify-end">
            {/* Monto Total Posicionado */}
            <div className="flex flex-col items-end mb-2 z-10">
                <p className="text-3xl font-bold text-[#A6C94A]">
                  USD ${totalPotencial.toLocaleString()}
                </p>
                <div className="flex gap-2 text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Propios: ${gananciaPropia}</span>
                  <span className="text-primary">Flips: ${gananciaFlips}</span>
                </div>
            </div>

            <ProgressBar />

            {/* Gráfico de fondo */}
            <div className="absolute inset-0 -bottom-6 opacity-30 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#eab308" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}