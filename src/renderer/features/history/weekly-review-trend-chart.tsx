import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartResponsiveContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-2)",
    label: "Weekly completion",
  },
} satisfies ChartConfig;

interface WeeklyReviewTrendChartProps {
  trend: WeeklyReviewTrendPoint[];
}

export function WeeklyReviewTrendChart({ trend }: WeeklyReviewTrendChartProps) {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle>Trend line</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ChartResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(value) => `${value}%`} />
                }
              />
              <Line
                dataKey="completionRate"
                dot={{ fill: "var(--color-completionRate)", r: 4 }}
                name="Weekly completion"
                stroke="var(--color-completionRate)"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ChartResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
