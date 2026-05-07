// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

import type { TodayState } from "@/shared/contracts/today-state";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import { installMockHabitsApi } from "@/test/fixtures/habits-api-mock";

function createTodayState(overrides: Partial<TodayState> = {}): TodayState {
  const { dayStatus = null, ...rest } = overrides;

  return {
    date: "2026-03-10",
    dayStatus,
    focusMinutes: 0,
    habits: [
      {
        category: "productivity",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 1,
        isArchived: false,
        name: "Plan top 3 tasks",
        sortOrder: 0,
      },
    ],
    settings: {
      ...createDefaultAppSettings("Asia/Singapore"),
      resetFocusTimerShortcut: "Command+Shift+Backspace",
      toggleFocusTimerShortcut: "Command+Shift+Space",
    },
    streak: {
      availableFreezes: 1,
      bestStreak: 4,
      currentStreak: 2,
      lastEvaluatedDate: "2026-03-09",
    },
    ...rest,
  };
}

function createHistoryDay(date = "2026-03-10"): HistoryDay {
  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits: [],
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

function createManagedHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    category: "productivity",
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id: 1,
    isArchived: false,
    name: "Plan top 3 tasks",
    sortOrder: 0,
    ...overrides,
  };
}

function createWeeklyReview(
  overrides: Partial<WeeklyReview> = {}
): WeeklyReview {
  const {
    rescheduledDays = 0,
    restDays = 0,
    sickDays = 0,
    ...rest
  } = overrides;

  return {
    completedDays: 5,
    completionRate: 71,
    dailyCadence: [],
    endingStreak: 6,
    focusMinutes: 0,
    freezeDays: 1,
    habitMetrics: [],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 4,
    missedDays: 1,
    mostMissedHabits: [],
    rescheduledDays,
    restDays,
    sickDays,
    trackedDays: 7,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
    ...rest,
  };
}

function createWeeklyReviewOverview(
  latestReview: WeeklyReview | null = null
): WeeklyReviewOverview {
  return {
    availableWeeks: latestReview
      ? [
          {
            completionRate: latestReview.completionRate,
            label: latestReview.label,
            weekEnd: latestReview.weekEnd,
            weekStart: latestReview.weekStart,
          },
        ]
      : [],
    latestReview,
    trend: [],
  };
}

function createLocalStorageMock() {
  const storage = new Map<string, string>();

  return {
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

async function setupUseAppController({
  history = [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")],
  systemTheme = "light",
  todayState = createTodayState(),
  weeklyReview = createWeeklyReview(),
  weeklyReviewOverview = createWeeklyReviewOverview(null),
}: {
  history?: HistoryDay[];
  systemTheme?: "dark" | "light";
  todayState?: TodayState;
  weeklyReview?: WeeklyReview;
  weeklyReviewOverview?: WeeklyReviewOverview;
} = {}) {
  vi.resetModules();
  const localStorageMock = createLocalStorageMock();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });

  localStorageMock.clear();
  document.documentElement.className = "";

  const mediaQuery = {
    addEventListener: vi.fn(),
    matches: systemTheme === "dark",
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    removeEventListener: vi.fn(),
  };

  const habits = installMockHabitsApi({
    archiveHabit: vi.fn().mockResolvedValue(todayState),
    claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
    claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
    createHabit: vi.fn().mockResolvedValue(todayState),
    getDesktopNotificationStatus: vi
      .fn()
      .mockResolvedValue({ availability: "available", reason: null }),
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
    getHabits: vi.fn().mockResolvedValue([createManagedHabit()]),
    getHistory: vi.fn((limit?: number) =>
      Promise.resolve(limit === 14 ? history.slice(0, 2) : history)
    ),
    getTodayState: vi.fn().mockResolvedValue(todayState),
    getWeeklyReview: vi.fn().mockResolvedValue(weeklyReview),
    getWeeklyReviewOverview: vi.fn().mockResolvedValue(weeklyReviewOverview),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    onFocusTimerActionRequested: vi.fn(() => vi.fn()),
    onFocusTimerShortcutStatusChanged: vi.fn(() => vi.fn()),
    onFocusTimerStateChanged: vi.fn(() => vi.fn()),
    recordFocusSession: vi.fn((_input) => Promise.resolve()),
    releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
    renameHabit: vi.fn().mockResolvedValue(todayState),
    reorderHabits: vi.fn().mockResolvedValue(todayState),
    resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
    saveFocusTimerState: vi.fn((state) => Promise.resolve(state)),
    showFocusWidget: vi.fn(() => Promise.resolve()),
    showMainWindow: vi.fn(() => Promise.resolve()),
    showNotification: vi.fn().mockResolvedValue(42),
    toggleHabit: vi.fn().mockResolvedValue(todayState),
    unarchiveHabit: vi.fn().mockResolvedValue(todayState),
    updateHabitCategory: vi.fn().mockResolvedValue(todayState),
    updateHabitFrequency: vi.fn().mockResolvedValue(todayState),
    updateHabitWeekdays: vi.fn().mockResolvedValue(todayState),
    updateSettings: vi
      .fn()
      .mockImplementation((settings) => Promise.resolve(settings)),
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });
  Object.defineProperty(window, "requestIdleCallback", {
    configurable: true,
    value: vi.fn((...callbackArgs: [IdleRequestCallback]) => {
      const [callback] = callbackArgs;
      Reflect.apply(callback, undefined, [
        { didTimeout: false, timeRemaining: () => 50 },
      ]);
      return 1;
    }),
    writable: true,
  });
  Object.defineProperty(window, "cancelIdleCallback", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
  /* oxlint-enable promise/prefer-await-to-callbacks */

  const { useAppController } = await import("./use-app-controller");
  const hook = renderHook(() => useAppController());

  await waitFor(() => {
    expect(hook.result.current.state.bootPhase).toBe("ready");
  });

  return {
    habits,
    hook,
  };
}

function getSettingsDraftOrThrow(
  hook: Awaited<ReturnType<typeof setupUseAppController>>["hook"]
) {
  const { settingsDraft } = hook.result.current.state;
  if (!settingsDraft) {
    throw new Error("Expected settingsDraft to be available in this test.");
  }

  return settingsDraft;
}

describe("use app controller", () => {
  it("autosaves valid settings changes after the debounce", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const { habits, hook } = await setupUseAppController();

    act(() => {
      hook.result.current.actions.handleSettingsDraftChange({
        ...getSettingsDraftOrThrow(hook),
        reminderTime: "21:15",
      });
    });

    await waitFor(() => {
      expect(hook.result.current.state.settingsSavePhase).toBe("pending");
    });

    await waitFor(
      () => {
        expect(habits.updateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            reminderTime: "21:15",
          })
        );
        expect(hook.result.current.state.settingsSavePhase).toBe("saved");
      },
      {
        timeout: 2000,
      }
    );
  });

  it("autosaves valid pomodoro settings changes after the debounce", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const { habits, hook } = await setupUseAppController();

    act(() => {
      hook.result.current.actions.handleSettingsDraftChange({
        ...getSettingsDraftOrThrow(hook),
        focusLongBreakSeconds: 20 * 60,
      });
    });

    await waitFor(() => {
      expect(hook.result.current.state.settingsSavePhase).toBe("pending");
    });

    await waitFor(
      () => {
        expect(habits.updateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            focusLongBreakSeconds: 20 * 60,
          })
        );
        expect(hook.result.current.state.settingsSavePhase).toBe("saved");
      },
      {
        timeout: 2000,
      }
    );
  });

  it("marks invalid settings drafts without calling updateSettings", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const { habits, hook } = await setupUseAppController();

    act(() => {
      hook.result.current.actions.handleTabChange("settings");
    });

    act(() => {
      hook.result.current.actions.handleSettingsDraftChange({
        ...getSettingsDraftOrThrow(hook),
        reminderTime: "99:99",
      });
    });

    await waitFor(() => {
      expect(hook.result.current.state.settingsSavePhase).toBe("invalid");
      expect(hook.result.current.state.settingsFieldErrors.reminderTime).toBe(
        "Reminder time must use HH:MM 24-hour format."
      );
    });

    expect(habits.updateSettings).not.toHaveBeenCalled();
  });

  it("marks invalid pomodoro drafts without calling updateSettings", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const { habits, hook } = await setupUseAppController();

    act(() => {
      hook.result.current.actions.handleTabChange("settings");
    });

    act(() => {
      hook.result.current.actions.handleSettingsDraftChange({
        ...getSettingsDraftOrThrow(hook),
        focusLongBreakSeconds: 3 * 60,
        focusShortBreakSeconds: 5 * 60,
      });
    });

    await waitFor(() => {
      expect(hook.result.current.state.settingsSavePhase).toBe("invalid");
      expect(
        hook.result.current.state.settingsFieldErrors.focusLongBreakSeconds
      ).toBe(
        "Long break duration must be greater than or equal to short break duration."
      );
    });

    expect(habits.updateSettings).not.toHaveBeenCalled();
  });

  it("syncs a dark system theme onto the document root when themeMode is system", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    await setupUseAppController({
      systemTheme: "dark",
      todayState: createTodayState({
        settings: {
          ...createTodayState().settings,
          themeMode: "system",
        },
      }),
    });

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("loads the weekly review from History before opening the Monday spotlight", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const latestReview = createWeeklyReview();
    const { habits, hook } = await setupUseAppController({
      todayState: createTodayState({
        date: "2026-03-09",
      }),
      weeklyReview: latestReview,
      weeklyReviewOverview: createWeeklyReviewOverview(latestReview),
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(habits.getWeeklyReviewOverview).not.toHaveBeenCalled();

    act(() => {
      hook.result.current.actions.handleTabChange("history");
    });

    await waitFor(() => {
      expect(habits.getWeeklyReviewOverview).toHaveBeenCalledWith();
      expect(
        hook.result.current.state.isWeeklyReviewSpotlightOpen
      ).toBeTruthy();
    });

    await act(async () => {
      await hook.result.current.actions.handleWeeklyReviewOpen();
    });

    await waitFor(() => {
      expect(hook.result.current.tab).toBe("history");
      expect(hook.result.current.state.selectedWeeklyReview?.weekStart).toBe(
        "2026-03-02"
      );
      expect(hook.result.current.state.isWeeklyReviewSpotlightOpen).toBeFalsy();
    });

    expect(habits.getWeeklyReview).not.toHaveBeenCalled();

    expect(localStorage.getItem("zucchini_weekly_review")).toBe(
      JSON.stringify({
        lastSeenWeeklyReviewStart: "2026-03-02",
      })
    );

    vi.useRealTimers();
  });

  it("refreshes app state when the local day rolls over", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-03-10T23:59:58"));

    const { habits, hook } = await setupUseAppController({
      todayState: createTodayState({
        date: "2026-03-10",
      }),
    });

    habits.getTodayState.mockResolvedValue(
      createTodayState({
        date: "2026-03-11",
      })
    );
    habits.getHistory.mockResolvedValue([
      createHistoryDay("2026-03-11"),
      createHistoryDay("2026-03-10"),
    ]);

    await act(async () => {
      vi.setSystemTime(new Date("2026-03-11T00:00:01"));
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(hook.result.current.state.todayState?.date).toBe("2026-03-11");

    vi.useRealTimers();
  });

  it("refreshes app state on window focus after the local day changes", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-03-10T09:00:00"));

    const { habits, hook } = await setupUseAppController({
      todayState: createTodayState({
        date: "2026-03-10",
      }),
    });

    habits.getTodayState.mockResolvedValue(
      createTodayState({
        date: "2026-03-11",
      })
    );
    habits.getHistory.mockResolvedValue([
      createHistoryDay("2026-03-11"),
      createHistoryDay("2026-03-10"),
    ]);

    await act(async () => {
      vi.setSystemTime(new Date("2026-03-11T09:00:00"));
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.current.state.todayState?.date).toBe("2026-03-11");

    vi.useRealTimers();
  });
});
