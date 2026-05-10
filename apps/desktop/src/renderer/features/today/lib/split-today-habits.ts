import { isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface SplitTodayHabits {
  completedDailyHabitCount: number;
  dailyHabits: HabitWithStatus[];
  periodicHabits: HabitWithStatus[];
}

export function splitTodayHabits(habits: HabitWithStatus[]): SplitTodayHabits {
  const dailyHabits: HabitWithStatus[] = [];
  const periodicHabits: HabitWithStatus[] = [];
  let completedDailyHabitCount = 0;

  for (const habit of habits) {
    if (isDailyHabit(habit)) {
      dailyHabits.push(habit);
      if (habit.completed) {
        completedDailyHabitCount += 1;
      }
      continue;
    }

    periodicHabits.push(habit);
  }

  return {
    completedDailyHabitCount,
    dailyHabits,
    periodicHabits,
  };
}
