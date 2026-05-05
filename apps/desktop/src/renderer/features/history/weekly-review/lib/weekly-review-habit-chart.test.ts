import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

import { buildWeeklyReviewHabitChartState } from "./weekly-review-habit-chart";

function createHabitMetric(
  overrides: Partial<WeeklyReviewHabitMetric> = {}
): WeeklyReviewHabitMetric {
  return {
    category: "productivity",
    completedOpportunities: 3,
    completionRate: 60,
    frequency: "daily",
    habitId: 1,
    missedOpportunities: 2,
    name: "Plan top three tasks",
    opportunities: 5,
    sortOrder: 0,
    ...overrides,
  };
}

describe("weekly review habit chart ranking", () => {
  it("keeps the lowest-completion habits in the visible chart first", () => {
    const state = buildWeeklyReviewHabitChartState(
      [
        createHabitMetric({
          completionRate: 80,
          habitId: 1,
          name: "Read",
          sortOrder: 1,
        }),
        createHabitMetric({
          completionRate: 20,
          habitId: 2,
          name: "Stretch",
          sortOrder: 2,
        }),
        createHabitMetric({
          completionRate: 40,
          habitId: 3,
          name: "Walk",
          sortOrder: 3,
        }),
      ],
      () => "var(--ring-productivity)"
    );

    expect(state.visibleHabits.map((habit) => habit.habitId)).toStrictEqual([
      2, 3, 1,
    ]);
  });

  it("moves overflow habits into the secondary list", () => {
    const state = buildWeeklyReviewHabitChartState(
      Array.from(
        {
          length: 12,
        },
        (_value, index) =>
          createHabitMetric({
            completionRate: index,
            habitId: index + 1,
            name: `Habit ${index + 1}`,
            sortOrder: index,
          })
      ),
      () => "var(--ring-productivity)"
    );

    expect(state.visibleHabits).toHaveLength(12);
    expect(state.viewportHeight).toBeLessThan(state.chartHeight);
    expect(state.viewportHeight).toBe(420);
  });

  it("truncates long y-axis labels and keeps a compact minimum height", () => {
    const state = buildWeeklyReviewHabitChartState(
      [
        createHabitMetric({
          name: "Very long habit name that should be truncated for the chart",
        }),
      ],
      () => "var(--ring-productivity)"
    );

    expect(state.visibleHabits[0]?.shortName).toContain("…");
    expect(state.chartHeight).toBe(240);
  });
});
