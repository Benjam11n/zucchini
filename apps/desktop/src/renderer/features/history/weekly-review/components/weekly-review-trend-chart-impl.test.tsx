// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import type { WeeklyReviewTrendPoint } from "@/shared/domain/weekly-review";

import { WeeklyReviewTrendChartImpl } from "./weekly-review-trend-chart-impl";

function createTrendPoint(
  overrides: Partial<WeeklyReviewTrendPoint> = {}
): WeeklyReviewTrendPoint {
  return {
    completedDays: 3,
    completionRate: 73,
    focusMinutes: 37,
    freezeDays: 0,
    label: "Mar 2",
    missedDays: 1,
    rescheduledDays: 0,
    restDays: 2,
    sickDays: 0,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
    ...overrides,
  };
}

describe("WeeklyReviewTrendChartImpl", () => {
  it("renders both trend series with labels and points", () => {
    render(
      <WeeklyReviewTrendChartImpl
        trend={[
          createTrendPoint(),
          createTrendPoint({
            completionRate: 44,
            focusMinutes: 18,
            label: "Mar 9",
            weekEnd: "2026-03-15",
            weekStart: "2026-03-09",
          }),
        ]}
      />
    );

    expect(screen.getByText("Trend line")).toBeInTheDocument();
    expect(screen.getByLabelText("Chart legend")).toBeInTheDocument();
    expect(screen.getByText("Weekly completion")).toBeInTheDocument();
    expect(screen.getByText("Focus minutes")).toBeInTheDocument();
    expect(screen.getByText("Mar 2")).toBeInTheDocument();
    expect(screen.getByText("Mar 9")).toBeInTheDocument();
    expect(screen.getByTestId("trend-completion-line")).toBeInTheDocument();
    expect(screen.getByTestId("trend-focus-line")).toBeInTheDocument();
    expect(screen.getAllByTestId("trend-completion-dot")).toHaveLength(2);
    expect(screen.getAllByTestId("trend-focus-dot")).toHaveLength(2);
  });

  it("renders an empty trend chart without crashing", () => {
    render(<WeeklyReviewTrendChartImpl trend={[]} />);

    expect(screen.getByText("Trend line")).toBeInTheDocument();
    expect(screen.getByTestId("trend-completion-line")).toHaveAttribute(
      "d",
      ""
    );
    expect(screen.getByTestId("trend-focus-line")).toHaveAttribute("d", "");
  });

  it("thins dense week labels so the x axis stays readable", () => {
    render(
      <WeeklyReviewTrendChartImpl
        trend={[
          createTrendPoint({
            label: "Mar 16 - Mar 22",
            weekEnd: "2026-03-22",
            weekStart: "2026-03-16",
          }),
          createTrendPoint({
            label: "Mar 23 - Mar 29",
            weekEnd: "2026-03-29",
            weekStart: "2026-03-23",
          }),
          createTrendPoint({
            label: "Mar 30 - Apr 5",
            weekEnd: "2026-04-05",
            weekStart: "2026-03-30",
          }),
          createTrendPoint({
            label: "Apr 6 - Apr 12",
            weekEnd: "2026-04-12",
            weekStart: "2026-04-06",
          }),
          createTrendPoint({
            label: "Apr 13 - Apr 19",
            weekEnd: "2026-04-19",
            weekStart: "2026-04-13",
          }),
          createTrendPoint({
            label: "Apr 20 - Apr 26",
            weekEnd: "2026-04-26",
            weekStart: "2026-04-20",
          }),
          createTrendPoint({
            label: "Apr 27 - May 3",
            weekEnd: "2026-05-03",
            weekStart: "2026-04-27",
          }),
          createTrendPoint({
            label: "May 4 - May 10",
            weekEnd: "2026-05-10",
            weekStart: "2026-05-04",
          }),
        ]}
      />
    );

    expect(screen.getByText("Mar 16 - Mar 22")).toBeInTheDocument();
    expect(screen.getByText("May 4 - May 10")).toBeInTheDocument();
    expect(screen.queryByText("Mar 23 - Mar 29")).not.toBeInTheDocument();
  });

  it("shows completion percentage and raw focus minutes in tooltip", () => {
    render(<WeeklyReviewTrendChartImpl trend={[createTrendPoint()]} />);

    fireEvent.focus(screen.getByLabelText("Mar 2: 73% weekly completion"));

    expect(screen.getAllByText("Mar 2")).toHaveLength(2);
    expect(screen.getAllByText("Weekly completion")).toHaveLength(2);
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getAllByText("Focus minutes")).toHaveLength(2);
    expect(screen.getAllByText("37")).toHaveLength(2);
  });
});
