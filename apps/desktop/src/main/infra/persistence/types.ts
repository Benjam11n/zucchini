/**
 * Persistence layer type definitions.
 *
 * Re-exports Drizzle inferred row types for each table and defines
 * the `HabitPeriodStatusSnapshot` shape used by the history and
 * weekly review query pipelines.
 */
import type {
  dailySummary,
  focusSessions,
  habits,
  habitPeriodStatus,
  streakState,
} from "@/main/infra/db/schema";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export type HabitRow = typeof habits.$inferSelect;
export type HabitPeriodStatusRow = typeof habitPeriodStatus.$inferSelect;
export type DailySummaryRow = typeof dailySummary.$inferSelect;
export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type StreakStateRow = typeof streakState.$inferSelect;

export interface HabitPeriodStatusSnapshot {
  category: HabitCategory;
  completed: boolean;
  completedCount?: number;
  frequency: HabitFrequency;
  habitId: number;
  name: string;
  periodEnd: string;
  periodStart: string;
  selectedWeekdays?: HabitWeekday[] | null;
  sortOrder: number;
  targetCount?: number;
}
