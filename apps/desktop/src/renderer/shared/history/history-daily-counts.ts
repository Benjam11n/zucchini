import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";

export type HistoryDailyCountDay = HistorySummaryDay &
  Partial<Pick<HistoryDay, "habits">>;

export function getHistoryDailyCounts(day: HistoryDailyCountDay): {
  completed: number;
  total: number;
} {
  let completed = 0;
  let total = 0;

  for (const category of day.categoryProgress) {
    completed += category.completed;
    total += category.total;
  }

  if (total > 0 || !day.habits) {
    return { completed, total };
  }

  const uniqueDailyHabitsById = new Map<number, HabitWithStatus>();
  for (const habit of day.habits) {
    if (habit.frequency === "daily") {
      uniqueDailyHabitsById.set(habit.id, habit);
    }
  }
  const uniqueDailyHabits = [...uniqueDailyHabitsById.values()];

  return {
    completed: uniqueDailyHabits.filter((habit) => habit.completed).length,
    total: uniqueDailyHabits.length,
  };
}
