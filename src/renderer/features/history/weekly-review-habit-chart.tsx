import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartResponsiveContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--ring-productivity)",
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
    category: metric.category,
    color: HABIT_CATEGORY_UI[metric.category].ringColor,
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
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar
                dataKey="completionRate"
                name="Habit completion"
                radius={[0, 12, 12, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
