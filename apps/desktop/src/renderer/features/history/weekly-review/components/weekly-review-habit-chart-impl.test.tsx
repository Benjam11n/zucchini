// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { WeeklyReviewHabitHeatmapRow } from "@/shared/domain/weekly-review";

import { WeeklyReviewHabitChartImpl } from "./weekly-review-habit-chart-impl";

function createHeatmapRow(
  overrides: Partial<WeeklyReviewHabitHeatmapRow> = {}
): WeeklyReviewHabitHeatmapRow {
  return {
    category: "productivity",
    cells: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (weekdayLabel, index) => ({
        date: `2026-03-${String(index + 2).padStart(2, "0")}`,
        status: index < 3 ? "complete" : "missed",
        weekdayLabel,
      })
    ),
    completedOpportunities: 3,
    completionRate: 43,
    habitId: 1,
    missedOpportunities: 4,
    name: "Plan top three tasks",
    opportunities: 7,
    ...overrides,
  };
}

describe("WeeklyReviewHabitChartImpl", () => {
  it("renders habit heatmap rows with weekday headers and denominators", () => {
    render(
      <WeeklyReviewHabitChartImpl
        heatmapRows={[
          createHeatmapRow(),
          createHeatmapRow({
            completedOpportunities: 1,
            completionRate: 14,
            habitId: 2,
            name: "Walk",
          }),
        ]}
      />
    );

    expect(screen.getByText("Habit completion")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Plan top three tasks")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Plan top three tasks, Productivity: 3 of 7 opportunities, 43%"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Walk")).toBeInTheDocument();
    expect(screen.getByText("3/7")).toBeInTheDocument();
    expect(screen.getByText("43%")).toBeInTheDocument();
  });

  it("renders an empty state when there are no daily rows", () => {
    render(<WeeklyReviewHabitChartImpl heatmapRows={[]} />);

    expect(
      screen.getByText("No daily habit activity for this week.")
    ).toBeInTheDocument();
  });
});
