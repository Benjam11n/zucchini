// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { HistoryDay } from "@/shared/domain/history";
import { createDefaultHabitCategoryPreferences } from "@/shared/domain/settings";

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
  focusMinutes: 45,
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
  it("shows category percentages alongside the activity ring", () => {
    render(
      <HistoryDayPanel
        isToday={false}
        onNavigateToToday={vi.fn()}
        selectedDay={selectedDay}
      />
    );
    const categoryPreferences = createDefaultHabitCategoryPreferences();

    for (const category of ["fitness", "nutrition", "productivity"] as const) {
      expect(
        screen.getByText(categoryPreferences[category].label.toUpperCase())
      ).toBeInTheDocument();
    }

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows focus minutes without the redundant activity summary text", () => {
    render(
      <HistoryDayPanel
        isToday={false}
        onNavigateToToday={vi.fn()}
        selectedDay={selectedDay}
      />
    );

    expect(
      screen.getByText((_, element) => element?.textContent === "45m")
    ).toBeInTheDocument();
    expect(screen.queryByText("Incomplete day")).not.toBeInTheDocument();
  });
});
