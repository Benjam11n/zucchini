import type { HabitsApi } from "@/shared/contracts/habits-ipc";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export interface WeeklyReviewStateSnapshot {
  overview: WeeklyReviewOverview;
  selectedWeeklyReview: WeeklyReview | null;
}

export async function loadWeeklyReviewState(
  habitsApi: Pick<HabitsApi, "getWeeklyReview" | "getWeeklyReviewOverview">,
  previousSelectedWeeklyReview: WeeklyReview | null
): Promise<WeeklyReviewStateSnapshot> {
  const overview = await habitsApi.getWeeklyReviewOverview();
  const selectedWeekStart = previousSelectedWeeklyReview?.weekStart ?? null;

  if (!selectedWeekStart) {
    return {
      overview,
      selectedWeeklyReview: overview.latestReview,
    };
  }

  if (
    !overview.availableWeeks.some(
      (week) => week.weekStart === selectedWeekStart
    )
  ) {
    return {
      overview,
      selectedWeeklyReview: overview.latestReview,
    };
  }

  if (overview.latestReview?.weekStart === selectedWeekStart) {
    return {
      overview,
      selectedWeeklyReview: overview.latestReview,
    };
  }

  return {
    overview,
    selectedWeeklyReview: await habitsApi.getWeeklyReview(selectedWeekStart),
  };
}
