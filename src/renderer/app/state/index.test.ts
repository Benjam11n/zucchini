import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { HistoryDay } from "@/shared/domain/history";
import type {
  CompleteOnboardingInput,
  OnboardingStatus,
} from "@/shared/domain/onboarding";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

function createTodayState(): TodayState {
  return {
    date: "2026-03-10",
    habits: [],
    settings: {
      focusCyclesBeforeLongBreak: 4,
      focusDefaultDurationSeconds: 1500,
      focusLongBreakSeconds: 15 * 60,
      focusShortBreakSeconds: 5 * 60,
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
      bestStreak: 3,
      currentStreak: 2,
      lastEvaluatedDate: "2026-03-09",
    },
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

function createWeeklyReview(name: string): WeeklyReview {
  return {
    completedDays: 1,
    completionRate: 100,
    dailyCadence: [],
    endingStreak: 2,
    freezeDays: 0,
    habitMetrics: [
      {
        category: "productivity",
        completedOpportunities: 1,
        completionRate: 100,
        frequency: "daily",
        habitId: 1,
        missedOpportunities: 0,
        name,
        opportunities: 1,
        sortOrder: 0,
      },
    ],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 1,
    missedDays: 0,
    mostMissedHabits: [],
    trackedDays: 1,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
  };
}

function createFocusSession(
  id: number,
  completedAt = "2026-03-10T09:25:00.000Z"
): FocusSession {
  return {
    completedAt,
    completedDate: "2026-03-10",
    durationSeconds: 1500,
    entryKind: "completed",
    id,
    startedAt: "2026-03-10T09:00:00.000Z",
    timerSessionId: `timer-session-${id}`,
  };
}

function createOnboardingStatus(
  overrides: Partial<OnboardingStatus> = {}
): OnboardingStatus {
  return {
    completedAt: null,
    isComplete: false,
    ...overrides,
  };
}

describe("app store actions", () => {
  async function setup(onboardingStatus = createOnboardingStatus()) {
    vi.resetModules();
    vi.unstubAllGlobals();
    const getHistoryMock = vi.fn((limit?: number) =>
      Promise.resolve(
        limit === 14
          ? [createHistoryDay("2026-03-10")]
          : [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
      )
    );
    const getOnboardingStatusMock = vi.fn().mockResolvedValue(onboardingStatus);
    const getFocusSessionsMock = vi
      .fn()
      .mockResolvedValue([createFocusSession(1)]);
    const getTodayStateMock = vi.fn().mockResolvedValue(createTodayState());
    const getWeeklyReviewMock = vi.fn();
    const getWeeklyReviewOverviewMock = vi.fn();
    const renameHabitMock = vi.fn().mockResolvedValue(createTodayState());
    const completeOnboardingMock = vi.fn().mockResolvedValue({
      ...createTodayState(),
      habits: [
        {
          category: "productivity",
          completed: false,
          createdAt: "2026-03-10T00:00:00.000Z",
          frequency: "daily",
          id: 1,
          isArchived: false,
          name: "Plan top 3 tasks",
          sortOrder: 0,
        },
      ],
      settings: {
        ...createTodayState().settings,
        reminderTime: "21:15",
      },
    });
    const skipOnboardingMock = vi.fn().mockImplementation(async () => {});
    const applyStarterPackMock = vi.fn().mockResolvedValue({
      ...createTodayState(),
      habits: [
        {
          category: "fitness",
          completed: false,
          createdAt: "2026-03-10T00:00:00.000Z",
          frequency: "daily",
          id: 1,
          isArchived: false,
          name: "20-minute walk",
          sortOrder: 0,
        },
      ],
    });

    vi.stubGlobal("window", {
      habits: {
        applyStarterPack: applyStarterPackMock,
        completeOnboarding: completeOnboardingMock,
        getFocusSessions: getFocusSessionsMock,
        getHistory: getHistoryMock,
        getOnboardingStatus: getOnboardingStatusMock,
        getTodayState: getTodayStateMock,
        getWeeklyReview: getWeeklyReviewMock,
        getWeeklyReviewOverview: getWeeklyReviewOverviewMock,
        recordFocusSession: vi.fn().mockResolvedValue(createFocusSession(2)),
        renameHabit: renameHabitMock,
        skipOnboarding: skipOnboardingMock,
      },
      matchMedia: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
    const { appActions } =
      await import("@/renderer/app/controller/app-actions");
    const { resetBootStore, useBootStore } =
      await import("@/renderer/app/state/boot-store");
    const { resetUiStore, useUiStore } =
      await import("@/renderer/app/state/ui-store");
    const { resetFocusStore, useFocusStore } =
      await import("@/renderer/features/focus/state/focus-store");
    const { resetHistoryStore, useHistoryStore } =
      await import("@/renderer/features/history/state/history-store");
    const { resetWeeklyReviewStore, useWeeklyReviewStore } =
      await import("@/renderer/features/history/weekly-review/state/weekly-review-store");
    const { resetOnboardingStore, useOnboardingStore } =
      await import("@/renderer/features/onboarding/state/onboarding-store");
    const { resetSettingsStore, useSettingsStore } =
      await import("@/renderer/features/settings/state/settings-store");
    const { resetTodayStore, useTodayStore } =
      await import("@/renderer/features/today/state/today-store");

    resetBootStore();
    resetFocusStore();
    resetHistoryStore();
    resetOnboardingStore();
    resetSettingsStore();
    resetTodayStore();
    resetUiStore();
    resetWeeklyReviewStore();

    return {
      actions: appActions,
      applyStarterPackMock,
      completeOnboardingMock,
      getFocusSessionsMock,
      getHistoryMock,
      getOnboardingStatusMock,
      getWeeklyReviewOverviewMock,
      skipOnboardingMock,
      stores: {
        useBootStore,
        useFocusStore,
        useHistoryStore,
        useOnboardingStore,
        useSettingsStore,
        useTodayStore,
        useUiStore,
        useWeeklyReviewStore,
      },
    };
  }

  it("reloads weekly review data after a habit rename when weekly reviews are already loaded", async () => {
    const freshWeeklyReview = createWeeklyReview("Make buried chapters video");
    const { actions, getWeeklyReviewOverviewMock, stores } = await setup();
    getWeeklyReviewOverviewMock.mockResolvedValue({
      availableWeeks: [
        {
          completionRate: freshWeeklyReview.completionRate,
          label: freshWeeklyReview.label,
          weekEnd: freshWeeklyReview.weekEnd,
          weekStart: freshWeeklyReview.weekStart,
        },
      ],
      latestReview: freshWeeklyReview,
      trend: [],
    });

    stores.useWeeklyReviewStore.setState({
      selectedWeeklyReview: createWeeklyReview(
        "Make buried chapters videp hasbit"
      ),
      weeklyReviewPhase: "ready",
    });

    await actions.handleRenameHabit(1, "Make buried chapters video");

    expect(getWeeklyReviewOverviewMock).toHaveBeenCalledWith();
    expect(
      stores.useWeeklyReviewStore.getState().selectedWeeklyReview
        ?.habitMetrics[0]?.name
    ).toBe("Make buried chapters video");
  });

  it("loads focus sessions once after switching to the focus tab", async () => {
    const { actions, getFocusSessionsMock } = await setup();

    actions.handleTabChange("focus");
    actions.handleTabChange("focus");

    await vi.waitFor(() => {
      // oxlint-disable-next-line vitest/prefer-called-once
      expect(getFocusSessionsMock).toHaveBeenCalledTimes(1);
    });
  });

  it("opens onboarding after boot when there are zero habits and onboarding is incomplete", async () => {
    const { actions, getHistoryMock, stores } = await setup(
      createOnboardingStatus()
    );

    await actions.bootApp();

    expect(getHistoryMock).toHaveBeenCalledWith(14);
    expect(stores.useOnboardingStore.getState().isOnboardingOpen).toBeTruthy();
  });

  it("does not open onboarding after boot when onboarding was already completed", async () => {
    const { actions, stores } = await setup(
      createOnboardingStatus({
        completedAt: "2026-03-09T08:00:00.000Z",
        isComplete: true,
      })
    );

    await actions.bootApp();

    expect(stores.useOnboardingStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("completes onboarding and refreshes today state", async () => {
    const { actions, completeOnboardingMock, stores } = await setup(
      createOnboardingStatus()
    );
    await actions.bootApp();

    const input: CompleteOnboardingInput = {
      habits: [
        {
          category: "productivity",
          frequency: "daily",
          name: "Plan top 3 tasks",
        },
      ],
      settings: {
        ...createTodayState().settings,
        reminderTime: "21:15",
      },
    };

    await actions.handleCompleteOnboarding(input);

    expect(completeOnboardingMock).toHaveBeenCalledWith(input);
    expect(stores.useOnboardingStore.getState().isOnboardingOpen).toBeFalsy();
    expect(
      stores.useTodayStore.getState().todayState?.settings.reminderTime
    ).toBe("21:15");
  });

  it("skips onboarding and prevents it from reappearing on reload", async () => {
    const completedStatus = createOnboardingStatus({
      completedAt: "2026-03-10T08:00:00.000Z",
      isComplete: true,
    });
    const { actions, getOnboardingStatusMock, skipOnboardingMock, stores } =
      await setup(createOnboardingStatus());
    await actions.bootApp();
    getOnboardingStatusMock.mockResolvedValue(completedStatus);

    await actions.handleSkipOnboarding();

    expect(skipOnboardingMock).toHaveBeenCalledWith();
    expect(stores.useOnboardingStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("applies a starter pack from settings and refreshes today state without reopening onboarding", async () => {
    const completedStatus = createOnboardingStatus({
      completedAt: "2026-03-09T08:00:00.000Z",
      isComplete: true,
    });
    const { actions, applyStarterPackMock, stores } =
      await setup(completedStatus);
    await actions.bootApp();

    await actions.handleApplyStarterPack([
      {
        category: "fitness",
        frequency: "daily",
        name: "20-minute walk",
      },
    ]);

    expect(applyStarterPackMock).toHaveBeenCalledWith([
      {
        category: "fitness",
        frequency: "daily",
        name: "20-minute walk",
      },
    ]);
    expect(stores.useTodayStore.getState().todayState?.habits[0]?.name).toBe(
      "20-minute walk"
    );
    expect(stores.useOnboardingStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("loads full history after switching to the history tab", async () => {
    const { actions, getHistoryMock, stores } = await setup(
      createOnboardingStatus()
    );
    await actions.bootApp();

    actions.handleTabChange("history");
    await Promise.resolve();
    await Promise.resolve();

    expect(getHistoryMock).toHaveBeenNthCalledWith(1, 14);
    expect(getHistoryMock).toHaveBeenNthCalledWith(2);
    expect(stores.useHistoryStore.getState().historyScope).toBe("full");
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2026-03-10", "2026-03-09"]);
  });

  it("keeps using full history after a mutation once the history tab has been opened", async () => {
    const { actions, getHistoryMock } = await setup(createOnboardingStatus());
    await actions.bootApp();

    actions.handleTabChange("history");
    await Promise.resolve();
    await Promise.resolve();

    await actions.handleRenameHabit(1, "Make buried chapters");

    expect(getHistoryMock).toHaveBeenLastCalledWith();
  });
});
