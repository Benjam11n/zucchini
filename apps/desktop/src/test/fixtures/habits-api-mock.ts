import { vi } from "vitest";

import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { HabitsApi } from "@/shared/contracts/habits-api";
import type { HabitCommand } from "@/shared/contracts/habits-ipc-commands";
import type { HabitQuery } from "@/shared/contracts/habits-ipc-queries";

type MockFn = ReturnType<typeof vi.fn>;
type CallableMockFn = MockFn & ((...args: unknown[]) => unknown);

const EMPTY_HABIT_STATUS_PATCH: HabitStatusPatch = {
  habit: {
    category: "productivity",
    completed: false,
    completedCount: 0,
    createdAt: "2026-03-08T00:00:00.000Z",
    frequency: "daily",
    id: 0,
    isArchived: false,
    name: "Mock habit",
    selectedWeekdays: null,
    sortOrder: 0,
    targetCount: 1,
  },
  habitStreaksStale: true,
};

export type MockHabitsApi = Record<keyof HabitsApi, MockFn> &
  Record<
    | "getHistory"
    | "getHistoryDay"
    | "getHistorySummary"
    | "getHistoryForYear"
    | "getHistoryYears"
    | "getTodayState"
    | "getWeeklyReview"
    | "getWeeklyReviewOverview"
    | "reorderHabits"
    | "toggleHabit"
    | "updateSettings",
    MockFn
  > &
  Record<string, MockFn>;

type MockHabitsApiInternals = Record<string, MockFn>;

function getMock(mock: MockHabitsApiInternals, name: string): CallableMockFn {
  const mockFn = mock[name];

  if (!mockFn) {
    throw new Error(`Missing habits API mock: ${name}`);
  }

  return mockFn as CallableMockFn;
}

function createCommandHandlers(mock: MockHabitsApiInternals) {
  return {
    "focusQuotaGoal.archive": (
      command: Extract<HabitCommand, { type: "focusQuotaGoal.archive" }>
    ) => getMock(mock, "archiveFocusQuotaGoal")(command.payload.goalId),
    "focusQuotaGoal.unarchive": (
      command: Extract<HabitCommand, { type: "focusQuotaGoal.unarchive" }>
    ) => getMock(mock, "unarchiveFocusQuotaGoal")(command.payload.goalId),
    "focusQuotaGoal.upsert": (
      command: Extract<HabitCommand, { type: "focusQuotaGoal.upsert" }>
    ) =>
      getMock(mock, "upsertFocusQuotaGoal")(
        command.payload.frequency,
        command.payload.targetMinutes
      ),
    "focusSession.record": (
      command: Extract<HabitCommand, { type: "focusSession.record" }>
    ) => getMock(mock, "recordFocusSession")(command.payload),
    "focusTimer.saveState": (
      command: Extract<HabitCommand, { type: "focusTimer.saveState" }>
    ) => getMock(mock, "saveFocusTimerState")(command.payload),
    "habit.archive": (
      command: Extract<HabitCommand, { type: "habit.archive" }>
    ) => getMock(mock, "archiveHabit")(command.payload.habitId),
    "habit.create": (
      command: Extract<HabitCommand, { type: "habit.create" }>
    ) =>
      getMock(mock, "createHabit")(
        command.payload.name,
        command.payload.category,
        command.payload.frequency,
        command.payload.selectedWeekdays,
        command.payload.targetCount
      ),
    "habit.decrementProgress": (
      command: Extract<HabitCommand, { type: "habit.decrementProgress" }>
    ) => getMock(mock, "decrementHabitProgress")(command.payload.habitId),
    "habit.incrementProgress": (
      command: Extract<HabitCommand, { type: "habit.incrementProgress" }>
    ) => getMock(mock, "incrementHabitProgress")(command.payload.habitId),
    "habit.rename": (
      command: Extract<HabitCommand, { type: "habit.rename" }>
    ) =>
      getMock(mock, "renameHabit")(
        command.payload.habitId,
        command.payload.name
      ),
    "habit.reorder": (
      command: Extract<HabitCommand, { type: "habit.reorder" }>
    ) => getMock(mock, "reorderHabits")(command.payload.habitIds),
    "habit.toggle": (
      command: Extract<HabitCommand, { type: "habit.toggle" }>
    ) => getMock(mock, "toggleHabit")(command.payload.habitId),
    "habit.unarchive": (
      command: Extract<HabitCommand, { type: "habit.unarchive" }>
    ) => getMock(mock, "unarchiveHabit")(command.payload.habitId),
    "habit.updateCategory": (
      command: Extract<HabitCommand, { type: "habit.updateCategory" }>
    ) =>
      getMock(mock, "updateHabitCategory")(
        command.payload.habitId,
        command.payload.category
      ),
    "habit.updateFrequency": (
      command: Extract<HabitCommand, { type: "habit.updateFrequency" }>
    ) =>
      getMock(mock, "updateHabitFrequency")(
        command.payload.habitId,
        command.payload.frequency,
        command.payload.targetCount
      ),
    "habit.updateTargetCount": (
      command: Extract<HabitCommand, { type: "habit.updateTargetCount" }>
    ) =>
      getMock(mock, "updateHabitTargetCount")(
        command.payload.habitId,
        command.payload.targetCount
      ),
    "habit.updateWeekdays": (
      command: Extract<HabitCommand, { type: "habit.updateWeekdays" }>
    ) =>
      getMock(mock, "updateHabitWeekdays")(
        command.payload.habitId,
        command.payload.selectedWeekdays
      ),
    "settings.update": (
      command: Extract<HabitCommand, { type: "settings.update" }>
    ) => getMock(mock, "updateSettings")(command.payload),
    "today.toggleSickDay": () => getMock(mock, "toggleSickDay")(),
    "windDown.createAction": (
      command: Extract<HabitCommand, { type: "windDown.createAction" }>
    ) => getMock(mock, "createWindDownAction")(command.payload.name),
    "windDown.deleteAction": (
      command: Extract<HabitCommand, { type: "windDown.deleteAction" }>
    ) => getMock(mock, "deleteWindDownAction")(command.payload.actionId),
    "windDown.renameAction": (
      command: Extract<HabitCommand, { type: "windDown.renameAction" }>
    ) =>
      getMock(mock, "renameWindDownAction")(
        command.payload.actionId,
        command.payload.name
      ),
    "windDown.toggleAction": (
      command: Extract<HabitCommand, { type: "windDown.toggleAction" }>
    ) => getMock(mock, "toggleWindDownAction")(command.payload.actionId),
  };
}

function createQueryHandlers(mock: MockHabitsApiInternals) {
  return {
    "focusSession.list": (
      query: Extract<HabitQuery, { type: "focusSession.list" }>
    ) => getMock(mock, "getFocusSessions")(query.payload?.limit),
    "focusTimer.getState": () => getMock(mock, "getFocusTimerState")(),
    "habit.list": () => getMock(mock, "getHabits")(),
    "history.get": (query: Extract<HabitQuery, { type: "history.get" }>) =>
      query.payload
        ? getMock(mock, "getHistory")(query.payload.limit)
        : getMock(mock, "getHistory")(),
    "history.getDay": (
      query: Extract<HabitQuery, { type: "history.getDay" }>
    ) => getMock(mock, "getHistoryDay")(query.payload.date),
    "history.getYear": (
      query: Extract<HabitQuery, { type: "history.getYear" }>
    ) => getMock(mock, "getHistoryForYear")(query.payload.year),
    "history.summary": (
      query: Extract<HabitQuery, { type: "history.summary" }>
    ) =>
      query.payload
        ? getMock(mock, "getHistorySummary")(query.payload.limit)
        : getMock(mock, "getHistorySummary")(),
    "history.years": () => getMock(mock, "getHistoryYears")(),
    "today.get": () => getMock(mock, "getTodayState")(),
    "weeklyReview.get": (
      query: Extract<HabitQuery, { type: "weeklyReview.get" }>
    ) => getMock(mock, "getWeeklyReview")(query.payload.weekStart),
    "weeklyReview.overview": () => getMock(mock, "getWeeklyReviewOverview")(),
  };
}

function createMockHabitsApi(
  overrides: Partial<MockHabitsApi> = {}
): MockHabitsApi {
  // oxlint-disable-next-line eslint/sort-keys
  const baseMock = {
    archiveFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    archiveHabit: vi.fn().mockResolvedValue(null),
    clearData: vi.fn().mockResolvedValue(true),
    command: vi.fn().mockResolvedValue(null),
    claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
    claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
    createHabit: vi.fn().mockResolvedValue(null),
    createWindDownAction: vi.fn().mockResolvedValue(null),
    decrementHabitProgress: vi.fn().mockResolvedValue(EMPTY_HABIT_STATUS_PATCH),
    deleteWindDownAction: vi.fn().mockResolvedValue(null),
    exportBackup: vi.fn().mockResolvedValue(null),
    getDesktopNotificationStatus: vi.fn().mockResolvedValue({
      availability: "available" as const,
      reason: null,
    }),
    getFocusSessions: vi.fn().mockResolvedValue([]),
    getFocusTimerShortcutStatus: vi.fn().mockResolvedValue({
      reset: {
        accelerator: "Command+Shift+Backspace",
        activeAccelerator: "Command+Shift+Backspace",
        errorMessage: null,
        isRegistered: true,
      },
      toggle: {
        accelerator: "Command+Shift+Space",
        activeAccelerator: "Command+Shift+Space",
        errorMessage: null,
        isRegistered: true,
      },
    }),
    getFocusTimerState: vi.fn().mockResolvedValue(null),
    getHabits: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
    getHistoryDay: vi.fn().mockResolvedValue(null),
    getHistoryForYear: vi.fn().mockResolvedValue([]),
    getHistorySummary: vi.fn().mockResolvedValue([]),
    getHistoryYears: vi.fn().mockResolvedValue([]),
    getTodayState: vi.fn().mockResolvedValue(null),
    getWeeklyReview: vi.fn().mockResolvedValue(null),
    getWeeklyReviewOverview: vi.fn().mockResolvedValue(null),
    importBackup: vi.fn().mockResolvedValue(false),
    incrementHabitProgress: vi.fn().mockResolvedValue(EMPTY_HABIT_STATUS_PATCH),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    onFocusTimerActionRequested: vi.fn(() => vi.fn()),
    onFocusTimerShortcutStatusChanged: vi.fn(() => vi.fn()),
    onFocusTimerStateChanged: vi.fn(() => vi.fn()),
    onWindDownNavigationRequested: vi.fn(() => vi.fn()),
    openDataFolder: vi.fn().mockResolvedValue(""),
    query: vi.fn().mockResolvedValue(null),
    recordFocusSession: vi.fn().mockResolvedValue(null),
    releaseFocusTimerLeadership: vi.fn().mockResolvedValue(null),
    renameHabit: vi.fn().mockResolvedValue(null),
    renameWindDownAction: vi.fn().mockResolvedValue(null),
    reorderHabits: vi.fn().mockResolvedValue(null),
    resizeFocusWidget: vi.fn().mockResolvedValue(null),
    saveFocusTimerState: vi.fn((state: unknown) => Promise.resolve(state)),
    showFocusWidget: vi.fn().mockResolvedValue(null),
    showMainWindow: vi.fn().mockResolvedValue(null),
    showNotification: vi.fn().mockResolvedValue(null),
    toggleSickDay: vi.fn().mockResolvedValue(null),
    toggleHabit: vi.fn().mockResolvedValue(EMPTY_HABIT_STATUS_PATCH),
    toggleWindDownAction: vi.fn().mockResolvedValue(null),
    unarchiveFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    unarchiveHabit: vi.fn().mockResolvedValue(null),
    upsertFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    updateHabitCategory: vi.fn().mockResolvedValue(null),
    updateHabitFrequency: vi.fn().mockResolvedValue(null),
    updateHabitTargetCount: vi.fn().mockResolvedValue(null),
    updateHabitWeekdays: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn((settings: unknown) => Promise.resolve(settings)),
  } satisfies MockHabitsApi;

  const mock = {
    ...baseMock,
    ...overrides,
  } satisfies MockHabitsApi;

  mock["command"].mockImplementation((command: HabitCommand) =>
    createCommandHandlers(mock as MockHabitsApiInternals)[command.type](
      command as never
    )
  );

  mock["query"].mockImplementation((query: HabitQuery) =>
    createQueryHandlers(mock as MockHabitsApiInternals)[query.type](
      query as never
    )
  );

  return mock as MockHabitsApi;
}

export function installMockHabitsApi(
  overrides: Partial<MockHabitsApi> = {}
): MockHabitsApi {
  const mock = createMockHabitsApi(overrides);
  const targetWindow =
    "window" in globalThis
      ? globalThis.window
      : ({} as Window & typeof globalThis);

  Object.defineProperty(targetWindow, "habits", {
    configurable: true,
    value: mock,
  });

  if (!("window" in globalThis)) {
    vi.stubGlobal("window", targetWindow);
  }

  return mock;
}
