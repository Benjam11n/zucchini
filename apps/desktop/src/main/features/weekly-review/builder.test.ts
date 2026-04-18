import type { DailySummary } from "@/shared/domain/streak";
import { addDays } from "@/shared/utils/date";

import { buildWeeklyReview, buildWeeklyReviewOverview } from "./builder";

function createSummary(
  date: string,
  summary: Partial<DailySummary> = {}
): DailySummary {
  const { dayStatus = null, ...rest } = summary;

  return {
    allCompleted: false,
    completedAt: null,
    date,
    dayStatus,
    freezeUsed: false,
    streakCountAfterDay: 0,
    ...rest,
  };
}

function createStatus(
  habitId: number,
  periodEnd: string,
  completed: boolean,
  overrides: Partial<{
    category: "fitness" | "nutrition" | "productivity";
    completedCount: number;
    frequency: "daily" | "monthly" | "weekly";
    name: string;
    periodStart: string;
    sortOrder: number;
    targetCount: number;
  }> = {}
) {
  return {
    category: overrides.category ?? "productivity",
    completed,
    completedCount:
      overrides.completedCount ??
      (completed ? (overrides.targetCount ?? 1) : 0),
    frequency: overrides.frequency ?? "daily",
    habitId,
    name: overrides.name ?? `Habit ${habitId}`,
    periodEnd,
    periodStart: overrides.periodStart ?? periodEnd,
    sortOrder: overrides.sortOrder ?? habitId - 1,
    targetCount: overrides.targetCount ?? 1,
  } as const;
}

describe("buildWeeklyReview()", () => {
  it("builds a complete daily-only week", () => {
    const weekStart = "2026-03-02";
    const summaries = [
      createSummary("2026-03-02", {
        allCompleted: true,
        streakCountAfterDay: 1,
      }),
      createSummary("2026-03-03", {
        allCompleted: true,
        streakCountAfterDay: 2,
      }),
      createSummary("2026-03-04", {
        allCompleted: true,
        streakCountAfterDay: 3,
      }),
      createSummary("2026-03-05", {
        allCompleted: true,
        streakCountAfterDay: 4,
      }),
      createSummary("2026-03-06", {
        allCompleted: true,
        streakCountAfterDay: 5,
      }),
      createSummary("2026-03-07", {
        allCompleted: true,
        streakCountAfterDay: 6,
      }),
      createSummary("2026-03-08", {
        allCompleted: true,
        streakCountAfterDay: 7,
      }),
    ];
    const statuses = summaries.flatMap((summary) => [
      createStatus(1, summary.date, true),
      createStatus(2, summary.date, true, {
        category: "fitness",
        name: "Move",
        sortOrder: 1,
      }),
    ]);

    const review = buildWeeklyReview({
      dailySummaries: summaries,
      focusSessions: [],
      habitStatuses: statuses,
      weekStart,
    });

    expect({
      completedDays: review.completedDays,
      completionRate: review.completionRate,
      endingStreak: review.endingStreak,
      focusMinutes: review.focusMinutes,
      freezeDays: review.freezeDays,
      longestCleanRun: review.longestCleanRun,
      missedDays: review.missedDays,
      trackedDays: review.trackedDays,
    }).toStrictEqual({
      completedDays: 7,
      completionRate: 100,
      endingStreak: 7,
      focusMinutes: 0,
      freezeDays: 0,
      longestCleanRun: 7,
      missedDays: 0,
      trackedDays: 7,
    });
    expect(
      review.dailyCadence.every((point) => point.completionRate === 100)
    ).toBeTruthy();
    expect(review.habitMetrics[0]).toMatchObject({
      completedOpportunities: 7,
      completionRate: 100,
      missedOpportunities: 0,
      opportunities: 7,
    });
  });

  it("counts freeze days and missed habits separately", () => {
    const review = buildWeeklyReview({
      dailySummaries: [
        createSummary("2026-03-02", {
          allCompleted: true,
          streakCountAfterDay: 4,
        }),
        createSummary("2026-03-03", {
          freezeUsed: true,
          streakCountAfterDay: 4,
        }),
        createSummary("2026-03-04", {
          streakCountAfterDay: 0,
        }),
      ],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-02", true),
        createStatus(1, "2026-03-03", false),
        createStatus(1, "2026-03-04", false),
      ],
      weekStart: "2026-03-02",
    });

    expect({
      completedDays: review.completedDays,
      freezeDay: review.dailyCadence[1],
      freezeDays: review.freezeDays,
      longestCleanRun: review.longestCleanRun,
      missedDay: review.dailyCadence[2],
      missedDays: review.missedDays,
    }).toMatchObject({
      completedDays: 1,
      freezeDay: {
        completionRate: 0,
        status: "freeze",
      },
      freezeDays: 1,
      longestCleanRun: 1,
      missedDay: {
        completionRate: 0,
        status: "missed",
      },
      missedDays: 1,
    });
  });

  it("includes weekly habits in the selected review week and excludes monthly habits without opportunities", () => {
    const review = buildWeeklyReview({
      dailySummaries: [createSummary("2026-03-02", { allCompleted: true })],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-02", true),
        createStatus(2, "2026-03-08", false, {
          frequency: "weekly",
          name: "Weekly planning",
          periodStart: "2026-03-01",
          sortOrder: 1,
        }),
        createStatus(3, "2026-03-31", true, {
          frequency: "monthly",
          name: "Monthly reset",
          periodStart: "2026-03-01",
          sortOrder: 2,
        }),
      ],
      weekStart: "2026-03-02",
    });

    expect(review.habitMetrics.map((metric) => metric.name)).toStrictEqual([
      "Habit 1",
      "Weekly planning",
    ]);
    expect(review.completionRate).toBe(50);
    expect(review.mostMissedHabits[0]).toMatchObject({
      missedOpportunities: 1,
      name: "Weekly planning",
      opportunities: 1,
    });
  });

  it("uses habit opportunities for completion rate when a week has no daily summaries", () => {
    const review = buildWeeklyReview({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(7, "2026-03-08", true, {
          frequency: "weekly",
          name: "Weekly reset",
          periodStart: "2026-03-01",
        }),
      ],
      weekStart: "2026-03-02",
    });

    expect(review.completionRate).toBe(100);
    expect(review.trackedDays).toBe(0);
    expect(review.habitMetrics[0]).toMatchObject({
      completedOpportunities: 1,
      name: "Weekly reset",
      opportunities: 1,
    });
  });

  it("uses partial weekly progress in completion and missed calculations", () => {
    const review = buildWeeklyReview({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(7, "2026-03-08", false, {
          completedCount: 2,
          frequency: "weekly",
          name: "Weekly reset",
          periodStart: "2026-03-02",
          targetCount: 3,
        }),
      ],
      weekStart: "2026-03-02",
    });

    expect(review.completionRate).toBe(67);
    expect(review.habitMetrics[0]).toMatchObject({
      completedOpportunities: 2,
      completionRate: 67,
      missedOpportunities: 1,
      opportunities: 3,
    });
    expect(review.mostMissedHabits[0]).toMatchObject({
      missedOpportunities: 1,
      name: "Weekly reset",
    });
  });

  it("uses the latest habit snapshot when a habit is renamed mid-week", () => {
    const review = buildWeeklyReview({
      dailySummaries: [
        createSummary("2026-03-02", {
          allCompleted: true,
        }),
        createSummary("2026-03-03", {
          allCompleted: true,
        }),
      ],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-02", true, {
          name: "Make buried chapters videp hasbit",
        }),
        createStatus(1, "2026-03-03", true, {
          name: "Make buried chapters video",
        }),
      ],
      weekStart: "2026-03-02",
    });

    expect(review.habitMetrics[0]?.name).toBe("Make buried chapters video");
  });

  it("aggregates focus minutes for the selected week", () => {
    const review = buildWeeklyReview({
      dailySummaries: [createSummary("2026-03-02", { allCompleted: true })],
      focusSessions: [
        {
          completedAt: "2026-03-02T09:25:00.000Z",
          completedDate: "2026-03-02",
          durationSeconds: 1500,
          entryKind: "completed",
          id: 1,
          startedAt: "2026-03-02T09:00:00.000Z",
          timerSessionId: "timer-1",
        },
        {
          completedAt: "2026-03-04T11:15:00.000Z",
          completedDate: "2026-03-04",
          durationSeconds: 900,
          entryKind: "partial",
          id: 2,
          startedAt: "2026-03-04T11:00:00.000Z",
          timerSessionId: "timer-2",
        },
      ],
      habitStatuses: [createStatus(1, "2026-03-02", true)],
      weekStart: "2026-03-02",
    });

    expect(review.focusMinutes).toBe(40);
  });
});

describe("buildWeeklyReviewOverview()", () => {
  it("builds the latest review and the last eight trend points", () => {
    const dailySummaries = Array.from({ length: 9 }, (_, index) => {
      const weekStart = addDays("2026-01-05", index * 7);
      return createSummary(weekStart, {
        allCompleted: index % 2 === 0,
        streakCountAfterDay: index + 1,
      });
    });
    const habitStatuses = dailySummaries.map((summary, index) =>
      createStatus(index + 1, summary.date, summary.allCompleted, {
        name: `Habit ${index + 1}`,
      })
    );

    const overview = buildWeeklyReviewOverview({
      dailySummaries,
      focusSessions: dailySummaries.map((summary, index) => ({
        completedAt: `${summary.date}T09:01:00.000Z`,
        completedDate: summary.date,
        durationSeconds: (index + 1) * 60,
        entryKind: "completed",
        id: index + 1,
        startedAt: `${summary.date}T09:00:00.000Z`,
        timerSessionId: `timer-${index + 1}`,
      })),
      habitStatuses,
    });

    expect(overview.latestReview?.weekStart).toBe("2026-03-02");
    expect(overview.availableWeeks).toHaveLength(9);
    expect(overview.trend).toHaveLength(8);
    expect(overview.trend[0]?.weekStart).toBe("2026-01-12");
    expect(overview.trend.at(-1)?.weekStart).toBe("2026-03-02");
    expect(overview.trend.at(-1)?.focusMinutes).toBe(9);
  });

  it("returns an empty overview when no completed weeks exist", () => {
    expect(
      buildWeeklyReviewOverview({
        dailySummaries: [],
        focusSessions: [],
        habitStatuses: [],
      })
    ).toStrictEqual({
      availableWeeks: [],
      latestReview: null,
      trend: [],
    });
  });
});
