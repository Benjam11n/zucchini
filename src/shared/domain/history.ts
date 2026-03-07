import type { HabitCategoryProgress, HabitWithStatus } from "./habit";
import type { DailySummary } from "./streak";

export interface HistoryDay {
  categoryProgress: HabitCategoryProgress[];
  date: string;
  habits: HabitWithStatus[];
  summary: DailySummary;
}
