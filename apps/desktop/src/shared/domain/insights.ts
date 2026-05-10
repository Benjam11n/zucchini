import type { HabitCategory } from "./habit";

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
  completedPercent: number;
  label: string;
  missedPercent: number;
  partialPercent: number;
  weekEnd: string;
  weekStart: string;
}

export interface InsightsHabitLeaderboardItem {
  category: HabitCategory;
  completionRate: number;
  habitId: number;
  name: string;
  rank: number;
  trend: number[];
}

export interface InsightsSmartInsight {
  body: string;
  severity: InsightsSeverity;
  title: string;
}

interface InsightsWeekdayRhythmPlaceholder {
  body: string;
  title: string;
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
  weekdayRhythmPlaceholder: InsightsWeekdayRhythmPlaceholder;
  weeklyCompletion: InsightsWeeklyCompletion[];
}
