import type { HabitWithStatus } from "@/shared/domain/habit";

import { reorderHabitList } from "./reorder-habits";

function createHabit(id: number): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
  };
}

describe("reorderHabitList()", () => {
  it("moves a habit up when a previous slot exists", () => {
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    expect(
      reorderHabitList(habits, 2, -1).map((habit) => habit.id)
    ).toStrictEqual([2, 1, 3]);
  });

  it("returns the original list when the move is out of bounds", () => {
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    expect(reorderHabitList(habits, 1, -1)).toBe(habits);
    expect(reorderHabitList(habits, 3, 1)).toBe(habits);
  });
});
