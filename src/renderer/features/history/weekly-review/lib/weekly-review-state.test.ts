import { loadWeeklyReviewState } from "@/renderer/features/history/weekly-review/lib/weekly-review-state";
import type { HabitApi } from "@/shared/contracts/habits-ipc";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

function createReview(weekStart: string): WeeklyReview {
  return {
    completedDays: 2,
    completionRate: 50,
    dailyCadence: [],
    endingStreak: 3,
    freezeDays: 0,
    habitMetrics: [],
    label: weekStart,
    longestCleanRun: 2,
    missedDays: 1,
    mostMissedHabits: [],
    trackedDays: 3,
    weekEnd: weekStart,
    weekStart,
  };
}

function createOverview(
  latestReview: WeeklyReview | null
): WeeklyReviewOverview {
  return {
    availableWeeks: latestReview
      ? [
          {
            completionRate: latestReview.completionRate,
            label: latestReview.label,
            weekEnd: latestReview.weekEnd,
            weekStart: latestReview.weekStart,
          },
          {
            completionRate: 40,
            label: "older",
            weekEnd: "2026-02-23",
            weekStart: "2026-02-17",
          },
        ]
      : [],
    latestReview,
    trend: [],
  };
}

describe("loadWeeklyReviewState()", () => {
  it("uses the latest review when nothing is selected", async () => {
    const latestReview = createReview("2026-03-02");
    const habitsApi = {
      getWeeklyReview: vi.fn(),
      getWeeklyReviewOverview: vi
        .fn()
        .mockResolvedValue(createOverview(latestReview)),
    } satisfies Pick<HabitApi, "getWeeklyReview" | "getWeeklyReviewOverview">;

    const result = await loadWeeklyReviewState(habitsApi, null);

    expect(result.selectedWeeklyReview).toBe(latestReview);
    expect(habitsApi.getWeeklyReview).not.toHaveBeenCalled();
  });

  it("replaces a selected latest week with the refreshed latest review object", async () => {
    const staleLatestReview = createReview("2026-03-02");
    staleLatestReview.habitMetrics = [
      {
        category: "productivity",
        completedOpportunities: 1,
        completionRate: 100,
        frequency: "daily",
        habitId: 1,
        missedOpportunities: 0,
        name: "Old name",
        opportunities: 1,
        sortOrder: 0,
      },
    ];
    const freshLatestReview = createReview("2026-03-02");
    freshLatestReview.habitMetrics = [
      {
        category: "productivity",
        completedOpportunities: 1,
        completionRate: 100,
        frequency: "daily",
        habitId: 1,
        missedOpportunities: 0,
        name: "New name",
        opportunities: 1,
        sortOrder: 0,
      },
    ];
    const habitsApi = {
      getWeeklyReview: vi.fn(),
      getWeeklyReviewOverview: vi
        .fn()
        .mockResolvedValue(createOverview(freshLatestReview)),
    } satisfies Pick<HabitApi, "getWeeklyReview" | "getWeeklyReviewOverview">;

    const result = await loadWeeklyReviewState(habitsApi, staleLatestReview);

    expect(result.selectedWeeklyReview).toBe(freshLatestReview);
    expect(result.selectedWeeklyReview?.habitMetrics[0]?.name).toBe("New name");
    expect(habitsApi.getWeeklyReview).not.toHaveBeenCalled();
  });

  it("refetches a selected non-latest week that still exists", async () => {
    const latestReview = createReview("2026-03-02");
    const selectedReview = createReview("2026-02-17");
    selectedReview.habitMetrics = [
      {
        category: "productivity",
        completedOpportunities: 1,
        completionRate: 100,
        frequency: "daily",
        habitId: 1,
        missedOpportunities: 0,
        name: "Corrected name",
        opportunities: 1,
        sortOrder: 0,
      },
    ];
    const habitsApi = {
      getWeeklyReview: vi.fn().mockResolvedValue(selectedReview),
      getWeeklyReviewOverview: vi
        .fn()
        .mockResolvedValue(createOverview(latestReview)),
    } satisfies Pick<HabitApi, "getWeeklyReview" | "getWeeklyReviewOverview">;

    const result = await loadWeeklyReviewState(
      habitsApi,
      createReview("2026-02-17")
    );

    expect(habitsApi.getWeeklyReview).toHaveBeenCalledWith("2026-02-17");
    expect(result.selectedWeeklyReview).toBe(selectedReview);
  });
});
