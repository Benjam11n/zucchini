import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  ChartContainer,
  ChartResponsiveContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/renderer/shared/ui/chart";
import type { ChartConfig } from "@/renderer/shared/ui/chart";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--color-chart-1)",
    label: "Completion",
  },
} satisfies ChartConfig;

interface WeeklyReviewDailyCadenceChartProps {
  review: WeeklyReview;
}

export function WeeklyReviewDailyCadenceChart({
  review,
}: WeeklyReviewDailyCadenceChartProps) {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle>Daily cadence</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ChartResponsiveContainer width="100%" height="100%">
            <BarChart data={review.dailyCadence}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis axisLine={false} dataKey="shortLabel" tickLine={false} />
              <YAxis
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value}%`}
                    indicator="line"
                  />
                }
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              />
              <Bar
                dataKey="completionRate"
                fill="var(--color-completionRate)"
                name="Completion"
                radius={[12, 12, 6, 6]}
              />
            </BarChart>
          </ChartResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
