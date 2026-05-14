import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReviewHabitHeatmapRow } from "@/shared/domain/weekly-review";

interface WeeklyReviewHabitChartProps {
  heatmapRows: WeeklyReviewHabitHeatmapRow[];
}

const WeeklyReviewHabitChartImpl = lazy(async () => {
  const module = await import("./weekly-review-habit-chart-impl");
  return {
    default: module.WeeklyReviewHabitChartImpl,
  };
});

export function WeeklyReviewHabitChart({
  heatmapRows,
}: WeeklyReviewHabitChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewHabitChartImpl heatmapRows={heatmapRows} />
    </Suspense>
  );
}
