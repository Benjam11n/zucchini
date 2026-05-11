import type { HabitCategory } from "./habit";

export const INSIGHTS_RANGE_OPTIONS = [7, 30, 90, 180, 365] as const;

export type InsightsRangeDays = (typeof INSIGHTS_RANGE_OPTIONS)[number];

type InsightsSeverity = "positive" | "warning" | "neutral";

export interface InsightsSummaryMetric {
  deltaLabel: string;
  label: string;
  trend: number[];
  value: string;
}

export interface InsightsMomentum {
  label: string;
  score: number;
  sparkline: number[];
}

export interface InsightsWeeklyCompletion {
  completedCount: number;
  completedPercent: number;
  label: string;
  missedCount: number;
  missedPercent: number;
  partialCount: number;
  partialPercent: number;
  totalCount: number;
  weekEnd: string;
  weekStart: string;
}

export interface InsightsHabitLeaderboardItem {
  category: HabitCategory;
  completedCount: number;
  completionRate: number;
  habitId: number;
  name: string;
  rank: number;
  totalCount: number;
  trend: number[];
}

export interface InsightsSmartInsight {
  body: string;
  severity: InsightsSeverity;
  title: string;
}

interface InsightsWeekdayRhythmCell {
  completionCount: number;
  intensity: number;
  label: string;
  timeOfDay: string;
  weekday: string;
}

export interface InsightsWeekdayRhythm {
  cells: InsightsWeekdayRhythmCell[];
  hasData: boolean;
  maxCompletionCount: number;
  subtitle: string;
  timeOfDayLabels: string[];
  title: string;
  weekdayLabels: string[];
}

export interface InsightsDashboard {
  generatedAtDate: string;
  habitLeaderboard: InsightsHabitLeaderboardItem[];
  isEmpty: boolean;
  momentum: InsightsMomentum;
  period: {
    currentEnd: string;
    currentStart: string;
    label: string;
  };
  smartInsights: InsightsSmartInsight[];
  summary: {
    completed: InsightsSummaryMetric;
    focus: InsightsSummaryMetric;
    perfectDays: InsightsSummaryMetric;
    savedStreaks: InsightsSummaryMetric;
  };
  weekdayRhythm: InsightsWeekdayRhythm;
  weeklyCompletion: InsightsWeeklyCompletion[];
}
