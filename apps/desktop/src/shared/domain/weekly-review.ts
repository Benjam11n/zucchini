/**
 * Weekly review read-models.
 *
 * These types describe the chart-ready data returned to the renderer for the
 * weekly review experience: daily cadence, trend lines, and per-habit metrics.
 */
import type { HabitCategory, HabitFrequency } from "./habit";

type WeeklyReviewDayStatus =
  | "complete"
  | "empty"
  | "freeze"
  | "missed"
  | "sick";

export interface WeeklyReviewDayPoint {
  completedHabitCount: number;
  completionRate: number | null;
  date: string;
  label: string;
  shortLabel: string;
  status: WeeklyReviewDayStatus;
  trackedHabitCount: number;
}

export interface WeeklyReviewHabitMetric {
  category: HabitCategory;
  completedOpportunities: number;
  completionRate: number;
  frequency: HabitFrequency;
  habitId: number;
  missedOpportunities: number;
  name: string;
  opportunities: number;
  sortOrder: number;
}

export interface WeeklyReviewTrendPoint {
  completedDays: number;
  completionRate: number;
  focusMinutes: number;
  freezeDays: number;
  label: string;
  missedDays: number;
  sickDays: number;
  weekEnd: string;
  weekStart: string;
}

export interface WeeklyReviewListItem {
  completionRate: number;
  label: string;
  weekEnd: string;
  weekStart: string;
}

export interface WeeklyReview {
  completedDays: number;
  completionRate: number;
  dailyCadence: WeeklyReviewDayPoint[];
  endingStreak: number | null;
  freezeDays: number;
  focusMinutes: number;
  habitMetrics: WeeklyReviewHabitMetric[];
  label: string;
  longestCleanRun: number;
  missedDays: number;
  mostMissedHabits: WeeklyReviewHabitMetric[];
  sickDays: number;
  trackedDays: number;
  weekEnd: string;
  weekStart: string;
}

export interface WeeklyReviewOverview {
  availableWeeks: WeeklyReviewListItem[];
  latestReview: WeeklyReview | null;
  trend: WeeklyReviewTrendPoint[];
}
