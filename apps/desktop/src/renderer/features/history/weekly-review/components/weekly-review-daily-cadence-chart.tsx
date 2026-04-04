/* eslint-disable promise/prefer-await-to-then */

import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewDailyCadenceChartProps {
  review: WeeklyReview;
}

const WeeklyReviewDailyCadenceChartImpl = lazy(() =>
  import("./weekly-review-daily-cadence-chart-impl").then((module) => ({
    default: module.WeeklyReviewDailyCadenceChartImpl,
  }))
);

export function WeeklyReviewDailyCadenceChart({
  review,
}: WeeklyReviewDailyCadenceChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewDailyCadenceChartImpl review={review} />
    </Suspense>
  );
}
