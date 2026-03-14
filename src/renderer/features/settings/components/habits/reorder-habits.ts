import type { HabitWithStatus } from "@/shared/domain/habit";

export function reorderHabitListByIndex(
  habits: HabitWithStatus[],
  fromIndex: number,
  toIndex: number
): HabitWithStatus[] {
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
  return nextHabits;
}

export function reorderHabitList(
  habits: HabitWithStatus[],
  habitId: number,
  direction: -1 | 1
): HabitWithStatus[] {
  const index = habits.findIndex((habit) => habit.id === habitId);
  return reorderHabitListByIndex(habits, index, index + direction);
}
