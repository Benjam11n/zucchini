/**
 * Persistence layer type definitions.
 *
 * Re-exports Drizzle inferred row types for each table.
 */
import type {
  categoryStreakState,
  dailySummary,
  dayStatus,
  focusSessions,
  habitCarryovers,
  habitStreakState,
  habits,
  habitPeriodStatus,
  streakState,
  windDownActions,
} from "@/main/infra/db/schema";

export type CategoryStreakStateRow = typeof categoryStreakState.$inferSelect;
export type HabitRow = typeof habits.$inferSelect;
export type HabitPeriodStatusRow = typeof habitPeriodStatus.$inferSelect;
export type DailySummaryRow = typeof dailySummary.$inferSelect;
export type DayStatusRow = typeof dayStatus.$inferSelect;
export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type HabitCarryoverRow = typeof habitCarryovers.$inferSelect;
export type HabitStreakStateRow = typeof habitStreakState.$inferSelect;
export type StreakStateRow = typeof streakState.$inferSelect;
export type WindDownActionRow = typeof windDownActions.$inferSelect;
