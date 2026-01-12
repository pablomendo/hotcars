
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

const chartData = [
  { month: "Enero", sales: 186 },
  { month: "Febrero", sales: 305 },
  { month: "Marzo", sales: 237 },
  { month: "Abril", sales: 173 },
  { month: "Mayo", sales: 209 },
  { month: "Junio", sales: 214 },
];

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--accent))",
  },
};

export function SalesTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia de Ventas</CardTitle>
        <CardDescription className="text-xs">Ventas totales de los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[225px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            accessibilityLayer
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
              style={{ fontSize: '0.75rem' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="sales"
              type="monotone"
              stroke="hsl(var(--accent))"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
