import { Suspense, lazy } from "react";

import { WeeklyReviewChartFallback } from "@/renderer/features/history/weekly-review/components/weekly-review-chart-fallback";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewDailyCadenceChartProps {
  review: WeeklyReview;
}

const WeeklyReviewDailyCadenceChartImpl = lazy(async () => {
  const module = await import("./weekly-review-daily-cadence-chart-impl");
  return {
    default: module.WeeklyReviewDailyCadenceChartImpl,
  };
});

export function WeeklyReviewDailyCadenceChart({
  review,
}: WeeklyReviewDailyCadenceChartProps) {
  return (
    <Suspense fallback={<WeeklyReviewChartFallback />}>
      <WeeklyReviewDailyCadenceChartImpl review={review} />
    </Suspense>
  );
}
