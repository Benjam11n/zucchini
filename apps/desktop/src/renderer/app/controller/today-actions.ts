/**
 * Today page action creators.
 *
 * Provides the primary mutation surface for habit toggles, CRUD operations,
 * tab navigation, and data reloading. Each action calls through the preload
 * bridge (`window.habits`) and optimistically updates the Zustand store on
 * success. Reorder and toggle actions include optimistic rollback on failure.
 */
import type { AppTab } from "@/renderer/app/app.types";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
  HabitWeekday,
} from "@/shared/domain/habit";

import {
  applyTodayReloadResult,
  applyHabitStatusPatch,
  applyOptimisticHabitStreakPatch,
  applyTodayState,
  refreshWeeklyReviewIfLoaded,
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

export function createTodayActions({
  loadFocusSessions,
}: {
  loadFocusSessions: (force?: boolean) => Promise<void>;
}) {
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

    await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
  }

  const reloadAll: ReloadAllFn = async (nextTodayState, options = {}) => {
    const todayState = nextTodayState ?? (await habitsClient.getTodayState());
    const managedHabits = await habitsClient.getHabits();

    applyTodayReloadResult({
      managedHabits,
      todayState,
    });

    if (options.refreshHistoryYears) {
      await useHistoryStore.getState().loadHistoryYears({ force: true });
    }
  };

  async function refreshToday(mutator: Promise<TodayState>) {
    const nextTodayState = await mutator;
    await reloadAll(nextTodayState);
    await refreshWeeklyReviewOverview();
  }

  async function refreshForNewDay() {
    await reloadAll(undefined, { refreshHistoryYears: true });
    await refreshWeeklyReviewOverview();
  }

  async function applyTodayMutation(mutator: Promise<TodayState>) {
    const nextTodayState = await mutator;
    const managedHabits = await habitsClient.getHabits();
    applyTodayState(nextTodayState, managedHabits);
    refreshWeeklyReviewIfLoaded();
    return nextTodayState;
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
    async handleArchiveFocusQuotaGoal(goalId: number) {
      await applyTodayMutation(habitsClient.archiveFocusQuotaGoal(goalId));
    },
    async handleArchiveHabit(habitId: number) {
      await applyTodayMutation(habitsClient.archiveHabit(habitId));
    },
    async handleCreateHabit(
      name: string,
      category: HabitCategory,
      frequency: HabitFrequency,
      selectedWeekdays: HabitWeekday[] | null = null,
      targetCount: number | null = null
    ) {
      await applyTodayMutation(
        habitsClient.createHabit(
          name,
          category,
          frequency,
          selectedWeekdays,
          targetCount
        )
      );
      syncSettingsDraftFromTodayState();
    },
    async handleCreateWindDownAction(name: string) {
      await applyTodayMutation(habitsClient.createWindDownAction(name));
    },
    async handleDecrementHabitProgress(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "decrement",
        run: () => habitsClient.decrementHabitProgress(habitId),
      });
    },
    async handleDeleteWindDownAction(actionId: number) {
      await applyTodayMutation(habitsClient.deleteWindDownAction(actionId));
    },
    async handleIncrementHabitProgress(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "increment",
        run: () => habitsClient.incrementHabitProgress(habitId),
      });
    },
    async handleRenameHabit(habitId: number, name: string) {
      await applyTodayMutation(habitsClient.renameHabit(habitId, name));
    },
    async handleRenameWindDownAction(actionId: number, name: string) {
      await applyTodayMutation(
        habitsClient.renameWindDownAction(actionId, name)
      );
    },
    async handleReorderHabits(nextHabits: Habit[]) {
      const previousTodayState = useTodayStore.getState().todayState;
      const previousManagedHabits = useTodayStore.getState().managedHabits;

      useTodayStore.setState({
        managedHabits: nextHabits,
        todayState: reorderVisibleTodayHabits(nextHabits, previousTodayState),
      });

      try {
        await applyTodayMutation(
          habitsClient.reorderHabits(nextHabits.map((habit) => habit.id))
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
        void useHistoryStore.getState().loadHistoryYears();
        void useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
      }
    },
    handleOpenWindDown() {
      useUiStore.getState().setTab("windDown");
    },
    async handleMoveUnfinishedHabitsToTomorrow() {
      await refreshToday(habitsClient.moveUnfinishedHabitsToTomorrow());
    },
    handleCloseWindDown() {
      useUiStore.getState().setTab("today");
    },
    async handleToggleHabit(habitId: number) {
      await applyHabitStatusMutation({
        habitId,
        mutationKind: "toggle",
        run: () => habitsClient.toggleHabit(habitId),
      });
    },
    async handleToggleHabitCarryover(sourceDate: string, habitId: number) {
      await refreshToday(
        habitsClient.toggleHabitCarryover(sourceDate, habitId)
      );
    },
    async handleToggleSickDay() {
      await refreshToday(habitsClient.toggleSickDay());
    },
    async handleSetDayStatus(kind: DayStatusKind | null) {
      await refreshToday(habitsClient.setDayStatus(kind));
    },
    async handleToggleWindDownAction(actionId: number) {
      await refreshToday(habitsClient.toggleWindDownAction(actionId));
    },
    async handleUnarchiveFocusQuotaGoal(goalId: number) {
      await applyTodayMutation(habitsClient.unarchiveFocusQuotaGoal(goalId));
    },
    async handleUnarchiveHabit(habitId: number) {
      await applyTodayMutation(habitsClient.unarchiveHabit(habitId));
    },
    async handleUpsertFocusQuotaGoal(
      frequency: GoalFrequency,
      targetMinutes: number
    ) {
      await refreshToday(
        habitsClient.upsertFocusQuotaGoal(frequency, targetMinutes)
      );
    },
    async handleUpdateHabitCategory(habitId: number, category: HabitCategory) {
      await applyTodayMutation(
        habitsClient.updateHabitCategory(habitId, category)
      );
    },
    async handleUpdateHabitFrequency(
      habitId: number,
      frequency: HabitFrequency,
      targetCount: number | null = null
    ) {
      await applyTodayMutation(
        habitsClient.updateHabitFrequency(habitId, frequency, targetCount)
      );
    },
    async handleUpdateHabitTargetCount(habitId: number, targetCount: number) {
      await applyTodayMutation(
        habitsClient.updateHabitTargetCount(habitId, targetCount)
      );
    },
    async handleUpdateHabitWeekdays(
      habitId: number,
      selectedWeekdays: HabitWeekday[] | null
    ) {
      await applyTodayMutation(
        habitsClient.updateHabitWeekdays(habitId, selectedWeekdays)
      );
    },
    refreshForNewDay,
    reloadAll,
    setSystemTheme(systemTheme: "dark" | "light") {
      useUiStore.getState().setSystemTheme(systemTheme);
    },
  };
}
