/**
 * Today page action creators.
 *
 * Provides the primary mutation surface for habit toggles, CRUD operations,
 * tab navigation, and data reloading. Each action calls through the preload
 * bridge (`window.desktop`) and optimistically updates the Zustand store on
 * success. Reorder and toggle actions include optimistic rollback on failure.
 */
import type { AppTab } from "@/renderer/app/app.types";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useInsightsStore } from "@/renderer/features/insights/state/insights-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { useWeeklyReviewStore } from "@/renderer/features/weekly-review/state/weekly-review-store";
import { appClient } from "@/renderer/shared/lib/app-client";
import { getDateKeyMonth } from "@/shared/domain/date-key";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";
import type { TodayState } from "@/shared/read-models/today-state";

import {
  applyTodayReloadResult,
  applyHabitStatusPatch,
  applyOptimisticHabitStreakPatch,
  applyTodayState,
  refreshWeeklyReviewIfLoaded,
  resetInsightsIfLoaded,
  reorderVisibleTodayHabits,
} from "./action-helpers";

export type ReloadAllFn = (
  nextTodayState?: TodayState,
  options?: { refreshHistoryYears?: boolean }
) => Promise<void>;

type HabitStatusMutationKind = "decrement" | "increment" | "toggle";

const habitStatusMutationVersions = new Map<number, number>();

function startHabitStatusMutation(habitId: number): number {
  const nextVersion = (habitStatusMutationVersions.get(habitId) ?? 0) + 1;
  habitStatusMutationVersions.set(habitId, nextVersion);
  return nextVersion;
}

function isLatestHabitStatusMutation(
  habitId: number,
  mutationVersion: number
): boolean {
  return habitStatusMutationVersions.get(habitId) === mutationVersion;
}

function preloadWeeklyReviewAfterHistoryPaint(): void {
  window.setTimeout(() => {
    void useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
  }, 350);
}

function toggleHabitStatus(habit: HabitWithStatus): HabitWithStatus {
  const targetCount = habit.targetCount ?? 1;

  return {
    ...habit,
    completed: !habit.completed,
    completedCount: habit.completed ? 0 : targetCount,
  };
}

function incrementHabitProgressStatus(habit: HabitWithStatus): HabitWithStatus {
  const targetCount = habit.targetCount ?? 1;
  const completedCount = (habit.completedCount ?? 0) + 1;

  return {
    ...habit,
    completed: completedCount >= targetCount,
    completedCount,
  };
}

function decrementHabitProgressStatus(habit: HabitWithStatus): HabitWithStatus {
  const targetCount = habit.targetCount ?? 1;
  const completedCount = Math.max(0, (habit.completedCount ?? 0) - 1);

  return {
    ...habit,
    completed: completedCount >= targetCount,
    completedCount,
  };
}

function getOptimisticHabitStatus(
  habit: HabitWithStatus,
  kind: HabitStatusMutationKind
): HabitWithStatus {
  switch (kind) {
    case "decrement": {
      return decrementHabitProgressStatus(habit);
    }
    case "increment": {
      return incrementHabitProgressStatus(habit);
    }
    case "toggle": {
      return toggleHabitStatus(habit);
    }
    default: {
      kind satisfies never;
      return habit;
    }
  }
}

function createOptimisticHabitStatusPatch(
  habitId: number,
  kind: HabitStatusMutationKind
): HabitStatusPatch | null {
  const habit = useTodayStore
    .getState()
    .todayState?.habits.find((candidate) => candidate.id === habitId);

  if (!habit) {
    return null;
  }

  return {
    habit: getOptimisticHabitStatus(habit, kind),
    habitStreaksStale: true,
  };
}

function syncSettingsDraftFromTodayState() {
  const { todayState } = useTodayStore.getState();
  const { settingsDraft } = useSettingsStore.getState();

  useSettingsStore.setState({
    settingsDraft: todayState?.settings ?? settingsDraft,
  });
}

async function refreshWeeklyReviewOverview() {
  if (useWeeklyReviewStore.getState().weeklyReviewPhase === "idle") {
    return;
  }

  await useWeeklyReviewStore
    .getState()
    .loadWeeklyReviewOverview({ force: true });
}

const reloadAll: ReloadAllFn = async (nextTodayState, options = {}) => {
  const todayState = nextTodayState ?? (await appClient.getTodayState());
  const managedHabits = await appClient.getHabits();

  applyTodayReloadResult({
    managedHabits,
    todayState,
  });
  resetInsightsIfLoaded();

  if (options.refreshHistoryYears) {
    await useHistoryStore.getState().loadHistoryYears({
      force: true,
      initialMonth: getDateKeyMonth(todayState.date),
    });
  }
};

async function applyTodayMutation(mutator: Promise<TodayState>) {
  const nextTodayState = await mutator;
  const managedHabits = await appClient.getHabits();
  applyTodayState(nextTodayState, managedHabits);
  refreshWeeklyReviewIfLoaded();
  resetInsightsIfLoaded();
  return nextTodayState;
}

export function createTodayActions({
  loadFocusSessions,
}: {
  loadFocusSessions: (force?: boolean) => Promise<void>;
}) {
  async function refreshToday(mutator: Promise<TodayState>) {
    const nextTodayState = await mutator;
    await Promise.all([
      reloadAll(nextTodayState),
      refreshWeeklyReviewOverview(),
    ]);
  }

  async function refreshForNewDay() {
    await reloadAll(undefined, { refreshHistoryYears: true });
    await refreshWeeklyReviewOverview();
  }

  function applyTodayCommand<TArgs extends unknown[]>(
    run: (...args: TArgs) => Promise<TodayState>
  ) {
    return async (...args: TArgs) => {
      await applyTodayMutation(run(...args));
    };
  }

  function refreshTodayCommand<TArgs extends unknown[]>(
    run: (...args: TArgs) => Promise<TodayState>
  ) {
    return async (...args: TArgs) => {
      await refreshToday(run(...args));
    };
  }

  async function applyHabitStatusMutation({
    habitId,
    mutationKind,
    run,
  }: {
    habitId: number;
    mutationKind: HabitStatusMutationKind;
    run: () => Promise<HabitStatusPatch>;
  }) {
    const previousTodayState = useTodayStore.getState().todayState;
    const previousHabit = previousTodayState?.habits.find(
      (habit) => habit.id === habitId
    );
    const mutationVersion = startHabitStatusMutation(habitId);
    const optimisticPatch = createOptimisticHabitStatusPatch(
      habitId,
      mutationKind
    );

    if (optimisticPatch) {
      applyHabitStatusPatch(optimisticPatch);
      if (previousHabit?.frequency === "daily") {
        applyOptimisticHabitStreakPatch({
          habitId,
          nextCompleted: optimisticPatch.habit.completed,
          previousCompleted: previousHabit.completed,
        });
      }
    }

    try {
      const confirmedPatch = await run();
      if (isLatestHabitStatusMutation(habitId, mutationVersion)) {
        applyHabitStatusPatch(confirmedPatch);
        resetInsightsIfLoaded();
      }
    } catch (error) {
      if (
        previousHabit &&
        previousTodayState &&
        isLatestHabitStatusMutation(habitId, mutationVersion)
      ) {
        useTodayStore.setState({
          todayState: previousTodayState,
        });
      }
      throw error;
    }
  }

  // oxlint-disable-next-line eslint/sort-keys
  return {
    applyTodayMutation,
    handleArchiveFocusQuotaGoal: applyTodayCommand(
      appClient.archiveFocusQuotaGoal
    ),
    handleArchiveHabit: applyTodayCommand(appClient.archiveHabit),
    async handleCreateHabit(
      name: string,
      category: HabitCategory,
      frequency: HabitFrequency,
      selectedWeekdays: HabitWeekday[] | null = null,
      targetCount: number | null = null
    ) {
      await applyTodayMutation(
        appClient.createHabit(
          name,
          category,
          frequency,
          selectedWeekdays,
          targetCount
        )
      );
      syncSettingsDraftFromTodayState();
    },
    handleCreateWindDownAction: applyTodayCommand(
      appClient.createWindDownAction
    ),
    async handleDecrementHabitProgress(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "decrement",
        run: () => appClient.decrementHabitProgress(habitId),
      });
    },
    handleDeleteWindDownAction: applyTodayCommand(
      appClient.deleteWindDownAction
    ),
    async handleIncrementHabitProgress(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "increment",
        run: () => appClient.incrementHabitProgress(habitId),
      });
    },
    handleRenameHabit: applyTodayCommand(appClient.renameHabit),
    handlePauseHabit: applyTodayCommand(appClient.pauseHabit),
    handleRenameWindDownAction: applyTodayCommand(
      appClient.renameWindDownAction
    ),
    async handleReorderHabits(nextHabits: Habit[]) {
      const previousTodayState = useTodayStore.getState().todayState;
      const previousManagedHabits = useTodayStore.getState().managedHabits;

      useTodayStore.setState({
        managedHabits: nextHabits,
        todayState: reorderVisibleTodayHabits(nextHabits, previousTodayState),
      });

      try {
        await applyTodayMutation(
          appClient.reorderHabits(nextHabits.map((habit) => habit.id))
        );
      } catch (error) {
        useTodayStore.setState({
          managedHabits: previousManagedHabits,
          todayState: previousTodayState,
        });
        throw error;
      }
    },
    handleTabChange(nextTab: AppTab) {
      useUiStore.getState().setTab(nextTab);

      if (nextTab === "settings") {
        syncSettingsDraftFromTodayState();
      }

      if (nextTab === "focus") {
        void loadFocusSessions();
      }

      if (nextTab === "history") {
        const todayDate = useTodayStore.getState().todayState?.date;
        const initialMonth = todayDate ? getDateKeyMonth(todayDate) : undefined;
        void useHistoryStore
          .getState()
          .loadHistoryYears(initialMonth ? { initialMonth } : {});
        preloadWeeklyReviewAfterHistoryPaint();
      }

      if (nextTab === "insights") {
        void useInsightsStore.getState().loadDashboard();
      }
    },
    handleOpenWindDown() {
      useUiStore.getState().setTab("windDown");
    },
    handleCloseWindDown() {
      useUiStore.getState().setTab("today");
    },
    async handleToggleHabit(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "toggle",
        run: () => appClient.toggleHabit(habitId),
      });
    },
    handleToggleHabitCarryover: refreshTodayCommand(
      appClient.toggleHabitCarryover
    ),
    handleToggleSickDay: refreshTodayCommand(appClient.toggleSickDay),
    handleSetDayStatus: refreshTodayCommand(appClient.setDayStatus),
    handleToggleWindDownAction: refreshTodayCommand(
      appClient.toggleWindDownAction
    ),
    handleUnarchiveFocusQuotaGoal: applyTodayCommand(
      appClient.unarchiveFocusQuotaGoal
    ),
    handleUnarchiveHabit: applyTodayCommand(appClient.unarchiveHabit),
    handleResumeHabit: applyTodayCommand(appClient.resumeHabit),
    handleUpsertFocusQuotaGoal: refreshTodayCommand(
      appClient.upsertFocusQuotaGoal
    ),
    handleUpdateHabitCategory: applyTodayCommand(appClient.updateHabitCategory),
    handleUpdateHabitFrequency: applyTodayCommand(
      appClient.updateHabitFrequency
    ),
    handleUpdateHabitTargetCount: applyTodayCommand(
      appClient.updateHabitTargetCount
    ),
    handleUpdateHabitWeekdays: applyTodayCommand(appClient.updateHabitWeekdays),
    refreshForNewDay,
    reloadAll,
    setSystemTheme(systemTheme: "dark" | "light") {
      useUiStore.getState().setSystemTheme(systemTheme);
    },
  };
}
