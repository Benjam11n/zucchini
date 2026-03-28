/**
 * History domain shape used by the renderer and weekly review features.
 *
 * A history day is the read-model version of one tracked calendar day: which
 * habits existed, how each category performed, and the streak summary after
 * that day closed.
 */
import type { HabitCategoryProgress, HabitWithStatus } from "./habit";
import type { DailySummary } from "./streak";

export interface HistoryDay {
  categoryProgress: HabitCategoryProgress[];
  date: string;
  habits: HabitWithStatus[];
  summary: DailySummary;
}
