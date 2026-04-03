/* eslint-disable promise/prefer-await-to-then */

import { Suspense, lazy } from "react";

import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { Spinner } from "@/renderer/shared/components/ui/spinner";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewDailyCadenceChartProps {
  review: WeeklyReview;
}

function WeeklyReviewChartFallback() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
        <Spinner className="size-4 text-primary/70" />
        Loading chart...
      </CardContent>
    </Card>
  );
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
