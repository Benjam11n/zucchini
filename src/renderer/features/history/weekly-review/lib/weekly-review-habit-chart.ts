import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

const CHART_MIN_HEIGHT = 240;
const CHART_ROW_HEIGHT = 36;
const MAX_VISIBLE_HABIT_ROWS = 10;
const Y_AXIS_LABEL_LENGTH = 18;

export interface WeeklyReviewHabitChartRow {
  category: WeeklyReviewHabitMetric["category"];
  color: string;
  completionRate: number;
  habitId: number;
  missedOpportunities: number;
  name: string;
  opportunities: number;
  shortName: string;
}

export interface WeeklyReviewHabitChartState {
  chartHeight: number;
  remainingHabits: WeeklyReviewHabitChartRow[];
  visibleHabits: WeeklyReviewHabitChartRow[];
}

function truncateHabitName(name: string, maxLength = Y_AXIS_LABEL_LENGTH) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

export function buildWeeklyReviewHabitChartState(
  habitMetrics: WeeklyReviewHabitMetric[],
  getColor: (category: WeeklyReviewHabitMetric["category"]) => string
): WeeklyReviewHabitChartState {
  const rankedHabits = habitMetrics
    .map((metric) => ({
      category: metric.category,
      color: getColor(metric.category),
      completionRate: metric.completionRate,
      habitId: metric.habitId,
      missedOpportunities: metric.missedOpportunities,
      name: metric.name,
      opportunities: metric.opportunities,
      shortName: truncateHabitName(metric.name),
      sortOrder: metric.sortOrder,
    }))
    .toSorted((left, right) => {
      if (left.completionRate !== right.completionRate) {
        return left.completionRate - right.completionRate;
      }

      if (left.missedOpportunities !== right.missedOpportunities) {
        return right.missedOpportunities - left.missedOpportunities;
      }

      if (left.opportunities !== right.opportunities) {
        return right.opportunities - left.opportunities;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    });

  const visibleHabits = rankedHabits.slice(0, MAX_VISIBLE_HABIT_ROWS);
  const remainingHabits = rankedHabits.slice(MAX_VISIBLE_HABIT_ROWS);

  return {
    chartHeight: Math.max(
      CHART_MIN_HEIGHT,
      visibleHabits.length * CHART_ROW_HEIGHT
    ),
    remainingHabits,
    visibleHabits,
  };
}

export const weeklyReviewHabitChartConstants = {
  CHART_MIN_HEIGHT,
  CHART_ROW_HEIGHT,
  MAX_VISIBLE_HABIT_ROWS,
  Y_AXIS_LABEL_LENGTH,
} as const;
