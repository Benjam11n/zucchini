import { ACTIVITY_RING_ORDER } from "@/renderer/shared/components/activity-ring/constants";
import type { Habit } from "@/shared/domain/habit";

type DropPosition = "after" | "before";

const HABIT_CATEGORY_ORDER = new Map(
  ACTIVITY_RING_ORDER.map((category, index) => [category, index])
);

export function reorderHabitListByIndex(
  habits: Habit[],
  fromIndex: number,
  toIndex: number
): Habit[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= habits.length ||
    toIndex >= habits.length
  ) {
    return habits;
  }

  const nextHabits = [...habits];
  const [movedHabit] = nextHabits.splice(fromIndex, 1);

  if (!movedHabit) {
    return habits;
  }

  nextHabits.splice(toIndex, 0, movedHabit);

  return nextHabits.map((habit, index) => ({
    ...habit,
    sortOrder: index,
  }));
}

export function reorderHabitList(
  habits: Habit[],
  habitId: number,
  direction: -1 | 1
): Habit[] {
  const index = habits.findIndex((habit) => habit.id === habitId);
  return reorderHabitListByIndex(habits, index, index + direction);
}

export function reorderHabitListByDropPosition(
  habits: Habit[],
  draggedHabitId: number,
  targetHabitId: number,
  position: DropPosition
): Habit[] {
  const sourceIndex = habits.findIndex((habit) => habit.id === draggedHabitId);
  const targetIndex = habits.findIndex((habit) => habit.id === targetHabitId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return habits;
  }

  let nextIndex = targetIndex;

  if (position === "before") {
    nextIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  } else if (sourceIndex >= targetIndex) {
    nextIndex = targetIndex + 1;
  }

  return reorderHabitListByIndex(habits, sourceIndex, nextIndex);
}

export function sortHabitListByCategory(habits: Habit[]): Habit[] {
  const nextHabits = habits
    .map((habit, index) => ({
      categoryIndex:
        HABIT_CATEGORY_ORDER.get(habit.category) ?? Number.MAX_SAFE_INTEGER,
      habit,
      index,
    }))
    .toSorted((left, right) => {
      if (left.categoryIndex !== right.categoryIndex) {
        return left.categoryIndex - right.categoryIndex;
      }

      if (left.habit.sortOrder !== right.habit.sortOrder) {
        return left.habit.sortOrder - right.habit.sortOrder;
      }

      return left.index - right.index;
    })
    .map(({ habit }, index) => ({
      ...habit,
      sortOrder: index,
    }));

  const isUnchanged = nextHabits.every(
    (habit, index) =>
      habit.id === habits[index]?.id && habit.sortOrder === index
  );

  return isUnchanged ? habits : nextHabits;
}
