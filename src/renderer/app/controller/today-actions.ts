import type { AppTab } from "@/renderer/app/app.types";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import {
  applyTodayReloadResult,
  applyTodayState,
  getCurrentYearHistoryLimit,
  refreshWeeklyReviewIfLoaded,
  reorderVisibleTodayHabits,
  updateSettingsDraftFromToday,
} from "./action-helpers";

export type ReloadAllFn = (
  nextTodayState?: TodayState,
  historyScope?: "full" | "recent"
) => Promise<void>;

export function createTodayActions({
  loadFocusSessions,
}: {
  loadFocusSessions: (force?: boolean) => Promise<void>;
}) {
  const reloadAll: ReloadAllFn = async (
    nextTodayState,
    historyScope = useHistoryStore.getState().historyScope
  ) => {
    const todayState = nextTodayState ?? (await window.habits.getTodayState());
    const managedHabits = await window.habits.getHabits();
    const history =
      historyScope === "recent"
        ? await window.habits.getHistory(
            getCurrentYearHistoryLimit(todayState.date)
          )
        : await window.habits.getHistory();

    applyTodayReloadResult({
      history,
      historyScope,
      managedHabits,
      todayState,
    });
  };

  async function refreshToday(mutator: Promise<TodayState>) {
    const nextTodayState = await mutator;
    await reloadAll(nextTodayState, useHistoryStore.getState().historyScope);
    if (useWeeklyReviewStore.getState().weeklyReviewPhase !== "idle") {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    }
  }

  async function refreshForNewDay() {
    await reloadAll(undefined, useHistoryStore.getState().historyScope);
    if (useWeeklyReviewStore.getState().weeklyReviewPhase !== "idle") {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    }
  }

  async function applyTodayMutation(mutator: Promise<TodayState>) {
    const nextTodayState = await mutator;
    const managedHabits = await window.habits.getHabits();
    applyTodayState(nextTodayState, managedHabits);
    refreshWeeklyReviewIfLoaded();
    return nextTodayState;
  }

  return {
    applyTodayMutation,
    async handleArchiveHabit(habitId: number) {
      await applyTodayMutation(window.habits.archiveHabit(habitId));
    },
    async handleCreateHabit(
      name: string,
      category: HabitCategory,
      frequency: HabitFrequency,
      selectedWeekdays: HabitWeekday[] | null = null
    ) {
      await applyTodayMutation(
        window.habits.createHabit(name, category, frequency, selectedWeekdays)
      );
      updateSettingsDraftFromToday();
    },
    async handleRenameHabit(habitId: number, name: string) {
      await applyTodayMutation(window.habits.renameHabit(habitId, name));
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
          window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
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
        updateSettingsDraftFromToday();
      }

      if (nextTab === "focus") {
        loadFocusSessions().catch(() => {
          // Focus-session load failures are surfaced through store state.
        });
      }
    },
    async handleToggleHabit(habitId: number) {
      const previousTodayState = useTodayStore.getState().todayState;
      const hasHabitToToggle = previousTodayState?.habits.some(
        (habit) => habit.id === habitId
      );

      if (previousTodayState && hasHabitToToggle) {
        useTodayStore.setState({
          todayState: {
            ...previousTodayState,
            habits: previousTodayState.habits.map((habit) =>
              habit.id === habitId
                ? { ...habit, completed: !habit.completed }
                : habit
            ),
          },
        });
      }

      try {
        await refreshToday(window.habits.toggleHabit(habitId));
      } catch (error) {
        if (previousTodayState && hasHabitToToggle) {
          useTodayStore.setState({
            todayState: previousTodayState,
          });
        }

        throw error;
      }
    },
    async handleUnarchiveHabit(habitId: number) {
      await applyTodayMutation(window.habits.unarchiveHabit(habitId));
    },
    async handleUpdateHabitCategory(habitId: number, category: HabitCategory) {
      await applyTodayMutation(
        window.habits.updateHabitCategory(habitId, category)
      );
    },
    async handleUpdateHabitFrequency(
      habitId: number,
      frequency: HabitFrequency
    ) {
      await applyTodayMutation(
        window.habits.updateHabitFrequency(habitId, frequency)
      );
    },
    async handleUpdateHabitWeekdays(
      habitId: number,
      selectedWeekdays: HabitWeekday[] | null
    ) {
      await applyTodayMutation(
        window.habits.updateHabitWeekdays(habitId, selectedWeekdays)
      );
    },
    refreshForNewDay,
    reloadAll,
    setSystemTheme(systemTheme: "dark" | "light") {
      useUiStore.getState().setSystemTheme(systemTheme);
    },
  };
}
