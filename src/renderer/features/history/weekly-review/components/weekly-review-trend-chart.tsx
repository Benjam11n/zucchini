import { Suspense, lazy } from "react";

import { Card, CardContent } from "@/renderer/shared/ui/card";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

interface WeeklyReviewTrendChartProps {
  trend: WeeklyReviewTrendPoint[];
}

const WeeklyReviewTrendChartImpl = lazy(async () =>
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

function WeeklyReviewChartFallback() {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
        <Spinner className="size-4 text-primary/70" />
        Loading chart...
      </CardContent>
    </Card>
  );
}
