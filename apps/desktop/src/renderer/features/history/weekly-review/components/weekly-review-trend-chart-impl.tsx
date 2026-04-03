import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import {
  ChartContainer,
  ChartResponsiveContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/renderer/shared/components/ui/chart";
import type { ChartConfig } from "@/renderer/shared/components/ui/chart";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-2)",
    label: "Weekly completion",
  },
  focusMinutes: {
    color: "var(--color-chart-4)",
    label: "Focus minutes",
  },
} satisfies ChartConfig;

interface WeeklyReviewTrendChartImplProps {
  trend: WeeklyReviewTrendPoint[];
}

export function WeeklyReviewTrendChartImpl({
  trend,
}: WeeklyReviewTrendChartImplProps) {
  return (
    <Card>
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
                  <ChartTooltipContent
                    formatter={(value, name) =>
                      name === "Weekly completion" ? `${value}%` : value
                    }
                  />
                }
              />
              <Line
                dataKey="focusMinutes"
                dot={{ fill: "var(--color-focusMinutes)", r: 4 }}
                name="Focus minutes"
                stroke="var(--color-focusMinutes)"
                strokeWidth={3}
                type="monotone"
                yAxisId="focus"
              />
              <Line
                dataKey="completionRate"
                dot={{ fill: "var(--color-completionRate)", r: 4 }}
                name="Weekly completion"
                stroke="var(--color-completionRate)"
                strokeWidth={3}
                type="monotone"
              />
              <YAxis
                axisLine={false}
                orientation="right"
                tickLine={false}
                yAxisId="focus"
              />
            </LineChart>
          </ChartResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
