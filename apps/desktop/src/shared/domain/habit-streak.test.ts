import type { HabitWeekday, HabitWithStatus } from "@/shared/domain/habit";

import { calculateHabitStreak } from "./habit-streak";
import type { HabitStreakDay } from "./habit-streak";

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

function streakDay(
  date: string,
  completed: boolean,
  overrides: Partial<HabitStreakDay> = {},
  habitOverrides: Partial<HabitWithStatus> = {}
): HabitStreakDay {
  return {
    date,
    dayStatus: null,
    freezeUsed: false,
    habits: [habit(completed, habitOverrides)],
    isOpenToday: false,
    ...overrides,
  };
}

describe("habit streaks", () => {
  it("counts consecutive completed scheduled days", () => {
    expect(
      calculateHabitStreak(1, [
        streakDay("2026-03-10", true),
        streakDay("2026-03-11", true),
        streakDay("2026-03-12", true),
        streakDay("2026-03-13", true, { isOpenToday: true }),
      ])
    ).toEqual({ bestStreak: 4, currentStreak: 4 });
  });

  it("breaks on a missed closed scheduled day", () => {
    expect(
      calculateHabitStreak(1, [
        streakDay("2026-03-10", true),
        streakDay("2026-03-11", false),
        streakDay("2026-03-12", true),
        streakDay("2026-03-13", true, { isOpenToday: true }),
      ])
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("does not break current streak for incomplete open today", () => {
    expect(
      calculateHabitStreak(1, [
        streakDay("2026-03-11", true),
        streakDay("2026-03-12", true),
        streakDay("2026-03-13", false, { isOpenToday: true }),
      ])
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("skips unscheduled weekdays", () => {
    const selectedWeekdays: HabitWeekday[] = [1, 3, 5];

    expect(
      calculateHabitStreak(1, [
        streakDay("2026-03-09", true, {}, { selectedWeekdays }),
        streakDay("2026-03-11", true, {}, { selectedWeekdays }),
        streakDay(
          "2026-03-13",
          true,
          { isOpenToday: true },
          { selectedWeekdays }
        ),
      ])
    ).toEqual({ bestStreak: 3, currentStreak: 3 });
  });

  it("skips sick and freeze days", () => {
    expect(
      calculateHabitStreak(1, [
        streakDay("2026-03-10", true),
        streakDay("2026-03-11", false, { dayStatus: "sick" }),
        streakDay("2026-03-12", false, { freezeUsed: true }),
        streakDay("2026-03-13", true, { isOpenToday: true }),
      ])
    ).toEqual({ bestStreak: 2, currentStreak: 2 });
  });

  it("returns zeroes when the habit has no tracked days", () => {
    expect(calculateHabitStreak(99, [])).toEqual({
      bestStreak: 0,
      currentStreak: 0,
    });
  });
});
