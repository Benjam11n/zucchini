// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import type { WeeklyReview } from "@/shared/domain/weekly-review";

import { WeeklyReviewDailyCadenceChartImpl } from "./weekly-review-daily-cadence-chart-impl";

function createReview(overrides: Partial<WeeklyReview> = {}): WeeklyReview {
  return {
    completedDays: 2,
    completionRate: 67,
    dailyCadence: [
      {
        completedHabitCount: 3,
        completionRate: 60,
        date: "2026-03-02",
        label: "Monday",
        shortLabel: "Mon",
        status: "complete",
        trackedHabitCount: 5,
      },
      {
        completedHabitCount: 0,
        completionRate: null,
        date: "2026-03-03",
        label: "Tuesday",
        shortLabel: "Tue",
        status: "rest",
        trackedHabitCount: 0,
      },
      {
        completedHabitCount: 1,
        completionRate: 25,
        date: "2026-03-04",
        label: "Wednesday",
        shortLabel: "Wed",
        status: "missed",
        trackedHabitCount: 4,
      },
    ],
    endingStreak: 1,
    focusMinutes: 120,
    freezeDays: 0,
    habitHeatmapRows: [],
    habitMetrics: [],
    label: "Mar 2-8",
    longestCleanRun: 2,
    missedDays: 1,
    mostMissedHabits: [],
    rescheduledDays: 0,
    restDays: 1,
    sickDays: 0,
    trackedDays: 3,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
    ...overrides,
  };
}

describe("WeeklyReviewDailyCadenceChartImpl", () => {
  it("renders weekday labels and skips bars for null completion rates", () => {
    render(<WeeklyReviewDailyCadenceChartImpl review={createReview()} />);

    expect(screen.getByText("Daily cadence")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getAllByTestId("daily-cadence-bar")).toHaveLength(2);
    expect(
      screen.queryByLabelText("Tuesday: 0% completion")
    ).not.toBeInTheDocument();
  });

  it("shows formatted completion tooltip when a bar receives focus", () => {
    render(<WeeklyReviewDailyCadenceChartImpl review={createReview()} />);

    fireEvent.focus(screen.getByLabelText("Monday: 60% completion"));

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Completion")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
