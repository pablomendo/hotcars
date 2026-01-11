"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Clock, TrendingUp, Users, FileSearch, AlertTriangle } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { Area, AreaChart } from 'recharts';

const chartData = [
  { value: 800 },
  { value: 1200 },
  { value: 1000 },
  { value: 1500 },
  { value: 1300 },
  { value: 1800 },
  { value: 1600 },
  { value: 2200 },
  { value: 2000 },
  { value: 2500 },
  { value: 2300 },
  { value: 3000 },
  { value: 2800 },
  { value: 3200 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-2))",
  },
};

const primaryStats = [
  { title: 'Autos Activos', value: '14', icon: Car, change: '15.2%', changeType: 'increase' },
  { title: 'Flips Compartidos', value: '11', icon: TrendingUp, subtitle: '1 solicitud de flip' },
  { title: 'Mensajes', value: '9', subtitle: 'Pendientes', icon: Users },
  { title: 'Días Prom. Venta', value: '28', icon: Clock, change: '2.5%', changeType: 'decrease' },
  { title: 'Vehiculos Requeridos', value: '23', subtitle: 'Oportunidad de venta', icon: FileSearch, color: 'text-emerald-500' },
];

export function OverviewStats() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
      {primaryStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0 p-2">
            <CardTitle className="font-bold text-base leading-tight">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
               {stat.change && (
                <>
                  <span className={stat.changeType === 'increase' ? 'text-emerald-500' : 'text-destructive'}>
                    {stat.changeType === 'increase' ? '▲' : '▼'} {stat.change}
                  </span>
                  {' '}
                  <span className="hidden xl:inline">desde mes pasado</span>
                </>
              )}
               {stat.subtitle && (
                 <span className={`${stat.color ? stat.color : ''}`}>{stat.subtitle}</span>
                )}
            </p>
          </CardContent>
        </Card>
      ))}
       <Card className="col-span-1 lg:col-span-1 bg-[#1a2c32]">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0 p-2">
            <CardTitle className="font-bold text-base leading-tight text-white">Unidad Clavo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-2xl font-bold text-lime-300">USD $3.200</div>
             <ChartContainer config={chartConfig} className="h-[40px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="value"
                    type="natural"
                    fill="url(#fillValue)"
                    stroke="var(--color-value)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
          </CardContent>
        </Card>
    </div>
  );
}
