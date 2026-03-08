import type { HabitCategory, HabitFrequency } from "./habit";

export type WeeklyReviewDayStatus = "complete" | "empty" | "freeze" | "missed";

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
  freezeDays: number;
  label: string;
  missedDays: number;
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
  habitMetrics: WeeklyReviewHabitMetric[];
  label: string;
  longestCleanRun: number;
  missedDays: number;
  mostMissedHabits: WeeklyReviewHabitMetric[];
  trackedDays: number;
  weekEnd: string;
  weekStart: string;
}

export interface WeeklyReviewOverview {
  availableWeeks: WeeklyReviewListItem[];
  latestReview: WeeklyReview | null;
  trend: WeeklyReviewTrendPoint[];
}
