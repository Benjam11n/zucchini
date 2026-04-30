/**
 * Reminder timing policy logic.
 *
 * Pure functions that determine whether a reminder should fire based on
 * the current time, habit period boundaries, and completion state.
 */
import type { TodayState } from "@/shared/contracts/today-state";
import { isLastDayOfHabitPeriod } from "@/shared/domain/habit-period";

export function hasIncompleteHabitsClosingToday(today: TodayState): boolean {
  return (
    today.habits.length > 0 &&
    today.habits.some(
      (habit) =>
        !habit.completed && isLastDayOfHabitPeriod(habit.frequency, today.date)
    )
  );
}
