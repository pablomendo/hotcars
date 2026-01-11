"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const chartData = [
  { value: 800 }, { value: 1200 }, { value: 1000 }, { value: 1500 }, { value: 1300 }, { value: 1800 }, { value: 1600 }, { value: 2200 }, { value: 2000 }, { value: 2500 }, { value: 2300 }, { value: 3000 }, { value: 2800 }, { value: 3200 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "#eab308",
  },
};

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
    <div className="relative w-full h-2 rounded-full overflow-hidden flex bg-green-900/50">
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{ width: segment.width, backgroundColor: segment.color }}
        />
      ))}
    </div>
  );
};

// Cambiado a EarningsPotential (con S) para coincidir con el import en page.tsx
export function EarningsPotential() {
  return (
    <Card className="bg-gradient-to-br from-[#1a2c32] to-[#2a4a53] text-white flex flex-col justify-between" style={{minHeight: '11.5rem'}}>
      <CardContent className="p-4 relative flex flex-col justify-between flex-grow">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Potencial de Ganancia
          </h3>
          <p className="text-sm text-gray-400 mt-1 whitespace-nowrap">
            Lo que ganarías cerrando todas las operaciones de tu inventario.
          </p>
        </div>
        
        <div className="relative mt-auto">
            <div className="absolute bottom-6 right-0 text-right">
                <p className="text-2xl font-bold text-[#A6C94A]">USD $7.600</p>
                <p className="text-xs text-gray-400 -mt-1">potencial</p>
            </div>
            <ProgressBar />
            <ChartContainer config={chartConfig} className="h-[50px] w-full absolute bottom-0 left-0 opacity-40">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ left: -10, right: -10, top: 10, bottom: 0, }}
              >
                <defs>
                  <linearGradient id="fillEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="value"
                  type="natural"
                  fill="url(#fillEarnings)"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}