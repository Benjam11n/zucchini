import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

interface WeeklyReviewStateSnapshot {
  overview: WeeklyReviewOverview;
  selectedWeeklyReview: WeeklyReview | null;
}

interface WeeklyReviewLoader {
  getWeeklyReview: (weekStart: string) => Promise<WeeklyReview>;
  getWeeklyReviewOverview: () => Promise<WeeklyReviewOverview>;
}

export async function loadWeeklyReviewState(
  habitsApi: WeeklyReviewLoader,
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
