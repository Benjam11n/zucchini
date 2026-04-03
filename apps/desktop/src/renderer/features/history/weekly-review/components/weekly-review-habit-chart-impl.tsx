import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { buildWeeklyReviewHabitChartState } from "@/renderer/features/history/weekly-review/lib/weekly-review-habit-chart";
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
import {
  getHabitCategoryColor,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
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
  const categoryPreferences = useHabitCategoryPreferences();
  const { chartHeight, viewportHeight, visibleHabits } =
    buildWeeklyReviewHabitChartState(habitMetrics, (category) =>
      getHabitCategoryColor(category, categoryPreferences)
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit completion</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="overflow-y-auto p-2"
          config={chartConfig}
          style={{
            height: `${viewportHeight}px`,
          }}
        >
          <div style={{ height: `${chartHeight}px` }}>
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
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
