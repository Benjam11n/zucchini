import { vi } from "vitest";

import type { DesktopApi } from "@/shared/contracts/api/desktop-api";
import type { AppCommand } from "@/shared/contracts/ipc/app-command-registry";
import type { AppQuery } from "@/shared/contracts/ipc/app-query-registry";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";

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
    pausedAt: null,
    selectedWeekdays: null,
    sortOrder: 0,
    targetCount: 1,
  },
  habitStreaksStale: true,
};

export type MockDesktopApi = Record<keyof DesktopApi, MockFn> &
  Record<
    | "getHistory"
    | "getHistoryDay"
    | "getHistorySummary"
    | "getHistorySummaryForMonth"
    | "getHistorySummaryForYear"
    | "getHistoryForYear"
    | "getHistoryYears"
    | "getInsightsDashboard"
    | "getTodayState"
    | "getWeeklyReview"
    | "getWeeklyReviewOverview"
    | "reorderHabits"
    | "toggleHabit"
    | "updateSettings",
    MockFn
  > &
  Record<string, MockFn>;

type MockDesktopApiInternals = Record<string, MockFn>;

function getMock(mock: MockDesktopApiInternals, name: string): CallableMockFn {
  const mockFn = mock[name];

  if (!mockFn) {
    throw new Error(`Missing desktop API mock: ${name}`);
  }

  return mockFn as CallableMockFn;
}

function createCommandHandlers(mock: MockDesktopApiInternals) {
  return {
    "focusQuotaGoal.archive": (
      command: Extract<AppCommand, { type: "focusQuotaGoal.archive" }>
    ) => getMock(mock, "archiveFocusQuotaGoal")(command.payload.goalId),
    "focusQuotaGoal.unarchive": (
      command: Extract<AppCommand, { type: "focusQuotaGoal.unarchive" }>
    ) => getMock(mock, "unarchiveFocusQuotaGoal")(command.payload.goalId),
    "focusQuotaGoal.upsert": (
      command: Extract<AppCommand, { type: "focusQuotaGoal.upsert" }>
    ) =>
      getMock(mock, "upsertFocusQuotaGoal")(
        command.payload.frequency,
        command.payload.targetMinutes
      ),
    "focusSession.record": (
      command: Extract<AppCommand, { type: "focusSession.record" }>
    ) => getMock(mock, "recordFocusSession")(command.payload),
    "focusTimer.saveState": (
      command: Extract<AppCommand, { type: "focusTimer.saveState" }>
    ) => getMock(mock, "saveFocusTimerState")(command.payload),
    "habit.archive": (
      command: Extract<AppCommand, { type: "habit.archive" }>
    ) => getMock(mock, "archiveHabit")(command.payload.habitId),
    "habit.create": (command: Extract<AppCommand, { type: "habit.create" }>) =>
      getMock(mock, "createHabit")(
        command.payload.name,
        command.payload.category,
        command.payload.frequency,
        command.payload.selectedWeekdays,
        command.payload.targetCount
      ),
    "habit.decrementProgress": (
      command: Extract<AppCommand, { type: "habit.decrementProgress" }>
    ) => getMock(mock, "decrementHabitProgress")(command.payload.habitId),
    "habit.incrementProgress": (
      command: Extract<AppCommand, { type: "habit.incrementProgress" }>
    ) => getMock(mock, "incrementHabitProgress")(command.payload.habitId),
    "habit.pause": (command: Extract<AppCommand, { type: "habit.pause" }>) =>
      getMock(mock, "pauseHabit")(command.payload.habitId),
    "habit.rename": (command: Extract<AppCommand, { type: "habit.rename" }>) =>
      getMock(mock, "renameHabit")(
        command.payload.habitId,
        command.payload.name
      ),
    "habit.reorder": (
      command: Extract<AppCommand, { type: "habit.reorder" }>
    ) => getMock(mock, "reorderHabits")(command.payload.habitIds),
    "habit.resume": (command: Extract<AppCommand, { type: "habit.resume" }>) =>
      getMock(mock, "resumeHabit")(command.payload.habitId),
    "habit.toggle": (command: Extract<AppCommand, { type: "habit.toggle" }>) =>
      getMock(mock, "toggleHabit")(command.payload.habitId),
    "habit.unarchive": (
      command: Extract<AppCommand, { type: "habit.unarchive" }>
    ) => getMock(mock, "unarchiveHabit")(command.payload.habitId),
    "habit.updateCategory": (
      command: Extract<AppCommand, { type: "habit.updateCategory" }>
    ) =>
      getMock(mock, "updateHabitCategory")(
        command.payload.habitId,
        command.payload.category
      ),
    "habit.updateFrequency": (
      command: Extract<AppCommand, { type: "habit.updateFrequency" }>
    ) =>
      getMock(mock, "updateHabitFrequency")(
        command.payload.habitId,
        command.payload.frequency,
        command.payload.targetCount
      ),
    "habit.updateTargetCount": (
      command: Extract<AppCommand, { type: "habit.updateTargetCount" }>
    ) =>
      getMock(mock, "updateHabitTargetCount")(
        command.payload.habitId,
        command.payload.targetCount
      ),
    "habit.updateWeekdays": (
      command: Extract<AppCommand, { type: "habit.updateWeekdays" }>
    ) =>
      getMock(mock, "updateHabitWeekdays")(
        command.payload.habitId,
        command.payload.selectedWeekdays
      ),
    "settings.update": (
      command: Extract<AppCommand, { type: "settings.update" }>
    ) => getMock(mock, "updateSettings")(command.payload),
    "today.moveUnfinishedToTomorrow": () =>
      getMock(mock, "moveUnfinishedHabitsToTomorrow")(),
    "today.setDayStatus": (
      command: Extract<AppCommand, { type: "today.setDayStatus" }>
    ) => getMock(mock, "setDayStatus")(command.payload.kind),
    "today.toggleCarryover": (
      command: Extract<AppCommand, { type: "today.toggleCarryover" }>
    ) =>
      getMock(mock, "toggleHabitCarryover")(
        command.payload.sourceDate,
        command.payload.habitId
      ),
    "today.toggleSickDay": () => getMock(mock, "toggleSickDay")(),
    "windDown.createAction": (
      command: Extract<AppCommand, { type: "windDown.createAction" }>
    ) => getMock(mock, "createWindDownAction")(command.payload.name),
    "windDown.deleteAction": (
      command: Extract<AppCommand, { type: "windDown.deleteAction" }>
    ) => getMock(mock, "deleteWindDownAction")(command.payload.actionId),
    "windDown.renameAction": (
      command: Extract<AppCommand, { type: "windDown.renameAction" }>
    ) =>
      getMock(mock, "renameWindDownAction")(
        command.payload.actionId,
        command.payload.name
      ),
    "windDown.toggleAction": (
      command: Extract<AppCommand, { type: "windDown.toggleAction" }>
    ) => getMock(mock, "toggleWindDownAction")(command.payload.actionId),
  };
}

function createQueryHandlers(mock: MockDesktopApiInternals) {
  return {
    "focusSession.list": (
      query: Extract<AppQuery, { type: "focusSession.list" }>
    ) => getMock(mock, "getFocusSessions")(query.payload?.limit),
    "focusTimer.getState": () => getMock(mock, "getFocusTimerState")(),
    "habit.list": () => getMock(mock, "getHabits")(),
    "history.get": (query: Extract<AppQuery, { type: "history.get" }>) =>
      query.payload
        ? getMock(mock, "getHistory")(query.payload.limit)
        : getMock(mock, "getHistory")(),
    "history.getDay": (query: Extract<AppQuery, { type: "history.getDay" }>) =>
      getMock(mock, "getHistoryDay")(query.payload.date),
    "history.getYear": (
      query: Extract<AppQuery, { type: "history.getYear" }>
    ) => getMock(mock, "getHistoryForYear")(query.payload.year),
    "history.summary": (
      query: Extract<AppQuery, { type: "history.summary" }>
    ) =>
      query.payload
        ? getMock(mock, "getHistorySummary")(query.payload.limit)
        : getMock(mock, "getHistorySummary")(),
    "history.summaryMonth": (
      query: Extract<AppQuery, { type: "history.summaryMonth" }>
    ) =>
      getMock(mock, "getHistorySummaryForMonth")(
        query.payload.year,
        query.payload.month
      ),
    "history.summaryYear": (
      query: Extract<AppQuery, { type: "history.summaryYear" }>
    ) => getMock(mock, "getHistorySummaryForYear")(query.payload.year),
    "history.years": () => getMock(mock, "getHistoryYears")(),
    "insights.dashboard": () => getMock(mock, "getInsightsDashboard")(),
    "today.get": () => getMock(mock, "getTodayState")(),
    "weeklyReview.get": (
      query: Extract<AppQuery, { type: "weeklyReview.get" }>
    ) => getMock(mock, "getWeeklyReview")(query.payload.weekStart),
    "weeklyReview.overview": () => getMock(mock, "getWeeklyReviewOverview")(),
  };
}

function createMockDesktopApi(
  overrides: Partial<MockDesktopApi> = {}
): MockDesktopApi {
  // oxlint-disable-next-line eslint/sort-keys
  const baseMock = {
    archiveFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    archiveHabit: vi.fn().mockResolvedValue(null),
    chooseBackupForRestore: vi.fn().mockResolvedValue(null),
    clearData: vi.fn().mockResolvedValue(true),
    command: vi.fn().mockResolvedValue(null),
    claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
    claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
    createHabit: vi.fn().mockResolvedValue(null),
    createWindDownAction: vi.fn().mockResolvedValue(null),
    decrementHabitProgress: vi.fn().mockResolvedValue(EMPTY_HABIT_STATUS_PATCH),
    deleteWindDownAction: vi.fn().mockResolvedValue(null),
    exportBackup: vi.fn().mockResolvedValue(null),
    exportCsvData: vi.fn().mockResolvedValue(null),
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
    getLatestAutoBackupRestorePreview: vi.fn().mockResolvedValue(null),
    getFocusTimerState: vi.fn().mockResolvedValue(null),
    getHabits: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
    getHistoryDay: vi.fn().mockResolvedValue(null),
    getHistoryForYear: vi.fn().mockResolvedValue([]),
    getHistorySummary: vi.fn().mockResolvedValue([]),
    getHistorySummaryForMonth: vi.fn().mockResolvedValue([]),
    getHistorySummaryForYear: vi.fn().mockResolvedValue([]),
    getHistoryYears: vi.fn().mockResolvedValue([]),
    getInsightsDashboard: vi.fn().mockResolvedValue(null),
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
    openAutoBackupFolder: vi.fn().mockResolvedValue(""),
    openDataFolder: vi.fn().mockResolvedValue(""),
    pauseHabit: vi.fn().mockResolvedValue(null),
    query: vi.fn().mockResolvedValue(null),
    moveUnfinishedHabitsToTomorrow: vi.fn().mockResolvedValue(null),
    recordFocusSession: vi.fn().mockResolvedValue(null),
    releaseFocusTimerLeadership: vi.fn().mockResolvedValue(null),
    restoreBackup: vi.fn().mockResolvedValue(true),
    renameHabit: vi.fn().mockResolvedValue(null),
    renameWindDownAction: vi.fn().mockResolvedValue(null),
    reorderHabits: vi.fn().mockResolvedValue(null),
    resumeHabit: vi.fn().mockResolvedValue(null),
    resizeFocusWidget: vi.fn().mockResolvedValue(null),
    saveFocusTimerState: vi.fn((state: unknown) => Promise.resolve(state)),
    setDayStatus: vi.fn().mockResolvedValue(null),
    toggleHabitCarryover: vi.fn().mockResolvedValue(null),
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
  } satisfies MockDesktopApi;

  const mock = {
    ...baseMock,
    ...overrides,
  } satisfies MockDesktopApi;

  mock["command"].mockImplementation((command: AppCommand) =>
    createCommandHandlers(mock as MockDesktopApiInternals)[command.type](
      command as never
    )
  );

  mock["query"].mockImplementation((query: AppQuery) =>
    createQueryHandlers(mock as MockDesktopApiInternals)[query.type](
      query as never
    )
  );

  return mock as MockDesktopApi;
}

export function installMockDesktopApi(
  overrides: Partial<MockDesktopApi> = {}
): MockDesktopApi {
  const mock = createMockDesktopApi(overrides);
  const targetWindow =
    "window" in globalThis
      ? globalThis.window
      : ({} as Window & typeof globalThis);

  Object.defineProperty(targetWindow, "desktop", {
    configurable: true,
    value: mock,
  });

  if (!("window" in globalThis)) {
    vi.stubGlobal("window", targetWindow);
  }

  return mock;
}
