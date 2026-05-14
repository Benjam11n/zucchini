import type { WeeklyReviewHabitHeatmapRow } from "@/shared/domain/weekly-review";

const CHART_MAX_VIEWPORT_HEIGHT = 420;
const CHART_MIN_HEIGHT = 240;
const CHART_ROW_HEIGHT = 42;

interface WeeklyReviewHabitChartRow {
  category: WeeklyReviewHabitHeatmapRow["category"];
  cells: WeeklyReviewHabitHeatmapRow["cells"];
  color: string;
  completedOpportunities: number;
  completionRate: number;
  habitId: number;
  missedOpportunities: number;
  name: string;
  opportunities: number;
}

interface WeeklyReviewHabitChartState {
  chartHeight: number;
  viewportHeight: number;
  visibleRows: WeeklyReviewHabitChartRow[];
}

export function buildWeeklyReviewHabitChartState(
  heatmapRows: WeeklyReviewHabitHeatmapRow[],
  getColor: (category: WeeklyReviewHabitHeatmapRow["category"]) => string
): WeeklyReviewHabitChartState {
  const visibleRows = heatmapRows.map((row) => ({
    category: row.category,
    cells: row.cells,
    color: getColor(row.category),
    completedOpportunities: row.completedOpportunities,
    completionRate: row.completionRate,
    habitId: row.habitId,
    missedOpportunities: row.missedOpportunities,
    name: row.name,
    opportunities: row.opportunities,
  }));

  const chartHeight = Math.max(
    CHART_MIN_HEIGHT,
    visibleRows.length * CHART_ROW_HEIGHT
  );

  return {
    chartHeight,
    viewportHeight: Math.min(CHART_MAX_VIEWPORT_HEIGHT, chartHeight),
    visibleRows,
  };
}
