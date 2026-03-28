import type { TodayState } from "@/shared/contracts/habits-ipc";
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
