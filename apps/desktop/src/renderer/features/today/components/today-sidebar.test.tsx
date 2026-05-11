// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import type { TodayState } from "@/shared/contracts/today-state";
import type { HistorySummaryDay } from "@/shared/domain/history";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { TodaySidebar } from "./today-sidebar";

function createTodayState(overrides: Partial<TodayState> = {}): TodayState {
  return {
    date: "2026-03-13",
    dayStatus: null,
    focusMinutes: 0,
    habits: [
      {
        category: "productivity",
        completed: true,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 1,
        isArchived: false,
        name: "Plan top task",
        sortOrder: 0,
      },
      {
        category: "fitness",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 2,
        isArchived: false,
        name: "Stretch",
        sortOrder: 1,
      },
    ],
    settings: createDefaultAppSettings("Asia/Singapore"),
    streak: {
      availableFreezes: 1,
      bestStreak: 5,
      currentStreak: 3,
      lastEvaluatedDate: "2026-03-12",
    },
    ...overrides,
  };
}

function historyDay(
  date: string,
  completed: number,
  total: number
): HistorySummaryDay {
  return {
    categoryProgress: [
      {
        category: "productivity",
        completed,
        progress: total === 0 ? 0 : completed / total,
        total,
      },
    ],
    date,
    focusMinutes: 0,
    summary: {
      allCompleted: completed === total && total > 0,
      completedAt:
        completed === total && total > 0 ? `${date}T12:00:00.000Z` : null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: completed,
    },
  };
}

function renderSidebar({
  history = [],
  onMoveUnfinishedHabitsToTomorrow = vi.fn(),
  onSetDayStatus = vi.fn(),
  state = createTodayState(),
}: {
  history?: HistorySummaryDay[];
  onMoveUnfinishedHabitsToTomorrow?: () => void;
  onSetDayStatus?: (kind: TodayState["dayStatus"]) => void;
  state?: TodayState;
} = {}) {
  render(
    <TodaySidebar
      history={history}
      onMoveUnfinishedHabitsToTomorrow={onMoveUnfinishedHabitsToTomorrow}
      onSetDayStatus={onSetDayStatus}
      state={state}
    />
  );

  return { onMoveUnfinishedHabitsToTomorrow, onSetDayStatus };
}

describe("TodaySidebar", () => {
  it("summarizes today's progress, streak, and recent consistency", () => {
    renderSidebar({
      history: [
        historyDay("2026-03-10", 1, 1),
        historyDay("2026-03-11", 0, 1),
        historyDay("2026-03-12", 1, 1),
      ],
    });

    expect(screen.getByText("1 of 2 complete")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Best: 5 days")).toBeInTheDocument();
    expect(screen.getByText("7%")).toBeInTheDocument();
    expect(screen.getByText("2 of 30 days")).toBeInTheDocument();
  });

  it("renders and clears the active day status", () => {
    const { onSetDayStatus } = renderSidebar({
      state: createTodayState({ dayStatus: "sick" }),
    });

    expect(screen.getByText("Sick day")).toBeInTheDocument();
    expect(screen.getByText("Streak preserved.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear day status" }));

    expect(onSetDayStatus).toHaveBeenCalledWith(null);
  });
});
