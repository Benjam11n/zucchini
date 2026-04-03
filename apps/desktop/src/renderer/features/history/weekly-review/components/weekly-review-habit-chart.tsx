/* eslint-disable promise/prefer-await-to-then */

import { Suspense, lazy } from "react";

import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { Spinner } from "@/renderer/shared/components/ui/spinner";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

interface WeeklyReviewHabitChartProps {
  habitMetrics: WeeklyReviewHabitMetric[];
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
