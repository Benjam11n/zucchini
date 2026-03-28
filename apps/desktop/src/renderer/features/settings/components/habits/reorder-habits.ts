import type { Habit } from "@/shared/domain/habit";

type DropPosition = "after" | "before";

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
