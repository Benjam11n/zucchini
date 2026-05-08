// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { HistoryDay } from "@/shared/domain/history";

import { HistoricalTodayView } from "./historical-today-view";

function historyDay(
  overrides: Partial<HistoryDay["summary"]> = {}
): HistoryDay {
  return {
    categoryProgress: [],
    date: "2026-03-12",
    focusMinutes: 0,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-12",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 1,
      ...overrides,
    },
  };
}

describe("historical today view", () => {
  it("shows the selected historical day status", () => {
    render(
      <HistoricalTodayView
        day={historyDay({ dayStatus: "rest" })}
        onReturnToToday={vi.fn()}
      />
    );

    expect(screen.getByText("Rest Day")).toBeInTheDocument();
  });
});
