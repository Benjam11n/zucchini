import type { TodayState } from "@/shared/contracts/habits-ipc";
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

function createOnboardingStatus(
  overrides: Partial<OnboardingStatus> = {}
): OnboardingStatus {
  return {
    completedAt: null,
    isComplete: false,
    ...overrides,
  };
}

describe("useAppStore weekly review refresh", () => {
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
        getHistory: getHistoryMock,
        getOnboardingStatus: getOnboardingStatusMock,
        getTodayState: getTodayStateMock,
        getWeeklyReview: getWeeklyReviewMock,
        getWeeklyReviewOverview: getWeeklyReviewOverviewMock,
        renameHabit: renameHabitMock,
        skipOnboarding: skipOnboardingMock,
      },
      matchMedia: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
    const { useAppStore } = await import("./store");

    return {
      applyStarterPackMock,
      completeOnboardingMock,
      getHistoryMock,
      getOnboardingStatusMock,
      getWeeklyReviewOverviewMock,
      skipOnboardingMock,
      useAppStore,
    };
  }

  it("reloads weekly review data after a habit rename when weekly reviews are already loaded", async () => {
    const freshWeeklyReview = createWeeklyReview("Make buried chapters video");
    const { getWeeklyReviewOverviewMock, useAppStore } = await setup();
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

    useAppStore.setState({
      selectedWeeklyReview: createWeeklyReview(
        "Make buried chapters videp hasbit"
      ),
      weeklyReviewPhase: "ready",
    });

    await useAppStore
      .getState()
      .handleRenameHabit(1, "Make buried chapters video");

    expect(getWeeklyReviewOverviewMock).toHaveBeenCalledWith();
    expect(
      useAppStore.getState().selectedWeeklyReview?.habitMetrics[0]?.name
    ).toBe("Make buried chapters video");
  });

  it("opens onboarding after boot when there are zero habits and onboarding is incomplete", async () => {
    const { getHistoryMock, useAppStore } = await setup(
      createOnboardingStatus()
    );

    await useAppStore.getState().bootApp();

    expect(getHistoryMock).toHaveBeenCalledWith(14);
    expect(useAppStore.getState().isOnboardingOpen).toBeTruthy();
  });

  it("does not open onboarding after boot when onboarding was already completed", async () => {
    const { useAppStore } = await setup(
      createOnboardingStatus({
        completedAt: "2026-03-09T08:00:00.000Z",
        isComplete: true,
      })
    );

    await useAppStore.getState().bootApp();

    expect(useAppStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("completes onboarding and refreshes today state", async () => {
    const { completeOnboardingMock, useAppStore } = await setup(
      createOnboardingStatus()
    );
    await useAppStore.getState().bootApp();

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

    await useAppStore.getState().handleCompleteOnboarding(input);

    expect(completeOnboardingMock).toHaveBeenCalledWith(input);
    expect(useAppStore.getState().isOnboardingOpen).toBeFalsy();
    expect(useAppStore.getState().todayState?.settings.reminderTime).toBe(
      "21:15"
    );
  });

  it("skips onboarding and prevents it from reappearing on reload", async () => {
    const completedStatus = createOnboardingStatus({
      completedAt: "2026-03-10T08:00:00.000Z",
      isComplete: true,
    });
    const { getOnboardingStatusMock, skipOnboardingMock, useAppStore } =
      await setup(createOnboardingStatus());
    await useAppStore.getState().bootApp();
    getOnboardingStatusMock.mockResolvedValue(completedStatus);

    await useAppStore.getState().handleSkipOnboarding();

    expect(skipOnboardingMock).toHaveBeenCalledWith();
    expect(useAppStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("applies a starter pack from settings and refreshes today state without reopening onboarding", async () => {
    const completedStatus = createOnboardingStatus({
      completedAt: "2026-03-09T08:00:00.000Z",
      isComplete: true,
    });
    const { applyStarterPackMock, useAppStore } = await setup(completedStatus);
    await useAppStore.getState().bootApp();

    await useAppStore.getState().handleApplyStarterPack([
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
    expect(useAppStore.getState().todayState?.habits[0]?.name).toBe(
      "20-minute walk"
    );
    expect(useAppStore.getState().isOnboardingOpen).toBeFalsy();
  });

  it("loads full history after switching to the history tab", async () => {
    const { getHistoryMock, useAppStore } = await setup(
      createOnboardingStatus()
    );
    await useAppStore.getState().bootApp();

    useAppStore.getState().handleTabChange("history");
    await Promise.resolve();
    await Promise.resolve();

    expect(getHistoryMock).toHaveBeenNthCalledWith(1, 14);
    expect(getHistoryMock).toHaveBeenNthCalledWith(2);
    expect(useAppStore.getState().historyScope).toBe("full");
    expect(useAppStore.getState().history.map((day) => day.date)).toStrictEqual(
      ["2026-03-10", "2026-03-09"]
    );
  });

  it("keeps using full history after a mutation once the history tab has been opened", async () => {
    const { getHistoryMock, useAppStore } = await setup(
      createOnboardingStatus()
    );
    await useAppStore.getState().bootApp();

    useAppStore.getState().handleTabChange("history");
    await Promise.resolve();
    await Promise.resolve();

    await useAppStore.getState().handleRenameHabit(1, "Make buried chapters");

    expect(getHistoryMock).toHaveBeenLastCalledWith();
  });
});
