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
  const gananciaPropia = 5400; 
  const gananciaFlips = 2200; 
  const totalPotencial = gananciaPropia + gananciaFlips;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);

  return (
    <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-white/5 text-white overflow-hidden" style={{ minHeight: '11.5rem' }}>
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="z-10">
          <h3 className="text-lg font-bold text-white tracking-tight uppercase">
            Potencial de Ganancia
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 uppercase font-medium">
            PC vs PV + Flips compartidos activos
          </p>
        </div>
        
        <div className="relative h-24 flex flex-col justify-end">
            <div className="flex flex-col items-end mb-2 z-10">
                <p className="text-3xl font-black text-[#A6C94A] leading-none">
                  {formatCurrency(totalPotencial)}
                </p>
                <div className="flex gap-3 text-[10px] text-slate-400 uppercase font-bold mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>Propios: {formatCurrency(gananciaPropia)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A6C94A]" />
                    <span>Flips: {formatCurrency(gananciaFlips)}</span>
                  </div>
                </div>
            </div>

            <ProgressBar />

            <div className="absolute inset-0 -bottom-6 opacity-20 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A6C94A" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#A6C94A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#A6C94A" 
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