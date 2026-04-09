import { vi } from "vitest";

import type { HabitsApi } from "@/shared/contracts/habits-ipc";

export type MockHabitsApi = {
  [K in keyof HabitsApi]: ReturnType<typeof vi.fn>;
};

function createMockHabitsApi(
  overrides: Partial<MockHabitsApi> = {}
): MockHabitsApi {
  // oxlint-disable-next-line eslint/sort-keys
  const mock = {
    archiveFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    archiveHabit: vi.fn().mockResolvedValue(null),
    clearData: vi.fn().mockResolvedValue(true),
    claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
    claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
    createHabit: vi.fn().mockResolvedValue(null),
    createWindDownAction: vi.fn().mockResolvedValue(null),
    decrementHabitProgress: vi.fn().mockResolvedValue(null),
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
    getTodayState: vi.fn().mockResolvedValue(null),
    getWeeklyReview: vi.fn().mockResolvedValue(null),
    getWeeklyReviewOverview: vi.fn().mockResolvedValue(null),
    importBackup: vi.fn().mockResolvedValue(false),
    incrementHabitProgress: vi.fn().mockResolvedValue(null),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    onFocusTimerActionRequested: vi.fn(() => vi.fn()),
    onFocusTimerShortcutStatusChanged: vi.fn(() => vi.fn()),
    onFocusTimerStateChanged: vi.fn(() => vi.fn()),
    onWindDownNavigationRequested: vi.fn(() => vi.fn()),
    openDataFolder: vi.fn().mockResolvedValue(""),
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
    toggleHabit: vi.fn().mockResolvedValue(null),
    toggleWindDownAction: vi.fn().mockResolvedValue(null),
    unarchiveFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    unarchiveHabit: vi.fn().mockResolvedValue(null),
    upsertFocusQuotaGoal: vi.fn().mockResolvedValue(null),
    updateHabitCategory: vi.fn().mockResolvedValue(null),
    updateHabitFrequency: vi.fn().mockResolvedValue(null),
    updateHabitTargetCount: vi.fn().mockResolvedValue(null),
    updateHabitWeekdays: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn((settings: unknown) => Promise.resolve(settings)),
  } satisfies Record<keyof HabitsApi, ReturnType<typeof vi.fn>>;

  return { ...mock, ...overrides } as MockHabitsApi;
}

export function installMockHabitsApi(
  overrides: Partial<MockHabitsApi> = {}
): MockHabitsApi {
  const mock = createMockHabitsApi(overrides);
  Object.defineProperty(window, "habits", {
    configurable: true,
    value: mock,
  });
  return mock;
}
