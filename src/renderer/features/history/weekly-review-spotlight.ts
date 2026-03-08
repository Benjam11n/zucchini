import type { WeeklyReview } from "@/shared/domain/weekly-review";
import { isMonday } from "@/shared/utils/date";

interface ShouldOpenWeeklyReviewSpotlightOptions {
  bootPhase: "error" | "loading" | "ready";
  lastSeenWeeklyReviewStart: string | null;
  latestReview: WeeklyReview | null;
  todayKey: string | null;
  weeklyReviewPhase: "error" | "idle" | "loading" | "ready";
}

export function shouldOpenWeeklyReviewSpotlight({
  bootPhase,
  lastSeenWeeklyReviewStart,
  latestReview,
  todayKey,
  weeklyReviewPhase,
}: ShouldOpenWeeklyReviewSpotlightOptions): boolean {
  if (bootPhase !== "ready" || weeklyReviewPhase !== "ready") {
    return false;
  }

  if (!todayKey || !latestReview || !isMonday(todayKey)) {
    return false;
  }

  return latestReview.weekStart !== lastSeenWeeklyReviewStart;
}
