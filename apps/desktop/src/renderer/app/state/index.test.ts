import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { Habit, HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { WeeklyReview } from "@/shared/domain/weekly-review";
import { installMockHabitsApi } from "@/test/fixtures/habits-api-mock";

function createTodayState(overrides: Partial<TodayState> = {}): TodayState {
  const { dayStatus = null, ...rest } = overrides;

  return {
    date: "2026-03-10",
    dayStatus,
    focusMinutes: 0,
    habits: [],
    settings: {
      ...createDefaultAppSettings("Asia/Singapore"),
      resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
      toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
    },
    streak: {
      availableFreezes: 1,
      bestStreak: 3,
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

function createManagedHabit(id = 1): Habit {
  return {
    category: "productivity",
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
  };
}

function createTodayHabit(
  overrides: Partial<HabitWithStatus> = {}
): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id: 1,
    isArchived: false,
    name: "Plan top 3 tasks",
    sortOrder: 0,
    ...overrides,
  };
}

function createWeeklyReview(name: string): WeeklyReview {
  return {
    completedDays: 1,
    completionRate: 100,
    dailyCadence: [],
    endingStreak: 2,
    focusMinutes: 0,
    freezeDays: 0,
    habitHeatmapRows: [],
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
    rescheduledDays: 0,
    restDays: 0,
    sickDays: 0,
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

function createDeferred<T>() {
  const { promise, reject, resolve } = (
    Promise as typeof Promise & {
      withResolvers<T>(): {
        promise: Promise<T>;
        reject: (reason?: unknown) => void;
        resolve: (value: T | PromiseLike<T>) => void;
      };
    }
  ).withResolvers<T>();

  return {
    promise,
    reject,
    resolve,
  };
}

describe("app store actions", () => {
  async function setup() {
    vi.resetModules();
    vi.unstubAllGlobals();
    const getHistoryMock = vi.fn((limit?: number) =>
      Promise.resolve(
        limit === 69
          ? [createHistoryDay("2026-03-10")]
          : [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
      )
    );
    const getHistoryDayMock = vi.fn((date: string) =>
      Promise.resolve(createHistoryDay(date))
    );
    const getHistoryForYearMock = vi.fn((year: number) =>
      Promise.resolve(
        year === 2026
          ? [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
          : []
      )
    );
    const getHistorySummaryMock = vi.fn((limit?: number) =>
      Promise.resolve(
        limit === 14
          ? [createHistoryDay("2026-03-10")]
          : [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
      )
    );
    const getHistorySummaryForYearMock = vi.fn((year: number) =>
      Promise.resolve(
        year === 2026
          ? [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
          : []
      )
    );
    const getHistorySummaryForMonthMock = vi.fn((year: number) =>
      Promise.resolve(
        year === 2026
          ? [createHistoryDay("2026-03-10"), createHistoryDay("2026-03-09")]
          : []
      )
    );
    const getHistoryYearsMock = vi.fn().mockResolvedValue([2026]);
    const getFocusSessionsMock = vi
      .fn()
      .mockResolvedValue([createFocusSession(1)]);
    const getHabitsMock = vi.fn().mockResolvedValue([createManagedHabit(1)]);
    const getTodayStateMock = vi.fn().mockResolvedValue(createTodayState());
    const getWeeklyReviewMock = vi.fn();
    const getWeeklyReviewOverviewMock = vi.fn();
    const renameHabitMock = vi.fn().mockResolvedValue(createTodayState());
    const toggleHabitMock = vi.fn().mockResolvedValue({
      habit: {
        category: "productivity",
        completed: true,
        completedCount: 1,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 1,
        isArchived: false,
        name: "Plan top 3 tasks",
        sortOrder: 0,
        targetCount: 1,
      },
      habitStreaksStale: true,
    } satisfies HabitStatusPatch);

    const habitsApi = installMockHabitsApi({
      getFocusSessions: getFocusSessionsMock,
      getHabits: getHabitsMock,
      getHistory: getHistoryMock,
      getHistoryDay: getHistoryDayMock,
      getHistoryForYear: getHistoryForYearMock,
      getHistorySummary: getHistorySummaryMock,
      getHistorySummaryForMonth: getHistorySummaryForMonthMock,
      getHistorySummaryForYear: getHistorySummaryForYearMock,
      getHistoryYears: getHistoryYearsMock,
      getTodayState: getTodayStateMock,
      getWeeklyReview: getWeeklyReviewMock,
      getWeeklyReviewOverview: getWeeklyReviewOverviewMock,
      recordFocusSession: vi.fn().mockResolvedValue(createFocusSession(2)),
      renameHabit: renameHabitMock,
      toggleHabit: toggleHabitMock,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
    const { appActions } =
      await import("@/renderer/app/controller/app-actions");
    const { useBootStore } = await import("@/renderer/app/state/boot-store");
    const { useUiStore } = await import("@/renderer/app/state/ui-store");
    const { createIdleFocusTimerState } =
      await import("@/renderer/features/focus/lib/focus-timer-state");
    const { useFocusStore } =
      await import("@/renderer/features/focus/state/focus-store");
    const { useHistoryStore } =
      await import("@/renderer/features/history/state/history-store");
    const { useWeeklyReviewStore } =
      await import("@/renderer/features/history/weekly-review/state/weekly-review-store");
    const { useSettingsStore } =
      await import("@/renderer/features/settings/state/settings-store");
    const { useTodayStore } =
      await import("@/renderer/features/today/state/today-store");

    useBootStore.setState({ bootError: null, bootPhase: "loading" });
    useFocusStore.setState({
      focusSaveErrorMessage: null,
      focusSessions: [],
      focusSessionsLoadError: null,
      focusSessionsPhase: "idle",
      hasLoadedFocusSessions: false,
      timerState: createIdleFocusTimerState(),
    });
    useHistoryStore.setState({
      contributionHistory: [],
      hasLoadedHistorySummary: false,
      history: [],
      historyDayByDate: {},
      historyLoadError: null,
      historySummary: [],
      historySummaryByMonth: {},
      historySummaryByYear: {},
      historyYears: [],
      isHistoryContributionLoading: false,
      isHistoryDayLoading: false,
      isHistoryLoading: false,
      isHistorySummaryLoading: false,
      loadingHistoryDayKey: null,
      selectedHistoryYear: null,
    });
    useSettingsStore.setState({
      settingsDraft: null,
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
      settingsSavePhase: "idle",
    });
    useTodayStore.setState({ managedHabits: [], todayState: null });
    useUiStore.setState({ systemTheme: "light", tab: "today" });
    useWeeklyReviewStore.setState({
      isWeeklyReviewSpotlightOpen: false,
      selectedWeeklyReview: null,
      weeklyReviewError: null,
      weeklyReviewOverview: null,
      weeklyReviewPhase: "idle",
    });

    return {
      actions: appActions,
      getFocusSessionsMock,
      getHabitsMock,
      getHistoryDayMock,
      getHistoryForYearMock,
      getHistoryMock,
      getHistorySummaryForMonthMock,
      getHistorySummaryForYearMock,
      getHistorySummaryMock,
      getHistoryYearsMock,
      getWeeklyReviewOverviewMock,
      habitsApi,
      stores: {
        useBootStore,
        useFocusStore,
        useHistoryStore,
        useSettingsStore,
        useTodayStore,
        useUiStore,
        useWeeklyReviewStore,
      },
      toggleHabitMock,
    };
  }

  it("reloads weekly review data in the background after a habit rename when weekly reviews are already loaded", async () => {
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

    await vi.waitFor(() => {
      expect(getWeeklyReviewOverviewMock).toHaveBeenCalledWith();
      expect(
        stores.useWeeklyReviewStore.getState().selectedWeeklyReview
          ?.habitMetrics[0]?.name
      ).toBe("Make buried chapters video");
    });
  });

  it("loads focus sessions once after switching to the focus tab", async () => {
    const { actions, getFocusSessionsMock } = await setup();

    actions.handleTabChange("focus");
    actions.handleTabChange("focus");

    await vi.waitFor(() => {
      expect(getFocusSessionsMock.mock.calls).toHaveLength(1);
    });
  });

  it("loads today state during boot without blocking on history", async () => {
    const { actions, getHistoryMock, stores } = await setup();

    await actions.bootApp();

    expect(getHistoryMock).not.toHaveBeenCalled();
    expect(stores.useTodayStore.getState().todayState?.date).toBe("2026-03-10");
  });

  it("loads lightweight history summary after boot", async () => {
    const { actions, getHistorySummaryMock, stores } = await setup();
    await actions.bootApp();

    await actions.loadHistorySummary();

    expect(getHistorySummaryMock).toHaveBeenCalledWith(14);
    expect(
      stores.useHistoryStore.getState().historySummary.map((day) => day.date)
    ).toStrictEqual(["2026-03-10"]);
  });

  it("loads month summary for first paint and year summary in the background", async () => {
    const {
      actions,
      getHistoryForYearMock,
      getHistorySummaryForMonthMock,
      getHistorySummaryForYearMock,
      getHistoryYearsMock,
      stores,
    } = await setup();
    await actions.bootApp();

    await actions.loadHistoryYears();

    expect(getHistoryYearsMock).toHaveBeenCalledWith();
    expect(getHistorySummaryForMonthMock).toHaveBeenCalledWith(2026, 3);
    await vi.waitFor(() => {
      expect(getHistorySummaryForYearMock).toHaveBeenCalledWith(2026);
    });
    expect(getHistoryForYearMock).not.toHaveBeenCalled();
    expect(stores.useHistoryStore.getState().selectedHistoryYear).toBe(2026);
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2026-03-10", "2026-03-09"]);
  });

  it("dedupes concurrent history year loads", async () => {
    const { actions, getHistoryYearsMock } = await setup();
    const historyYearsRequest = createDeferred<number[]>();
    getHistoryYearsMock.mockReturnValue(historyYearsRequest.promise);

    const firstLoad = actions.loadHistoryYears();
    const secondLoad = actions.loadHistoryYears();

    await vi.waitFor(() => {
      expect(getHistoryYearsMock).toHaveBeenCalledTimes(1);
    });

    historyYearsRequest.resolve([2026]);
    await Promise.all([firstLoad, secondLoad]);
  });

  it("loads a newly selected year while another year summary is still loading", async () => {
    const {
      actions,
      getHistorySummaryForMonthMock,
      getHistorySummaryForYearMock,
      getHistoryYearsMock,
      stores,
    } = await setup();
    const currentYearRequest = createDeferred<HistoryDay[]>();
    getHistoryYearsMock.mockResolvedValue([2026, 2025]);
    getHistorySummaryForMonthMock.mockImplementation((year: number) =>
      Promise.resolve(year === 2025 ? [createHistoryDay("2025-03-31")] : [])
    );
    getHistorySummaryForYearMock.mockImplementation((year: number) =>
      year === 2026
        ? currentYearRequest.promise
        : Promise.resolve([createHistoryDay("2025-12-31")])
    );
    await actions.bootApp();

    const initialLoad = actions.loadHistoryYears();
    await vi.waitFor(() => {
      expect(getHistorySummaryForYearMock).toHaveBeenCalledWith(2026);
    });

    await actions.selectHistoryMonth(2025, 3);

    expect(getHistorySummaryForMonthMock).toHaveBeenCalledWith(2025, 3);
    expect(getHistorySummaryForYearMock).toHaveBeenCalledWith(2025);
    expect(stores.useHistoryStore.getState().selectedHistoryYear).toBe(2025);
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2025-03-31"]);

    currentYearRequest.resolve([createHistoryDay("2026-03-10")]);
    await initialLoad;
    expect(stores.useHistoryStore.getState().selectedHistoryYear).toBe(2025);
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2025-03-31"]);
  });

  it("does not reload year summary after a structural habit mutation once history has been opened", async () => {
    const { actions, getHistorySummaryForYearMock } = await setup();
    await actions.bootApp();

    await actions.loadHistoryYears();

    await actions.handleRenameHabit(1, "Make buried chapters");

    expect(getHistorySummaryForYearMock).toHaveBeenCalledTimes(1);
  });

  it("loads selected history day details once and caches them", async () => {
    const { getHistoryDayMock, stores } = await setup();

    await stores.useHistoryStore.getState().loadHistoryDay("2026-03-09");
    await stores.useHistoryStore.getState().loadHistoryDay("2026-03-09");

    expect(getHistoryDayMock).toHaveBeenCalledTimes(1);
    expect(
      stores.useHistoryStore.getState().historyDayByDate["2026-03-09"]?.date
    ).toBe("2026-03-09");
  });

  it("optimistically updates the habit order before the reorder request resolves", async () => {
    const { actions, habitsApi, stores } = await setup();
    const baseHabit = {
      ...createManagedHabit(1),
      completed: false,
    };

    const reorderedState = createTodayState({
      habits: [
        {
          ...baseHabit,
          id: 2,
          name: "Review notes",
          sortOrder: 0,
        },
        {
          ...baseHabit,
          id: 1,
          name: "Plan top 3 tasks",
          sortOrder: 1,
        },
      ],
    });
    const reorderRequest = createDeferred<TodayState>();

    habitsApi.reorderHabits.mockImplementation(() => reorderRequest.promise);

    stores.useTodayStore.setState({
      todayState: reorderedState,
    });

    const nextHabits = [...reorderedState.habits].toReversed();
    const reorderPromise = actions.handleReorderHabits(nextHabits);

    expect(stores.useTodayStore.getState().todayState?.habits).toStrictEqual(
      nextHabits
    );
    expect(
      stores.useTodayStore
        .getState()
        .todayState?.habits.map((habit) => habit.id)
    ).toStrictEqual(nextHabits.map((habit) => habit.id));

    reorderRequest.resolve({
      ...reorderedState,
      habits: nextHabits,
    });
    await reorderPromise;
  });

  it("optimistically toggles a habit before the authoritative refresh resolves", async () => {
    const { actions, habitsApi, stores } = await setup();
    const pendingPatch = createDeferred<HabitStatusPatch>();

    habitsApi.toggleHabit.mockImplementation(() => pendingPatch.promise);

    const initialHabit = createTodayHabit();
    const initialTodayState = createTodayState({
      habits: [initialHabit],
    });

    stores.useTodayStore.setState({
      todayState: initialTodayState,
    });

    const togglePromise = actions.handleToggleHabit(1);

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeTruthy();

    pendingPatch.resolve({
      habit: {
        category: "productivity",
        completed: true,
        completedCount: 1,
        createdAt: "2026-03-01T00:00:00.000Z",
        frequency: "daily",
        id: 1,
        isArchived: false,
        name: "Plan top 3 tasks",
        sortOrder: 0,
        targetCount: 1,
      },
      habitStreaksStale: true,
    });

    await togglePromise;

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeTruthy();
  });

  it("bases rapid optimistic toggles on the current today state", async () => {
    const { actions, habitsApi, stores } = await setup();
    const firstPatch = createDeferred<HabitStatusPatch>();
    const secondPatch = createDeferred<HabitStatusPatch>();

    habitsApi.toggleHabit
      .mockImplementationOnce(() => firstPatch.promise)
      .mockImplementationOnce(() => secondPatch.promise);

    const initialHabit = createTodayHabit();
    const initialTodayState = createTodayState({
      habits: [initialHabit],
    });

    stores.useTodayStore.setState({
      todayState: initialTodayState,
    });
    const firstToggle = actions.handleToggleHabit(1);
    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeTruthy();

    const secondToggle = actions.handleToggleHabit(1);
    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeFalsy();

    firstPatch.resolve({
      habit: {
        ...initialHabit,
        completed: true,
        completedCount: 1,
        targetCount: 1,
      },
      habitStreaksStale: true,
    });
    secondPatch.resolve({
      habit: {
        ...initialHabit,
        completed: false,
        completedCount: 0,
        targetCount: 1,
      },
      habitStreaksStale: true,
    });

    await Promise.all([firstToggle, secondToggle]);

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeFalsy();
  });

  it("does not let older habit status responses overwrite newer clicks", async () => {
    const { actions, habitsApi, stores } = await setup();
    const firstPatch = createDeferred<HabitStatusPatch>();
    const secondPatch = createDeferred<HabitStatusPatch>();

    habitsApi.toggleHabit
      .mockImplementationOnce(() => firstPatch.promise)
      .mockImplementationOnce(() => secondPatch.promise);

    const initialHabit = createTodayHabit();
    const initialTodayState = createTodayState({
      habits: [initialHabit],
    });

    stores.useTodayStore.setState({
      todayState: initialTodayState,
    });
    const firstToggle = actions.handleToggleHabit(1);
    const secondToggle = actions.handleToggleHabit(1);

    secondPatch.resolve({
      habit: {
        ...initialHabit,
        completed: false,
        completedCount: 0,
        targetCount: 1,
      },
      habitStreaksStale: true,
    });
    await secondToggle;

    firstPatch.resolve({
      habit: {
        ...initialHabit,
        completed: true,
        completedCount: 1,
        targetCount: 1,
      },
      habitStreaksStale: true,
    });
    await firstToggle;

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeFalsy();
  });

  it("restores the previous today state when an optimistic toggle fails", async () => {
    const { actions, habitsApi, stores } = await setup();
    const toggleError = new Error("toggle failed");

    habitsApi.toggleHabit.mockRejectedValue(toggleError);

    const initialTodayState = createTodayState({
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
    });

    stores.useTodayStore.setState({
      todayState: initialTodayState,
    });

    await expect(actions.handleToggleHabit(1)).rejects.toThrow("toggle failed");
    expect(stores.useTodayStore.getState().todayState).toStrictEqual(
      initialTodayState
    );
  });
});
