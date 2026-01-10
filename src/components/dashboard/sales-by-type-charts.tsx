
"use client";
import * as React from 'react';
import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from '@/components/ui/separator';

const chartData = [
  { type: "Autos", sales: 40, fill: "hsl(var(--chart-1))" },
  { type: "Pickups", sales: 28, fill: "hsl(var(--chart-2))" },
  { type: "SUVs", sales: 15, fill: "hsl(var(--chart-3))" },
  { type: "Utilitarios", sales: 14, fill: "hsl(var(--chart-4))" },
  { type: "Otros", sales: 3, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  sales: {
    label: "Ventas",
  },
  Autos: {
    label: "Autos",
    color: "hsl(var(--chart-1))",
  },
  Pickups: {
    label: "Pickups",
    color: "hsl(var(--chart-2))",
  },
  SUVs: {
    label: "SUVs",
    color: "hsl(var(--chart-3))",
  },
  Utilitarios: {
    label: "Utilitarios",
    color: "hsl(var(--chart-4))",
  },
  Otros: {
    label: "Otros",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function SalesByTypeChart() {
  const totalSales = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.sales, 0);
  }, []);

  return (
    <Card className="flex flex-col h-auto">
      <CardHeader>
        <CardTitle className="text-base">Ventas por Tipo</CardTitle>
        <CardDescription className="text-xs">Distribución de ventas por tipo de vehículo</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 grid grid-cols-2 gap-4 items-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[100px]"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="sales"
              nameKey="type"
              innerRadius={0}
              outerRadius={50}
              strokeWidth={1}
            >
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col justify-center gap-0">
          {chartData.map((item, index) => {
            const percentage = ((item.sales / totalSales) * 100).toFixed(0);
            return (
              <React.Fragment key={item.type}>
                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.type}</span>
                  </div>
                  <span className="font-medium text-foreground">{percentage}%</span>
                </div>
                {index < chartData.length - 1 && <Separator className="my-0" />}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
}
