import type { WeeklyReview } from "@/shared/domain/weekly-review";

import { shouldOpenWeeklyReviewSpotlight } from "./weekly-review-spotlight";

const latestReview: WeeklyReview = {
  completedDays: 5,
  completionRate: 71,
  dailyCadence: [],
  endingStreak: 6,
  freezeDays: 1,
  habitMetrics: [],
  label: "Mar 2 - Mar 8",
  longestCleanRun: 3,
  missedDays: 1,
  mostMissedHabits: [],
  trackedDays: 7,
  weekEnd: "2026-03-08",
  weekStart: "2026-03-02",
};

describe("shouldOpenWeeklyReviewSpotlight()", () => {
  it("opens when boot is ready, review data is ready, it is Monday, and the week is unseen", () => {
    expect(
      shouldOpenWeeklyReviewSpotlight({
        bootPhase: "ready",
        lastSeenWeeklyReviewStart: null,
        latestReview,
        todayKey: "2026-03-09",
        weeklyReviewPhase: "ready",
      })
    ).toBeTruthy();
  });

  it("does not open on non-Mondays", () => {
    expect(
      shouldOpenWeeklyReviewSpotlight({
        bootPhase: "ready",
        lastSeenWeeklyReviewStart: null,
        latestReview,
        todayKey: "2026-03-10",
        weeklyReviewPhase: "ready",
      })
    ).toBeFalsy();
  });

  it("does not open when the latest review was already seen", () => {
    expect(
      shouldOpenWeeklyReviewSpotlight({
        bootPhase: "ready",
        lastSeenWeeklyReviewStart: "2026-03-02",
        latestReview,
        todayKey: "2026-03-09",
        weeklyReviewPhase: "ready",
      })
    ).toBeFalsy();
  });
});
