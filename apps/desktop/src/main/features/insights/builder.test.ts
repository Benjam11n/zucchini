import type { FocusSession } from "@/shared/domain/focus-session";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import { addDays } from "@/shared/utils/date";

import { buildInsightsDashboard } from "./builder";

const streak: StreakState = {
  availableFreezes: 1,
  bestStreak: 12,
  currentStreak: 4,
  lastEvaluatedDate: "2026-03-31",
};

function createSummary(
  date: string,
  overrides: Partial<DailySummary> = {}
): DailySummary {
  const { dayStatus = null, ...rest } = overrides;

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
  date: string,
  completedCount: number,
  overrides: Partial<HabitPeriodStatusSnapshot> = {}
): HabitPeriodStatusSnapshot {
  const targetCount = overrides.targetCount ?? 1;

  return {
    category: overrides.category ?? "productivity",
    completed: completedCount >= targetCount,
    completedCount,
    frequency: overrides.frequency ?? "daily",
    habitId,
    name: overrides.name ?? `Habit ${habitId}`,
    periodEnd: date,
    periodStart: overrides.periodStart ?? date,
    sortOrder: overrides.sortOrder ?? habitId,
    targetCount,
    ...overrides,
  };
}

function createFocusSession(
  completedDate: string,
  durationSeconds: number
): FocusSession {
  return {
    completedAt: `${completedDate}T10:25:00.000Z`,
    completedDate,
    durationSeconds,
    entryKind: "completed",
    id: 1,
    startedAt: `${completedDate}T10:00:00.000Z`,
    timerSessionId: `session-${completedDate}`,
  };
}

describe("buildInsightsDashboard()", () => {
  it("returns an empty dashboard safely", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.isEmpty).toBe(true);
    expect(dashboard.summary.completed.value).toBe("0");
    expect(dashboard.momentum.score).toBeGreaterThanOrEqual(0);
    expect(dashboard.weeklyCompletion).toHaveLength(8);
  });

  it("does not show the empty state when only focus data exists", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [createFocusSession("2026-03-31", 1500)],
      habitStatuses: [],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.isEmpty).toBe(false);
    expect(dashboard.summary.focus.value).toBe("25m");
  });

  it("counts last-30-day completed opportunities, focus, perfect days, and saved streaks", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [
        createSummary("2026-03-01", { allCompleted: true }),
        createSummary("2026-03-02", { freezeUsed: true }),
        createSummary("2026-02-27", { allCompleted: true }),
      ],
      focusSessions: [
        createFocusSession("2026-03-05", 3600),
        createFocusSession("2026-03-06", 1800),
        createFocusSession("2026-02-20", 1800),
      ],
      habitStatuses: [
        createStatus(1, "2026-03-01", 1),
        createStatus(2, "2026-03-01", 2, { targetCount: 3 }),
        createStatus(1, "2026-02-20", 1),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.summary.completed.value).toBe("0");
    expect(dashboard.summary.focus.value).toBe("1h 30m");
    expect(dashboard.summary.perfectDays.value).toBe("0");
    expect(dashboard.summary.savedStreaks.value).toBe("1");
  });

  it("uses previous 30 days for summary deltas", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [
        createSummary("2026-03-02", { allCompleted: true }),
        createSummary("2026-02-15", { allCompleted: true }),
        createSummary("2026-02-16", { allCompleted: true }),
      ],
      focusSessions: [
        createFocusSession("2026-03-02", 1800),
        createFocusSession("2026-02-15", 3600),
      ],
      habitStatuses: [
        createStatus(1, "2026-03-02", 1),
        createStatus(1, "2026-02-15", 1),
        createStatus(2, "2026-02-16", 1),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.summary.completed.deltaLabel).toBe(
      "-1 vs previous period"
    );
    expect(dashboard.summary.focus.deltaLabel).toBe("-30 vs previous period");
    expect(dashboard.summary.perfectDays.deltaLabel).toBe(
      "-1 vs previous period"
    );
  });

  it("gives stronger momentum to better recent completion", () => {
    const lowStatuses = Array.from({ length: 30 }, (_, index) =>
      createStatus(1, addDays("2026-03-01", index), index < 5 ? 1 : 0)
    );
    const highStatuses = Array.from({ length: 30 }, (_, index) =>
      createStatus(1, addDays("2026-03-01", index), index < 25 ? 1 : 0)
    );

    const low = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: lowStatuses,
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });
    const high = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: highStatuses,
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(high.momentum.score).toBeGreaterThan(low.momentum.score);
  });

  it("does not include future empty buckets in momentum sparkline", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: Array.from({ length: 30 }, (_, index) =>
        createStatus(1, addDays("2026-03-02", index), 1)
      ),
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.momentum.sparkline).toHaveLength(6);
    expect(dashboard.momentum.sparkline).toStrictEqual([
      100, 100, 100, 100, 100, 100,
    ]);
  });

  it("ranks the habit leaderboard by completion rate", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-30", 0, { name: "Low", sortOrder: 0 }),
        createStatus(1, "2026-03-31", 1, { name: "Low", sortOrder: 0 }),
        createStatus(2, "2026-03-30", 1, { name: "High", sortOrder: 1 }),
        createStatus(2, "2026-03-31", 1, { name: "High", sortOrder: 1 }),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.habitLeaderboard.map((habit) => habit.name)).toStrictEqual(
      ["High", "Low"]
    );
  });

  it("does not show empty no-opportunity buckets as leaderboard trend drops", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-03", 1, {
          frequency: "weekly",
          name: "Fitness",
          periodStart: "2026-02-25",
        }),
        createStatus(1, "2026-03-10", 1, {
          frequency: "weekly",
          name: "Fitness",
          periodStart: "2026-03-04",
        }),
        createStatus(1, "2026-03-17", 1, {
          frequency: "weekly",
          name: "Fitness",
          periodStart: "2026-03-11",
        }),
        createStatus(1, "2026-03-24", 1, {
          frequency: "weekly",
          name: "Fitness",
          periodStart: "2026-03-18",
        }),
        createStatus(1, "2026-03-31", 1, {
          frequency: "weekly",
          name: "Fitness",
          periodStart: "2026-03-25",
        }),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.habitLeaderboard[0]).toMatchObject({
      completionRate: 100,
      name: "Fitness",
      trend: [100, 100, 100, 100, 100],
    });
  });

  it("excludes archived habits from status-based insights", () => {
    const dashboard = buildInsightsDashboard({
      activeHabitIds: new Set([1]),
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-31", 1, {
          name: "Active",
          sortOrder: 1,
        }),
        createStatus(2, "2026-03-31", 1, {
          name: "Archived",
          sortOrder: 0,
        }),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(dashboard.summary.completed.value).toBe("1");
    expect(dashboard.habitLeaderboard.map((habit) => habit.name)).toStrictEqual(
      ["Active"]
    );
    expect(dashboard.weeklyCompletion.at(-1)?.completedPercent).toBe(100);
  });

  it("reports the weakest weekday deterministically", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-02", 1),
        createStatus(1, "2026-03-03", 1),
        createStatus(1, "2026-03-05", 0),
        createStatus(1, "2026-03-12", 0),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "UTC",
    });

    expect(
      dashboard.smartInsights.some((insight) =>
        insight.title.includes("Thursday")
      )
    ).toBe(true);
  });

  it("builds weekday rhythm from habit completion timestamps", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-02", 1, {
          completedAt: "2026-03-03T01:30:00.000Z",
        }),
        createStatus(2, "2026-03-03", 1, {
          completedAt: "2026-03-03T02:15:00.000Z",
        }),
        createStatus(3, "2026-03-03", 0, {
          completedAt: "2026-03-03T09:30:00.000Z",
        }),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "Asia/Singapore",
    });

    expect(dashboard.weekdayRhythm.hasData).toBe(true);
    expect(
      dashboard.weekdayRhythm.cells.find(
        (cell) => cell.weekday === "Tue" && cell.timeOfDay === "Morning"
      )
    ).toMatchObject({
      completionCount: 2,
      intensity: 100,
    });
  });

  it("includes partial multi-target completions in weekday rhythm", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-03", 2, {
          completedAt: "2026-03-03T02:15:00.000Z",
          frequency: "weekly",
          targetCount: 3,
        }),
      ],
      nowDate: "2026-03-31",
      streak,
      timezone: "Asia/Singapore",
    });

    expect(dashboard.weekdayRhythm.hasData).toBe(true);
    expect(
      dashboard.weekdayRhythm.cells.find(
        (cell) => cell.weekday === "Tue" && cell.timeOfDay === "Morning"
      )
    ).toMatchObject({
      completionCount: 1,
      intensity: 100,
    });
  });
});
