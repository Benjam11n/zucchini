import type {
  habits,
  habitPeriodStatus,
  dailySummary,
  streakState,
} from "../schema";

export type HabitRow = typeof habits.$inferSelect;
export type HabitPeriodStatusRow = typeof habitPeriodStatus.$inferSelect;
export type DailySummaryRow = typeof dailySummary.$inferSelect;
export type StreakStateRow = typeof streakState.$inferSelect;
