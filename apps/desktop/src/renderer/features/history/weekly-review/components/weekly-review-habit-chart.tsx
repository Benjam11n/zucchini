/* eslint-disable promise/prefer-await-to-then */

import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

interface WeeklyReviewHabitChartProps {
  habitMetrics: WeeklyReviewHabitMetric[];
}

const WeeklyReviewHabitChartImpl = lazy(() =>
  import("./weekly-review-habit-chart-impl").then((module) => ({
    default: module.WeeklyReviewHabitChartImpl,
  }))
);

export function WeeklyReviewHabitChart({
  habitMetrics,
}: WeeklyReviewHabitChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewHabitChartImpl habitMetrics={habitMetrics} />
    </Suspense>
  );
}
