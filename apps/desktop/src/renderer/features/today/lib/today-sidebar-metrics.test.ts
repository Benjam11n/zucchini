import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { TodayState } from "@/shared/read-models/today-state";

import {
  getMonthToDateConsistencySummary,
  getTodayCompletion,
  getWeekCompletionSeries,
} from "./today-sidebar-metrics";

function habit(id: number, completed: boolean): HabitWithStatus {
  return {
    category: "productivity",
    completed,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id,
  };
}

function todayState(habits: HabitWithStatus[]): TodayState {
  return {
    date: "2026-03-13",
    dayStatus: null,
    focusMinutes: 0,
    habits,
    settings: createDefaultAppSettings("Asia/Singapore"),
    streak: {
      availableFreezes: 1,
      bestStreak: 6,
      currentStreak: 4,
      lastEvaluatedDate: "2026-03-12",
    },
  };
}

function historyDay(date: string, habits: HabitWithStatus[]): HistoryDay {
  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits,
    summary: {
      allCompleted: habits.every((item) => item.completed),
      completedAt: null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 0,
    },
  };
}

describe("today sidebar metrics", () => {
  it("calculates today's daily habit completion", () => {
    expect(getTodayCompletion([habit(1, true), habit(2, false)])).toEqual({
      completed: 1,
      percent: 50,
      total: 2,
    });
  });

  it("builds a Sunday-start week series with today included", () => {
    const state = todayState([habit(1, true), habit(2, false)]);
    const series = getWeekCompletionSeries(
      [historyDay("2026-03-11", [habit(3, true)])],
      state
    );

    expect(series.map((day) => day.date)).toEqual([
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
    ]);
    expect(series[3]).toMatchObject({ completed: 1, percent: 100, total: 1 });
    expect(series[5]).toMatchObject({ completed: 1, percent: 50, total: 2 });
  });

  it("calculates month-to-date consistency from completed elapsed days", () => {
    const state = todayState([habit(1, true), habit(2, true)]);
    const consistency = getMonthToDateConsistencySummary(
      [
        historyDay("2026-03-01", [habit(5, true)]),
        historyDay("2026-03-11", [habit(3, true)]),
        historyDay("2026-03-12", [habit(4, false)]),
      ],
      state
    );

    expect(consistency).toMatchObject({
      completedDays: 3,
      percent: 23,
      totalDays: 13,
    });
  });

  it("builds an elapsed month consistency dot summary", () => {
    const state = todayState([habit(1, true), habit(2, true)]);
    const consistency = getMonthToDateConsistencySummary(
      [
        historyDay("2026-03-11", [habit(3, true)]),
        historyDay("2026-03-12", [habit(4, false)]),
      ],
      state
    );

    expect(consistency).toMatchObject({
      completedDays: 2,
      percent: 15,
      totalDays: 13,
    });
    expect(consistency.days).toHaveLength(13);
    expect(consistency.days[0]).toEqual({
      completed: false,
      date: "2026-03-01",
    });
    expect(consistency.days.slice(-3)).toEqual([
      { completed: true, date: "2026-03-11" },
      { completed: false, date: "2026-03-12" },
      { completed: true, date: "2026-03-13" },
    ]);
  });

  it("limits consistency to today on the first day of the month", () => {
    const state = {
      ...todayState([habit(1, true), habit(2, true)]),
      date: "2026-04-01",
    };
    const consistency = getMonthToDateConsistencySummary(
      [historyDay("2026-03-31", [habit(3, true)])],
      state
    );

    expect(consistency).toMatchObject({
      completedDays: 1,
      percent: 100,
      totalDays: 1,
    });
    expect(consistency.days).toEqual([{ completed: true, date: "2026-04-01" }]);
  });
});
