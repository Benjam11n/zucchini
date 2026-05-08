import type { HistoryDay } from "@/shared/domain/history";

import {
  formatFocusMinutes,
  getDailyCompletionPercent,
  getHistoryMonthStats,
  getHistoryTrendPoints,
} from "./history-timeline";

function historyDay(
  date: string,
  completed: boolean[],
  focusMinutes = 0
): HistoryDay {
  return {
    categoryProgress: [],
    date,
    focusMinutes,
    habits: completed.map((isCompleted, index) => ({
      category: "productivity",
      completed: isCompleted,
      createdAt: date,
      frequency: "daily",
      id: index + 1,
      isArchived: false,
      name: `Habit ${index + 1}`,
      sortOrder: index,
    })),
    summary: {
      allCompleted: completed.every(Boolean),
      completedAt: null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 0,
    },
  };
}

describe("history timeline helpers", () => {
  it("calculates daily completion from unique daily habits", () => {
    expect(
      getDailyCompletionPercent(historyDay("2026-03-10", [true, false]))
    ).toBe(50);
  });

  it("builds month stats from completion and focus totals", () => {
    const stats = getHistoryMonthStats([
      historyDay("2026-03-10", [true, true], 60),
      historyDay("2026-03-11", [true, false], 30),
    ]);

    expect(stats.averageCompletion).toBe(75);
    expect(stats.perfectDays).toBe(1);
    expect(stats.totalFocusMinutes).toBe(90);
    expect(stats.bestDay?.date).toBe("2026-03-10");
  });

  it("formats focus minutes and trend points", () => {
    expect(formatFocusMinutes(7)).toBe("7m");
    expect(formatFocusMinutes(67)).toBe("1h 07m");
    expect(
      getHistoryTrendPoints([
        historyDay("2026-03-10", [true, false]),
        historyDay("2026-03-09", [true, true]),
      ])
    ).toEqual([
      { date: "2026-03-09", percent: 100 },
      { date: "2026-03-10", percent: 50 },
    ]);
  });
});
