import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

const CHART_MAX_VIEWPORT_HEIGHT = 420;
const CHART_MIN_HEIGHT = 240;
const CHART_ROW_HEIGHT = 36;
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
  viewportHeight: number;
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

  const chartHeight = Math.max(
    CHART_MIN_HEIGHT,
    rankedHabits.length * CHART_ROW_HEIGHT
  );

  return {
    chartHeight,
    viewportHeight: Math.min(CHART_MAX_VIEWPORT_HEIGHT, chartHeight),
    visibleHabits: rankedHabits,
  };
}

export const weeklyReviewHabitChartConstants = {
  CHART_MAX_VIEWPORT_HEIGHT,
  CHART_MIN_HEIGHT,
  CHART_ROW_HEIGHT,
  Y_AXIS_LABEL_LENGTH,
} as const;
