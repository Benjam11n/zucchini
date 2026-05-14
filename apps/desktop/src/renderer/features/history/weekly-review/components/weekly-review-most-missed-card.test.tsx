// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

import { WeeklyReviewMostMissedCard } from "./weekly-review-most-missed-card";

function createHabitMetric(
  overrides: Partial<WeeklyReviewHabitMetric> = {}
): WeeklyReviewHabitMetric {
  return {
    category: "fitness",
    completedOpportunities: 3,
    completionRate: 43,
    frequency: "daily",
    habitId: 1,
    missedOpportunities: 4,
    name: "Push ups",
    opportunities: 7,
    sortOrder: 0,
    ...overrides,
  };
}

describe("WeeklyReviewMostMissedCard", () => {
  it("renders habit category and denominator in accessible row labels", () => {
    render(<WeeklyReviewMostMissedCard habits={[createHabitMetric()]} />);

    expect(screen.getByText("Push ups")).toBeInTheDocument();
    expect(screen.getByText("4 missed of 7 opportunities")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Push ups, Fitness: 4 missed of 7 opportunities, 43% completion"
      )
    ).toBeInTheDocument();
  });

  it("renders an empty state when there are no misses", () => {
    render(<WeeklyReviewMostMissedCard habits={[]} />);

    expect(
      screen.getByText("No misses last week. Keep the rhythm.")
    ).toBeInTheDocument();
  });
});
