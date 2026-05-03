import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

interface WeeklyReviewTrendChartProps {
  trend: WeeklyReviewTrendPoint[];
}

const WeeklyReviewTrendChartImpl = lazy(async () => {
  const module = await import("./weekly-review-trend-chart-impl");
  return {
    default: module.WeeklyReviewTrendChartImpl,
  };
});

export function WeeklyReviewTrendChart({ trend }: WeeklyReviewTrendChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewTrendChartImpl trend={trend} />
    </Suspense>
  );
}
