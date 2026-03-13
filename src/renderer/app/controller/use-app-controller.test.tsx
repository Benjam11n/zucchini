// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { OnboardingStatus } from "@/shared/domain/onboarding";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

function createTodayState(overrides: Partial<TodayState> = {}): TodayState {
  return {
    date: "2026-03-10",
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
      launchAtLogin: false,
      minimizeToTray: false,
      reminderEnabled: true,
      reminderSnoozeMinutes: 15,
      reminderTime: "20:30",
      themeMode: "system",
      timezone: "Asia/Singapore",
    },
    streak: {
      availableFreezes: 1,
      bestStreak: 4,
      currentStreak: 2,
      lastEvaluatedDate: "2026-03-09",
    },
    ...overrides,
  };
}

function createHistoryDay(date = "2026-03-10"): HistoryDay {
  return {
    categoryProgress: [],
    date,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      freezeUsed: false,
      streakCountAfterDay: 2,
    },
  };
}

function createOnboardingStatus(
  overrides: Partial<OnboardingStatus> = {}
): OnboardingStatus {
  return {
    completedAt: "2026-03-01T08:00:00.000Z",
    isComplete: true,
    ...overrides,
  };
}

function createWeeklyReview(
  overrides: Partial<WeeklyReview> = {}
): WeeklyReview {
  return {
    completedDays: 5,
    completionRate: 71,
    dailyCadence: [],
    endingStreak: 6,
    freezeDays: 1,
    habitMetrics: [],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 4,
    missedDays: 1,
    mostMissedHabits: [],
    trackedDays: 7,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
    ...overrides,
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
  onboardingStatus = createOnboardingStatus(),
  systemTheme = "light",
  todayState = createTodayState(),
  weeklyReview = createWeeklyReview(),
  weeklyReviewOverview = createWeeklyReviewOverview(null),
}: {
  history?: HistoryDay[];
  onboardingStatus?: OnboardingStatus;
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

  const habits = {
    applyStarterPack: vi.fn().mockResolvedValue(todayState),
    archiveHabit: vi.fn().mockResolvedValue(todayState),
    claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
    claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
    completeOnboarding: vi.fn().mockResolvedValue(todayState),
    createHabit: vi.fn().mockResolvedValue(todayState),
    getFocusSessions: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn((limit?: number) =>
      Promise.resolve(limit === 14 ? history.slice(0, 2) : history)
    ),
    getOnboardingStatus: vi.fn().mockResolvedValue(onboardingStatus),
    getTodayState: vi.fn().mockResolvedValue(todayState),
    getWeeklyReview: vi.fn().mockResolvedValue(weeklyReview),
    getWeeklyReviewOverview: vi.fn().mockResolvedValue(weeklyReviewOverview),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    recordFocusSession: vi.fn((_input) => Promise.resolve()),
    releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
    renameHabit: vi.fn().mockResolvedValue(todayState),
    reorderHabits: vi.fn().mockResolvedValue(todayState),
    resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
    showFocusWidget: vi.fn(() => Promise.resolve()),
    showMainWindow: vi.fn(() => Promise.resolve()),
    showNotification: vi.fn().mockResolvedValue(42),
    skipOnboarding: vi.fn().mockResolvedValue(42),
    toggleHabit: vi.fn().mockResolvedValue(todayState),
    updateHabitCategory: vi.fn().mockResolvedValue(todayState),
    updateHabitFrequency: vi.fn().mockResolvedValue(todayState),
    updateSettings: vi
      .fn()
      .mockImplementation((settings) => Promise.resolve(settings)),
  };

  Object.defineProperty(window, "habits", {
    configurable: true,
    value: habits,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });

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

describe("use app controller", () => {
  it("autosaves valid settings changes after the debounce", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const { habits, hook } = await setupUseAppController();

    act(() => {
      hook.result.current.actions.handleSettingsDraftChange({
        ...hook.result.current.state.settingsDraft!,
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
        ...hook.result.current.state.settingsDraft!,
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

  it("opens the weekly review spotlight on Monday and routes through the open action", async () => {
    cleanup();
    (globalThis.localStorage as { clear?: () => void } | undefined)?.clear?.();
    document.documentElement.className = "";
    vi.restoreAllMocks();

    const latestReview = createWeeklyReview();
    const { habits, hook } = await setupUseAppController({
      todayState: createTodayState({
        date: "2026-03-09",
      }),
      weeklyReview: latestReview,
      weeklyReviewOverview: createWeeklyReviewOverview(latestReview),
    });

    await waitFor(() => {
      // oxlint-disable-next-line vitest/prefer-called-once
      expect(habits.getWeeklyReviewOverview).toHaveBeenCalledTimes(1);
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
  });
});
