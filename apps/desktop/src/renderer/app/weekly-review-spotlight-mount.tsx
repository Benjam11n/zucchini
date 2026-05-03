import { lazy, Suspense } from "react";

import type { ReadyAppController } from "@/renderer/app/app-root";

const WeeklyReviewSpotlightDialog = lazy(async () => {
  const module =
    await import("@/renderer/features/history/weekly-review/components/weekly-review-spotlight-dialog");

  return { default: module.WeeklyReviewSpotlightDialog };
});

export function WeeklyReviewSpotlightMount({
  actions,
  state,
}: ReadyAppController) {
  if (
    !state.isWeeklyReviewSpotlightOpen ||
    !state.weeklyReviewOverview?.latestReview
  ) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <WeeklyReviewSpotlightDialog
        onDismiss={actions.handleDismissWeeklyReviewSpotlight}
        onOpenReview={actions.handleWeeklyReviewOpen}
        open={state.isWeeklyReviewSpotlightOpen}
        review={state.weeklyReviewOverview.latestReview}
      />
    </Suspense>
  );
}
