/**
 * Persistence layer type definitions.
 *
 * Re-exports Drizzle inferred row types for each table and defines
 * the `HabitPeriodStatusSnapshot` shape used by the history and
 * weekly review query pipelines.
 */
import type {
  dailySummary,
  dayStatus,
  focusSessions,
  habitStreakState,
  habits,
  habitPeriodStatus,
  streakState,
  windDownActions,
} from "@/main/infra/db/schema";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export type HabitRow = typeof habits.$inferSelect;
export type HabitPeriodStatusRow = typeof habitPeriodStatus.$inferSelect;
export type DailySummaryRow = typeof dailySummary.$inferSelect;
export type DayStatusRow = typeof dayStatus.$inferSelect;
export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type HabitStreakStateRow = typeof habitStreakState.$inferSelect;
export type StreakStateRow = typeof streakState.$inferSelect;
export type WindDownActionRow = typeof windDownActions.$inferSelect;

export interface HabitPeriodStatusSnapshot {
  category: HabitCategory;
  completed: boolean;
  completedCount?: number;
  createdAt?: string;
  frequency: HabitFrequency;
  habitId: number;
  name: string;
  periodEnd: string;
  periodStart: string;
  selectedWeekdays?: HabitWeekday[] | null;
  sortOrder: number;
  targetCount?: number;
}
