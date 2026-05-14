import type { WeeklyReviewHabitHeatmapRow } from "@/shared/domain/weekly-review";

import { buildWeeklyReviewHabitChartState } from "./weekly-review-habit-chart";

function createHeatmapRow(
  overrides: Partial<WeeklyReviewHabitHeatmapRow> = {}
): WeeklyReviewHabitHeatmapRow {
  return {
    category: "productivity",
    cells: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-03-0${index + 2}`,
      status: index < 3 ? "complete" : "missed",
      weekdayLabel:
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ?? "Day",
    })),
    completedOpportunities: 3,
    completionRate: 60,
    habitId: 1,
    missedOpportunities: 2,
    name: "Plan top three tasks",
    opportunities: 5,
    ...overrides,
  };
}

describe("weekly review habit chart ranking", () => {
  it("keeps pre-ranked heatmap rows visible", () => {
    const state = buildWeeklyReviewHabitChartState(
      [
        createHeatmapRow({
          completionRate: 20,
          habitId: 2,
          name: "Stretch",
        }),
        createHeatmapRow({
          completionRate: 40,
          habitId: 3,
          name: "Walk",
        }),
      ],
      () => "var(--ring-productivity)"
    );

    expect(state.visibleRows.map((habit) => habit.habitId)).toStrictEqual([
      2, 3,
    ]);
  });

  it("uses a scroll viewport when many habits are present", () => {
    const state = buildWeeklyReviewHabitChartState(
      Array.from(
        {
          length: 12,
        },
        (_value, index) =>
          createHeatmapRow({
            completionRate: index,
            habitId: index + 1,
            name: `Habit ${index + 1}`,
          })
      ),
      () => "var(--ring-productivity)"
    );

    expect(state.visibleRows).toHaveLength(12);
    expect(state.viewportHeight).toBeLessThan(state.chartHeight);
    expect(state.viewportHeight).toBe(420);
  });

  it("keeps a compact minimum height for short lists", () => {
    const state = buildWeeklyReviewHabitChartState(
      [
        createHeatmapRow({
          name: "Very long habit name that should be truncated for the chart",
        }),
      ],
      () => "var(--ring-productivity)"
    );

    expect(state.visibleRows[0]?.name).toBe(
      "Very long habit name that should be truncated for the chart"
    );
    expect(state.chartHeight).toBe(240);
  });
});
