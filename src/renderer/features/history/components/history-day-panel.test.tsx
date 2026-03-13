// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { HistoryDay } from "@/shared/domain/history";

import { HistoryDayPanel } from "./history-day-panel";

const selectedDay: HistoryDay = {
  categoryProgress: [
    {
      category: "fitness",
      completed: 1,
      progress: 50,
      total: 2,
    },
    {
      category: "nutrition",
      completed: 2,
      progress: 100,
      total: 2,
    },
    {
      category: "productivity",
      completed: 0,
      progress: 0,
      total: 1,
    },
  ],
  date: "2026-03-10",
  habits: [],
  summary: {
    allCompleted: false,
    completedAt: null,
    date: "2026-03-10",
    freezeUsed: false,
    streakCountAfterDay: 4,
  },
};

describe("history day panel", () => {
  it("shows category icons alongside the history progress breakdown", () => {
    render(<HistoryDayPanel isToday={false} selectedDay={selectedDay} />);

    for (const category of ["fitness", "nutrition", "productivity"] as const) {
      expect(screen.getByText(category)).toBeInTheDocument();
      expect(
        screen.getByTestId(`history-category-icon-${category}`)
      ).toBeInTheDocument();
    }
  });
});
