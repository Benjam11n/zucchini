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

  const uniqueDailyHabits = [
    ...new Map(
      day.habits
        .filter((habit: HabitWithStatus) => habit.frequency === "daily")
        .map((habit: HabitWithStatus) => [habit.id, habit])
    ).values(),
  ];

  return {
    completed: uniqueDailyHabits.filter((habit) => habit.completed).length,
    total: uniqueDailyHabits.length,
  };
}
