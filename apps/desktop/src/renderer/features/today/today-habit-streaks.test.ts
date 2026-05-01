import type { TodayState } from "@/shared/contracts/today-state";
import type { HabitWeekday, HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { calculateHabitStreak } from "./today-habit-streaks";

function habit(
  completed: boolean,
  overrides: Partial<HabitWithStatus> = {}
): HabitWithStatus {
  return {
    category: "productivity",
    completed,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id: 1,
    isArchived: false,
    name: "Plan top task",
    sortOrder: 0,
    ...overrides,
  };
}

function historyDay(
  date: string,
  completed: boolean,
  overrides: Partial<HistoryDay> = {},
  habitOverrides: Partial<HabitWithStatus> = {}
): HistoryDay {
  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits: [habit(completed, habitOverrides)],
    summary: {
      allCompleted: completed,
      completedAt: completed ? `${date}T12:00:00.000Z` : null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 0,
    },
    ...overrides,
  };
}

function todayState(
  date: string,
  completed: boolean,
  habitOverrides: Partial<HabitWithStatus> = {}
): TodayState {
  return {
    date,
    dayStatus: null,
    focusMinutes: 0,
    habits: [habit(completed, habitOverrides)],
    settings: createDefaultAppSettings("Asia/Singapore"),
    streak: {
      availableFreezes: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastEvaluatedDate: null,
    },
  };
}

describe("today habit streaks", () => {
  it("counts consecutive completed scheduled days", () => {
    expect(
      calculateHabitStreak(
        1,
        [
          historyDay("2026-03-10", true),
          historyDay("2026-03-11", true),
          historyDay("2026-03-12", true),
        ],
        todayState("2026-03-13", true)
      )
    ).toEqual({ bestStreak: 4, currentStreak: 4 });
  });

  it("breaks on a missed closed scheduled day", () => {
    expect(
      calculateHabitStreak(
        1,
        [
          historyDay("2026-03-10", true),
          historyDay("2026-03-11", false),
          historyDay("2026-03-12", true),
        ],
        todayState("2026-03-13", true)
      )
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("does not break current streak for incomplete open today", () => {
    expect(
      calculateHabitStreak(
        1,
        [historyDay("2026-03-11", true), historyDay("2026-03-12", true)],
        todayState("2026-03-13", false)
      )
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("skips unscheduled weekdays", () => {
    const selectedWeekdays: HabitWeekday[] = [1, 3, 5];

    expect(
      calculateHabitStreak(
        1,
        [
          historyDay("2026-03-09", true, {}, { selectedWeekdays }),
          historyDay("2026-03-11", true, {}, { selectedWeekdays }),
        ],
        todayState("2026-03-13", true, { selectedWeekdays })
      )
    ).toEqual({ bestStreak: 3, currentStreak: 3 });
  });

  it("skips sick and freeze days", () => {
    expect(
      calculateHabitStreak(
        1,
        [
          historyDay("2026-03-10", true),
          historyDay("2026-03-11", false, {
            summary: {
              allCompleted: false,
              completedAt: null,
              date: "2026-03-11",
              dayStatus: "sick",
              freezeUsed: false,
              streakCountAfterDay: 1,
            },
          }),
          historyDay("2026-03-12", false, {
            summary: {
              allCompleted: false,
              completedAt: null,
              date: "2026-03-12",
              dayStatus: null,
              freezeUsed: true,
              streakCountAfterDay: 1,
            },
          }),
        ],
        todayState("2026-03-13", true)
      )
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("returns zeroes when the habit has no tracked days", () => {
    expect(
      calculateHabitStreak(99, [], todayState("2026-03-13", false))
    ).toEqual({
      bestStreak: 0,
      currentStreak: 0,
    });
  });
});
