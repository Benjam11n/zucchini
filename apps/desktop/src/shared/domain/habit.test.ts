import { describe, expect, it } from "vitest";

import { isHabitActiveOnDate } from "./habit";
import type { Habit } from "./habit";

const dailyHabit: Habit = {
  category: "productivity",
  createdAt: "2026-03-01T00:00:00.000Z",
  frequency: "daily",
  id: 1,
  isArchived: false,
  name: "Read",
  pausedAt: null,
  selectedWeekdays: null,
  sortOrder: 0,
  targetCount: 1,
};

describe("habit pause helpers", () => {
  it("keeps a paused habit active before the pause date", () => {
    const habit = {
      ...dailyHabit,
      pausedAt: "2026-03-08T09:00:00.000Z",
    };

    expect(isHabitActiveOnDate(habit, "2026-03-07")).toBe(true);
    expect(isHabitActiveOnDate(habit, "2026-03-08")).toBe(false);
    expect(isHabitActiveOnDate(habit, "2026-03-09")).toBe(false);
  });

  it("derives the pause date from the provided timezone", () => {
    const habit = {
      ...dailyHabit,
      pausedAt: "2026-03-07T16:30:00.000Z",
    };

    expect(isHabitActiveOnDate(habit, "2026-03-07", "Asia/Singapore")).toBe(
      true
    );
    expect(isHabitActiveOnDate(habit, "2026-03-08", "Asia/Singapore")).toBe(
      false
    );
    expect(isHabitActiveOnDate(habit, "2026-03-07", "UTC")).toBe(false);
  });

  it("uses closed pause periods when the habit is currently resumed", () => {
    const pausePeriods = [
      {
        habitId: 1,
        pausedAt: "2026-03-08T09:00:00.000Z",
        resumedAt: "2026-03-10T09:00:00.000Z",
      },
    ];

    expect(
      isHabitActiveOnDate(dailyHabit, "2026-03-07", "UTC", pausePeriods)
    ).toBe(true);
    expect(
      isHabitActiveOnDate(dailyHabit, "2026-03-08", "UTC", pausePeriods)
    ).toBe(false);
    expect(
      isHabitActiveOnDate(dailyHabit, "2026-03-09", "UTC", pausePeriods)
    ).toBe(false);
    expect(
      isHabitActiveOnDate(dailyHabit, "2026-03-10", "UTC", pausePeriods)
    ).toBe(true);
  });
});
