// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type * as TodayHistoryCarouselModule from "@/renderer/features/today/components/today-history-carousel";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { TodayPage } from "./today-page";

const todayHistoryCarouselSpy = vi.hoisted(() => vi.fn());
const getHistoryDayMock = vi.hoisted(() => vi.fn());

vi.mock<typeof TodayHistoryCarouselModule>(
  import("@/renderer/features/today/components/today-history-carousel"),
  () => ({
    TodayHistoryCarousel: (props) => {
      todayHistoryCarouselSpy(props);
      return (
        <button type="button" onClick={() => props.onSelectDate("2026-03-12")}>
          history carousel
          {props.selectedDate ? ` ${props.selectedDate}` : ""}
        </button>
      );
    },
  })
);

vi.mock(
  import("@/renderer/shared/lib/habits-client"),
  async (importOriginal) => {
    const actual = await importOriginal();

    return {
      habitsClient: {
        ...actual.habitsClient,
        getHistoryDay: getHistoryDayMock,
      },
    };
  }
);

vi.mock(import("@/renderer/features/today/hooks/use-today-popups"), () => ({
  useTodayPopups: vi.fn(),
}));

vi.mock(
  import("@/renderer/features/today/hooks/use-today-celebration"),
  () => ({
    useTodayCelebration: vi.fn(() => null),
  })
);

function historyDay(date: string): HistorySummaryDay {
  return {
    categoryProgress: [
      {
        category: "productivity",
        completed: 1,
        progress: 1,
        total: 1,
      },
    ],
    date,
    focusMinutes: 0,
    summary: {
      allCompleted: true,
      completedAt: `${date}T12:00:00.000Z`,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 1,
    },
  };
}

function historyDetailDay(date: string): HistoryDay {
  return {
    categoryProgress: [
      {
        category: "productivity",
        completed: 1,
        progress: 1,
        total: 2,
      },
    ],
    date,
    focusMinutes: 40,
    focusQuotaGoals: [
      {
        archivedAt: null,
        completed: false,
        completedMinutes: 40,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "weekly",
        id: 1,
        isArchived: false,
        kind: "focus-quota",
        periodEnd: "2026-03-15",
        periodStart: "2026-03-09",
        targetMinutes: 120,
      },
    ],
    habits: [
      {
        category: "productivity",
        completed: true,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 10,
        isArchived: false,
        name: "Historical planning",
        sortOrder: 0,
      },
      {
        category: "fitness",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 11,
        isArchived: false,
        name: "Historical stretch",
        sortOrder: 1,
      },
      {
        category: "productivity",
        completed: false,
        completedCount: 1,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "weekly",
        id: 12,
        isArchived: false,
        name: "Historical weekly review",
        sortOrder: 2,
        targetCount: 3,
      },
    ],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 2,
    },
  };
}

const history: HistorySummaryDay[] = [];
const managedHabits: Habit[] = [
  {
    category: "productivity",
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id: 1,
    isArchived: false,
    name: "Plan top task",
    sortOrder: 0,
  },
];

const state: TodayState = {
  date: "2026-03-13",
  dayStatus: null,
  focusMinutes: 0,
  habits: [
    {
      category: "productivity",
      completed: false,
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 1,
      isArchived: false,
      name: "Plan top task",
      sortOrder: 0,
    },
  ],
  settings: {
    ...createDefaultAppSettings("Asia/Singapore"),
    focusDefaultDurationSeconds: 25 * 60,
    resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
    toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
  },
  streak: {
    availableFreezes: 1,
    bestStreak: 5,
    currentStreak: 3,
    lastEvaluatedDate: "2026-03-12",
  },
};

describe("today page", () => {
  beforeEach(() => {
    todayHistoryCarouselSpy.mockClear();
    getHistoryDayMock.mockReset();
  });

  function renderTodayPage(
    todayState: TodayState = state,
    historySummary: HistorySummaryDay[] = history
  ) {
    const handlers = {
      handleDecrementHabitProgress: vi.fn(),
      handleIncrementHabitProgress: vi.fn(),
      handleToggleHabit: vi.fn(),
      handleToggleHabitCarryover: vi.fn(),
    };

    render(
      <TodayPage
        hasLoadedHistorySummary
        historySummary={historySummary}
        managedHabits={managedHabits}
        onArchiveHabit={vi.fn(() => Promise.resolve())}
        onCreateHabit={vi.fn(() => Promise.resolve())}
        onRenameHabit={vi.fn(() => Promise.resolve())}
        onReorderHabits={vi.fn(() => Promise.resolve())}
        onUnarchiveHabit={vi.fn(() => Promise.resolve())}
        state={todayState}
        onDecrementHabitProgress={handlers.handleDecrementHabitProgress}
        onIncrementHabitProgress={handlers.handleIncrementHabitProgress}
        onToggleHabit={handlers.handleToggleHabit}
        onToggleHabitCarryover={handlers.handleToggleHabitCarryover}
        onUpdateHabitCategory={vi.fn(() => Promise.resolve())}
        onUpdateHabitFrequency={vi.fn(() => Promise.resolve())}
        onUpdateHabitTargetCount={vi.fn(() => Promise.resolve())}
        onUpdateHabitWeekdays={vi.fn(() => Promise.resolve())}
      />
    );

    return handlers;
  }

  function getKeyboardRow(label: string): HTMLElement {
    const row = screen.getByText(label).closest("[data-keyboard-row]");
    expect(row).not.toBeNull();
    return row as HTMLElement;
  }

  it("opens in-flow habit management from the daily checklist", () => {
    renderTodayPage();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));

    expect(screen.getByText("Manage habits")).toBeInTheDocument();
    expect(screen.getByText("Add a habit")).toBeInTheDocument();
    expect(screen.getAllByText("Plan top task")).not.toHaveLength(0);
  });

  it("passes only historical summary days to the top carousel", () => {
    renderTodayPage(state, [
      historyDay("2026-03-11"),
      historyDay("2026-03-12"),
      historyDay("2026-03-13"),
    ]);

    expect(todayHistoryCarouselSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [
          expect.objectContaining({ date: "2026-03-11" }),
          expect.objectContaining({ date: "2026-03-12" }),
        ],
      })
    );
  });

  it("hides historical detail until a carousel day is selected", () => {
    renderTodayPage(state, [historyDay("2026-03-12")]);

    expect(screen.queryByText("Historical planning")).toBeNull();
    expect(getHistoryDayMock).not.toHaveBeenCalled();
  });

  it("loads a selected carousel day into an inline read-only Today-style view", async () => {
    getHistoryDayMock.mockResolvedValue(historyDetailDay("2026-03-12"));
    const handlers = renderTodayPage(state, [historyDay("2026-03-12")]);

    fireEvent.click(screen.getByRole("button", { name: /history carousel/i }));

    expect(getHistoryDayMock).toHaveBeenCalledWith("2026-03-12");
    expect(await screen.findByText("Historical planning")).toBeInTheDocument();
    expect(screen.getByText("Historical stretch")).toBeInTheDocument();
    expect(screen.getByText("Historical weekly review")).toBeInTheDocument();
    expect(screen.getByText("Beyond Today")).toBeInTheDocument();
    expect(screen.getByText("Focus quota")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Increase progress for Historical weekly review",
      })
    ).toBeNull();

    fireEvent.click(screen.getByText("Historical planning"));

    expect(handlers.handleToggleHabit).not.toHaveBeenCalled();
    expect(handlers.handleIncrementHabitProgress).not.toHaveBeenCalled();
    expect(handlers.handleDecrementHabitProgress).not.toHaveBeenCalled();
  });

  it("returns from inline history to the current Today view", async () => {
    getHistoryDayMock.mockResolvedValue(historyDetailDay("2026-03-12"));
    renderTodayPage(state, [historyDay("2026-03-12")]);

    fireEvent.click(screen.getByRole("button", { name: /history carousel/i }));
    expect(await screen.findByText("Historical planning")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(screen.queryByText("Historical planning")).toBeNull();
    expect(screen.getByText("Plan top task")).toBeInTheDocument();
  });

  it("does not show habit streaks when streak data is absent", () => {
    renderTodayPage();

    expect(screen.queryByLabelText(/Current streak/u)).toBeNull();
  });

  it("shows loaded habit streaks without keeping the loading placeholder", () => {
    renderTodayPage({
      ...state,
      habitStreaks: {
        1: {
          bestStreak: 4,
          currentStreak: 2,
        },
      },
    });

    expect(
      screen.getByLabelText("Current streak 2 days. Best streak 4 days.")
    ).toBeInTheDocument();
    expect(screen.getByText("2d")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("removes the placeholder when loaded streak data has no current streak", () => {
    renderTodayPage({
      ...state,
      habitStreaks: {
        1: {
          bestStreak: 4,
          currentStreak: 0,
        },
      },
    });

    expect(screen.queryByLabelText(/Current streak/u)).toBeNull();
  });

  it("auto-focuses the first actionable daily habit row", async () => {
    renderTodayPage();

    await waitFor(() => {
      expect(getKeyboardRow("Plan top task")).toHaveFocus();
    });
  });

  it("moves keyboard focus through daily, carryover, and periodic rows", async () => {
    renderTodayPage({
      ...state,
      habitCarryovers: [
        {
          category: "fitness",
          completed: false,
          completedCount: 0,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Stretch",
          sortOrder: 1,
          sourceDate: "2026-03-12",
          targetCount: 1,
          targetDate: "2026-03-13",
        },
      ],
      habits: [
        ...state.habits,
        {
          category: "productivity",
          completed: false,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly",
          id: 3,
          isArchived: false,
          name: "Read deeply",
          sortOrder: 2,
          targetCount: 3,
        },
      ],
    });

    const dailyRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(dailyRow).toHaveFocus());

    fireEvent.keyDown(dailyRow, { key: "ArrowDown" });
    expect(getKeyboardRow("Stretch")).toHaveFocus();

    fireEvent.keyDown(getKeyboardRow("Stretch"), { key: "ArrowDown" });
    expect(getKeyboardRow("Read deeply")).toHaveFocus();

    fireEvent.keyDown(getKeyboardRow("Read deeply"), { key: "ArrowDown" });
    expect(dailyRow).toHaveFocus();

    fireEvent.keyDown(dailyRow, { key: "ArrowUp" });
    expect(getKeyboardRow("Read deeply")).toHaveFocus();
  });

  it("toggles daily habits with Space and Enter", async () => {
    const handlers = renderTodayPage();
    const row = getKeyboardRow("Plan top task");
    await waitFor(() => expect(row).toHaveFocus());

    fireEvent.keyDown(row, { key: " " });
    fireEvent.keyDown(row, { key: "Enter" });

    expect(handlers.handleToggleHabit).toHaveBeenCalledTimes(2);
    expect(handlers.handleToggleHabit).toHaveBeenCalledWith(1);
  });

  it("toggles carryovers with Space and Enter", async () => {
    const handlers = renderTodayPage({
      ...state,
      habitCarryovers: [
        {
          category: "fitness",
          completed: false,
          completedCount: 0,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Stretch",
          sortOrder: 1,
          sourceDate: "2026-03-12",
          targetCount: 1,
          targetDate: "2026-03-13",
        },
      ],
    });
    const dailyRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(dailyRow).toHaveFocus());
    fireEvent.keyDown(dailyRow, { key: "ArrowDown" });
    const carryoverRow = getKeyboardRow("Stretch");

    fireEvent.keyDown(carryoverRow, { key: " " });
    fireEvent.keyDown(carryoverRow, { key: "Enter" });

    expect(handlers.handleToggleHabitCarryover).toHaveBeenCalledTimes(2);
    expect(handlers.handleToggleHabitCarryover).toHaveBeenCalledWith(
      "2026-03-12",
      2
    );
  });

  it("adjusts periodic habit progress with keyboard actions", async () => {
    const handlers = renderTodayPage({
      ...state,
      habits: [
        ...state.habits,
        {
          category: "productivity",
          completed: false,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly",
          id: 3,
          isArchived: false,
          name: "Read deeply",
          sortOrder: 2,
          targetCount: 3,
        },
      ],
    });
    const dailyRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(dailyRow).toHaveFocus());
    fireEvent.keyDown(dailyRow, { key: "ArrowDown" });
    const periodicRow = getKeyboardRow("Read deeply");

    fireEvent.keyDown(periodicRow, { key: " " });
    fireEvent.keyDown(periodicRow, { key: "Enter" });
    fireEvent.keyDown(periodicRow, { key: "ArrowRight" });
    fireEvent.keyDown(periodicRow, { key: "ArrowLeft" });

    expect(handlers.handleIncrementHabitProgress).toHaveBeenCalledTimes(3);
    expect(handlers.handleIncrementHabitProgress).toHaveBeenCalledWith(3);
    expect(handlers.handleDecrementHabitProgress).toHaveBeenCalledTimes(1);
    expect(handlers.handleDecrementHabitProgress).toHaveBeenCalledWith(3);
  });

  it("skips disabled daily rows when the day is paused", async () => {
    renderTodayPage({
      ...state,
      dayStatus: "rest",
      habits: [
        ...state.habits,
        {
          category: "productivity",
          completed: false,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly",
          id: 3,
          isArchived: false,
          name: "Read deeply",
          sortOrder: 2,
          targetCount: 3,
        },
      ],
    });

    await waitFor(() => {
      expect(getKeyboardRow("Read deeply")).toHaveFocus();
    });
  });

  it("ignores row shortcuts when a nested control has focus", async () => {
    const handlers = renderTodayPage();
    const row = getKeyboardRow("Plan top task");
    await waitFor(() => expect(row).toHaveFocus());
    const checkbox = screen.getByRole("checkbox", { name: /plan top task/i });

    fireEvent.keyDown(checkbox, { key: " " });

    expect(handlers.handleToggleHabit).not.toHaveBeenCalled();
  });

  it("focuses the next incomplete row with N", async () => {
    renderTodayPage({
      ...state,
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
          name: "Move",
          sortOrder: 1,
        },
        {
          category: "productivity",
          completed: false,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly",
          id: 3,
          isArchived: false,
          name: "Read deeply",
          sortOrder: 2,
          targetCount: 3,
        },
      ],
    });
    const firstRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(firstRow).toHaveFocus());

    fireEvent.keyDown(window, { key: "n" });
    expect(getKeyboardRow("Move")).toHaveFocus();

    fireEvent.keyDown(window, { key: "n" });
    expect(getKeyboardRow("Read deeply")).toHaveFocus();

    fireEvent.keyDown(window, { key: "n" });
    expect(getKeyboardRow("Move")).toHaveFocus();
  });

  it("focuses the next incomplete row after completing the current row by click", async () => {
    renderTodayPage({
      ...state,
      habits: [
        ...state.habits,
        {
          category: "fitness",
          completed: false,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Move",
          sortOrder: 1,
        },
      ],
    });
    const firstRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(firstRow).toHaveFocus());

    fireEvent.click(screen.getByRole("checkbox", { name: /plan top task/i }));
    fireEvent.keyDown(window, { key: "n" });

    expect(getKeyboardRow("Move")).toHaveFocus();
  });

  it("focuses the previous incomplete row with Shift+N", async () => {
    renderTodayPage({
      ...state,
      habits: [
        ...state.habits,
        {
          category: "fitness",
          completed: false,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Move",
          sortOrder: 1,
        },
        {
          category: "productivity",
          completed: false,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly",
          id: 3,
          isArchived: false,
          name: "Read deeply",
          sortOrder: 2,
          targetCount: 3,
        },
      ],
    });
    const firstRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(firstRow).toHaveFocus());

    fireEvent.keyDown(window, { key: "N", shiftKey: true });
    expect(getKeyboardRow("Read deeply")).toHaveFocus();
  });

  it("does not use N as a Today hotkey from inputs", async () => {
    renderTodayPage({
      ...state,
      habits: [
        ...state.habits,
        {
          category: "fitness",
          completed: false,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Move",
          sortOrder: 1,
        },
      ],
    });
    const firstRow = getKeyboardRow("Plan top task");
    await waitFor(() => expect(firstRow).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    const input = screen.getAllByLabelText("Name")[0] as HTMLElement;
    input.focus();

    fireEvent.keyDown(input, { key: "n" });

    expect(input).toHaveFocus();
  });
});
