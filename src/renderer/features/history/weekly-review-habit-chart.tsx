import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartResponsiveContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-3)",
    label: "Habit completion",
  },
} satisfies ChartConfig;

interface WeeklyReviewHabitChartProps {
  habitMetrics: WeeklyReviewHabitMetric[];
}

export function WeeklyReviewHabitChart({
  habitMetrics,
}: WeeklyReviewHabitChartProps) {
  const chartData = habitMetrics.map((metric) => ({
    completionRate: metric.completionRate,
    name: metric.name,
    opportunities: metric.opportunities,
  }));

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle>Habit completion</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="p-2"
          config={chartConfig}
          style={{
            height: `${Math.max(280, chartData.length * 52)}px`,
          }}
        >
          <ChartResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 12, right: 18 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                type="category"
                width={128}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name) => `${value}%`}
                    indicator="line"
                  />
                }
              />
              <Bar
                dataKey="completionRate"
                fill="var(--color-completionRate)"
                name="Habit completion"
                radius={[0, 12, 12, 0]}
              />
            </BarChart>
          </ChartResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
