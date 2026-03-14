import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { buildWeeklyReviewHabitChartState } from "@/renderer/features/history/weekly-review/lib/weekly-review-habit-chart";
import { HABIT_CATEGORY_UI } from "@/renderer/shared/lib/habit-categories";
import { Badge } from "@/renderer/shared/ui/badge";
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
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

const chartConfig = {
  completionRate: {
    color: "var(--ring-productivity)",
    label: "Habit completion",
  },
} satisfies ChartConfig;

interface WeeklyReviewHabitChartImplProps {
  habitMetrics: WeeklyReviewHabitMetric[];
}

export function WeeklyReviewHabitChartImpl({
  habitMetrics,
}: WeeklyReviewHabitChartImplProps) {
  const { chartHeight, remainingHabits, visibleHabits } =
    buildWeeklyReviewHabitChartState(
      habitMetrics,
      (category) => HABIT_CATEGORY_UI[category].ringColor
    );

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle>Habit completion</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ChartContainer
          className="p-2"
          config={chartConfig}
          style={{
            height: `${chartHeight}px`,
          }}
        >
          <ChartResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleHabits}
              layout="vertical"
              margin={{ left: 4, right: 12 }}
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
                dataKey="shortName"
                tick={{ fontSize: 11 }}
                tickLine={false}
                type="category"
                width={104}
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
                {visibleHabits.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartResponsiveContainer>
        </ChartContainer>
        {remainingHabits.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">More habits</p>
              <Badge variant="outline">{remainingHabits.length} more</Badge>
            </div>
            <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
              {remainingHabits.map((habit) => (
                <div
                  key={habit.habitId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/45 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {habit.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {habit.missedOpportunities} missed of{" "}
                      {habit.opportunities} chances
                    </p>
                  </div>
                  <Badge variant="outline">{habit.completionRate}%</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
