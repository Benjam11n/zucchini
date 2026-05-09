import {
  reorderHabitList,
  reorderHabitListByDropPosition,
  sortHabitListByCategory,
} from "@/renderer/shared/lib/reorder-habits";
import type { HabitWithStatus } from "@/shared/domain/habit";

function createHabit(
  id: number,
  overrides: Partial<HabitWithStatus> = {}
): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
    ...overrides,
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

  it("rewrites sortOrder values to match the reordered positions", () => {
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    expect(
      reorderHabitListByDropPosition(habits, 1, 3, "after").map(
        (habit) => habit.sortOrder
      )
    ).toStrictEqual([0, 1, 2]);
    expect(
      reorderHabitListByDropPosition(habits, 1, 3, "after").map(
        (habit) => habit.id
      )
    ).toStrictEqual([2, 3, 1]);
  });

  it("reorders by drag-and-drop position and normalizes sort orders", () => {
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    expect(
      reorderHabitListByDropPosition(habits, 1, 3, "after").map(
        (habit) => habit.id
      )
    ).toStrictEqual([2, 3, 1]);
    expect(
      reorderHabitListByDropPosition(habits, 1, 3, "after").map(
        (habit) => habit.sortOrder
      )
    ).toStrictEqual([0, 1, 2]);
  });

  it("auto sorts habits by ring category order and preserves intra-category order", () => {
    const habits = [
      createHabit(1, { category: "productivity", sortOrder: 0 }),
      createHabit(2, { category: "fitness", sortOrder: 1 }),
      createHabit(3, { category: "nutrition", sortOrder: 2 }),
      createHabit(4, { category: "fitness", sortOrder: 3 }),
      createHabit(5, { category: "nutrition", sortOrder: 4 }),
    ];

    expect(
      sortHabitListByCategory(habits).map((habit) => habit.id)
    ).toStrictEqual([2, 4, 3, 5, 1]);
    expect(
      sortHabitListByCategory(habits).map((habit) => habit.sortOrder)
    ).toStrictEqual([0, 1, 2, 3, 4]);
  });

  it("returns the original list when auto sort would not change the order", () => {
    const habits = [
      createHabit(1, { category: "fitness", sortOrder: 0 }),
      createHabit(2, { category: "nutrition", sortOrder: 1 }),
      createHabit(3, { category: "productivity", sortOrder: 2 }),
    ];

    expect(sortHabitListByCategory(habits)).toBe(habits);
  });
});
