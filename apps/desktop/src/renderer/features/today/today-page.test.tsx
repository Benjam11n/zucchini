// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { memo } from "react";

import type * as LongerHabitChecklistModule from "@/renderer/features/today/components/longer-habit-checklist";
import type * as TodayHistoryCarouselModule from "@/renderer/features/today/components/today-history-carousel";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { TodayPage } from "./today-page";

vi.mock<typeof TodayHistoryCarouselModule>(
  import("@/renderer/features/today/components/today-history-carousel"),
  () => ({
    TodayHistoryCarousel: () => <div>history carousel</div>,
  })
);

vi.mock(import("@/renderer/features/today/components/streak-card"), () => ({
  StreakCard: memo(() => <div>streak card</div>),
}));

vi.mock<typeof LongerHabitChecklistModule>(
  import("@/renderer/features/today/components/longer-habit-checklist"),
  () => ({
    LongerHabitChecklist: () => <div>longer habits</div>,
  })
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

const history: HistoryDay[] = [];
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
  it("opens in-flow habit management from the daily checklist", () => {
    render(
      <TodayPage
        history={history}
        managedHabits={managedHabits}
        onArchiveHabit={vi.fn(() => Promise.resolve())}
        onCreateHabit={vi.fn(() => Promise.resolve())}
        onRenameHabit={vi.fn(() => Promise.resolve())}
        onReorderHabits={vi.fn(() => Promise.resolve())}
        onUnarchiveHabit={vi.fn(() => Promise.resolve())}
        state={state}
        onToggleHabit={vi.fn()}
        onUpdateHabitCategory={vi.fn(() => Promise.resolve())}
        onUpdateHabitFrequency={vi.fn(() => Promise.resolve())}
        onUpdateHabitWeekdays={vi.fn(() => Promise.resolve())}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));

    expect(screen.getByText("Manage habits")).toBeInTheDocument();
    expect(screen.getByText("Add a habit")).toBeInTheDocument();
    expect(screen.getAllByText("Plan top task")).not.toHaveLength(0);
  });
});
