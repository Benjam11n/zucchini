/* eslint-disable promise/prefer-await-to-then */

import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

interface WeeklyReviewTrendChartProps {
  trend: WeeklyReviewTrendPoint[];
}

const WeeklyReviewTrendChartImpl = lazy(() =>
  import("./weekly-review-trend-chart-impl").then((module) => ({
    default: module.WeeklyReviewTrendChartImpl,
  }))
);

export function WeeklyReviewTrendChart({ trend }: WeeklyReviewTrendChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewTrendChartImpl trend={trend} />
    </Suspense>
  );
}
