import { isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface SplitTodayHabits {
  completedCount: number;
  dailyHabits: HabitWithStatus[];
  periodicHabits: HabitWithStatus[];
}

export function splitTodayHabits(habits: HabitWithStatus[]): SplitTodayHabits {
  const dailyHabits: HabitWithStatus[] = [];
  const periodicHabits: HabitWithStatus[] = [];
  let completedCount = 0;

  for (const habit of habits) {
    if (isDailyHabit(habit)) {
      dailyHabits.push(habit);
      if (habit.completed) {
        completedCount += 1;
      }
      continue;
    }

    periodicHabits.push(habit);
  }

  return {
    completedCount,
    dailyHabits,
    periodicHabits,
  };
}
