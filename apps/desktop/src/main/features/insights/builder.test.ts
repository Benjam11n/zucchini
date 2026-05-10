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
    });

    expect(dashboard.isEmpty).toBe(true);
    expect(dashboard.summary.completed.value).toBe("0");
    expect(dashboard.momentum.score).toBeGreaterThanOrEqual(0);
    expect(dashboard.weeklyCompletion).toHaveLength(8);
  });

  it("counts monthly completed opportunities, focus, perfect days, and saved streaks", () => {
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
    });

    expect(dashboard.summary.completed.value).toBe("3");
    expect(dashboard.summary.focus.value).toBe("1h 30m");
    expect(dashboard.summary.perfectDays.value).toBe("1");
    expect(dashboard.summary.savedStreaks.value).toBe("1");
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
    });
    const high = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: highStatuses,
      nowDate: "2026-03-31",
      streak,
    });

    expect(high.momentum.score).toBeGreaterThan(low.momentum.score);
  });

  it("ranks the habit leaderboard by completion rate", () => {
    const dashboard = buildInsightsDashboard({
      dailySummaries: [],
      focusSessions: [],
      habitStatuses: [
        createStatus(1, "2026-03-01", 0, { name: "Low", sortOrder: 0 }),
        createStatus(1, "2026-03-02", 1, { name: "Low", sortOrder: 0 }),
        createStatus(2, "2026-03-01", 1, { name: "High", sortOrder: 1 }),
        createStatus(2, "2026-03-02", 1, { name: "High", sortOrder: 1 }),
      ],
      nowDate: "2026-03-31",
      streak,
    });

    expect(dashboard.habitLeaderboard.map((habit) => habit.name)).toStrictEqual(
      ["High", "Low"]
    );
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
    });

    expect(
      dashboard.smartInsights.some((insight) =>
        insight.title.includes("Thursday")
      )
    ).toBe(true);
  });
});
