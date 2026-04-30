import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { TodayState } from "@/shared/contracts/today-state";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
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

function createWeeklyReview(name: string): WeeklyReview {
  return {
    completedDays: 1,
    completionRate: 100,
    dailyCadence: [],
    endingStreak: 2,
    focusMinutes: 0,
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
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  // Deferred promises are intentional here so tests can control async resolution.
  // eslint-disable-next-line promise/avoid-new
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

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
    const getFocusSessionsMock = vi
      .fn()
      .mockResolvedValue([createFocusSession(1)]);
    const getHabitsMock = vi.fn().mockResolvedValue([createManagedHabit(1)]);
    const getTodayStateMock = vi.fn().mockResolvedValue(createTodayState());
    const getWeeklyReviewMock = vi.fn();
    const getWeeklyReviewOverviewMock = vi.fn();
    const renameHabitMock = vi.fn().mockResolvedValue(createTodayState());
    const toggleHabitMock = vi.fn().mockResolvedValue(
      createTodayState({
        habits: [
          {
            category: "productivity",
            completed: true,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily",
            id: 1,
            isArchived: false,
            name: "Plan top 3 tasks",
            sortOrder: 0,
          },
        ],
      })
    );

    const habitsApi = installMockHabitsApi({
      getFocusSessions: getFocusSessionsMock,
      getHabits: getHabitsMock,
      getHistory: getHistoryMock,
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
    const { resetSettingsStore, useSettingsStore } =
      await import("@/renderer/features/settings/state/settings-store");
    const { resetTodayStore, useTodayStore } =
      await import("@/renderer/features/today/state/today-store");

    resetBootStore();
    resetFocusStore();
    resetHistoryStore();
    resetSettingsStore();
    resetTodayStore();
    resetUiStore();
    resetWeeklyReviewStore();

    return {
      actions: appActions,
      getFocusSessionsMock,
      getHabitsMock,
      getHistoryMock,
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

  it("loads recent history and today state during boot", async () => {
    const { actions, getHistoryMock, stores } = await setup();

    await actions.bootApp();

    expect(getHistoryMock).toHaveBeenCalledWith(69);
    expect(stores.useTodayStore.getState().todayState?.date).toBe("2026-03-10");
  });

  it("keeps current-year history after switching to the history tab", async () => {
    const { actions, getHistoryMock, stores } = await setup();
    await actions.bootApp();

    actions.handleTabChange("history");
    await Promise.resolve();
    await Promise.resolve();

    expect(getHistoryMock.mock.calls).toHaveLength(1);
    expect(getHistoryMock).toHaveBeenNthCalledWith(1, 69);
    expect(stores.useHistoryStore.getState().historyScope).toBe("recent");
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2026-03-10"]);
  });

  it("loads full history only when explicitly requested", async () => {
    const { actions, getHistoryMock, stores } = await setup();
    await actions.bootApp();

    await actions.loadFullHistory();

    expect(getHistoryMock).toHaveBeenNthCalledWith(1, 69);
    expect(getHistoryMock).toHaveBeenNthCalledWith(2);
    expect(stores.useHistoryStore.getState().historyScope).toBe("full");
    expect(
      stores.useHistoryStore.getState().history.map((day) => day.date)
    ).toStrictEqual(["2026-03-10", "2026-03-09"]);
  });

  it("does not reload history after a structural habit mutation once full history has been opened", async () => {
    const { actions, getHistoryMock } = await setup();
    await actions.bootApp();

    await actions.loadFullHistory();

    await actions.handleRenameHabit(1, "Make buried chapters");

    expect(getHistoryMock).toHaveBeenCalledTimes(2);
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

    reorderRequest.resolve({
      ...reorderedState,
      habits: nextHabits,
    });
    await reorderPromise;
  });

  it("optimistically toggles a habit before the authoritative refresh resolves", async () => {
    const { actions, habitsApi, stores } = await setup();
    const pendingTodayState = createDeferred<TodayState>();

    habitsApi.toggleHabit.mockImplementation(() => pendingTodayState.promise);

    stores.useTodayStore.setState({
      todayState: createTodayState({
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
      }),
    });

    const togglePromise = actions.handleToggleHabit(1);

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeTruthy();

    pendingTodayState.resolve(
      createTodayState({
        habits: [
          {
            category: "productivity",
            completed: true,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily",
            id: 1,
            isArchived: false,
            name: "Plan top 3 tasks",
            sortOrder: 0,
          },
        ],
      })
    );

    await togglePromise;

    expect(
      stores.useTodayStore.getState().todayState?.habits[0]?.completed
    ).toBeTruthy();
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
