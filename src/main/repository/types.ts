import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";

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

export interface HabitPeriodStatusSnapshot {
  category: HabitCategory;
  completed: boolean;
  frequency: HabitFrequency;
  habitId: number;
  name: string;
  periodEnd: string;
  periodStart: string;
  sortOrder: number;
}
