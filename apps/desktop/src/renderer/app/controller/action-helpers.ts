/**
 * Shared action utility functions.
 *
 * Provides helpers for batched store updates (optimistic rollbacks, reload
 * results, boot failure resets) and small computations like history limits
 * and today-state reordering. All multi-store writes use
 * `unstable_batchedUpdates` to avoid intermediate renders.
 */
import { unstable_batchedUpdates } from "react-dom";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { syncHistoryCollections } from "@/renderer/features/history/state/history-collections";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

export function reorderVisibleTodayHabits(
  nextManagedHabits: Habit[],
  currentTodayState: TodayState | null
): TodayState | null {
  if (!currentTodayState) {
    return currentTodayState;
  }

  const todayHabitById = new Map(
    currentTodayState.habits.map((habit) => [habit.id, habit])
  );

  const reorderedHabits = nextManagedHabits.flatMap((habit) => {
    const currentHabit = todayHabitById.get(habit.id);
    return currentHabit
      ? [
          {
            ...currentHabit,
            sortOrder: habit.sortOrder,
          },
        ]
      : [];
  });

  return {
    ...currentTodayState,
    habits: reorderedHabits,
  };
}

export function applyTodayReloadResult({
  history,
  historyScope,
  managedHabits,
  todayState,
}: {
  history: HistoryDay[];
  historyScope: "full" | "recent";
  managedHabits: Habit[];
  todayState: TodayState;
}): void {
  unstable_batchedUpdates(() => {
    useHistoryStore.setState({
      history,
      historyLoadError: null,
      historyScope,
      isHistoryLoading: false,
    });
    syncHistoryCollections(history);
    useSettingsStore.setState((state) => ({
      settingsDraft: state.settingsDraft ?? todayState.settings,
    }));
    useTodayStore.setState({
      managedHabits,
      todayState,
    });
  });
}

export function applyTodayState(
  nextTodayState: TodayState,
  nextManagedHabits?: Habit[]
): void {
  unstable_batchedUpdates(() => {
    useSettingsStore.setState((state) => ({
      settingsDraft: state.settingsDraft ?? nextTodayState.settings,
    }));
    useTodayStore.setState({
      managedHabits:
        nextManagedHabits ?? useTodayStore.getState().managedHabits,
      todayState: nextTodayState,
    });
  });
}

export function applyHabitStatusPatch(patch: HabitStatusPatch): void {
  const { todayState } = useTodayStore.getState();
  if (!todayState) {
    return;
  }

  useTodayStore.setState({
    todayState: {
      ...todayState,
      habits: todayState.habits.map((habit) =>
        habit.id === patch.habit.id ? patch.habit : habit
      ),
    },
  });
}

export function applyOptimisticHabitStreakPatch({
  nextCompleted,
  previousCompleted,
  habitId,
}: {
  habitId: number;
  nextCompleted: boolean;
  previousCompleted: boolean;
}): void {
  if (nextCompleted === previousCompleted) {
    return;
  }

  const { todayState } = useTodayStore.getState();
  if (!todayState) {
    return;
  }

  const currentStreak = todayState.habitStreaks?.[habitId] ?? {
    bestStreak: 0,
    currentStreak: 0,
  };
  const nextCurrentStreak = nextCompleted
    ? currentStreak.currentStreak + 1
    : Math.max(0, currentStreak.currentStreak - 1);

  useTodayStore.setState({
    todayState: {
      ...todayState,
      habitStreaks: {
        ...todayState.habitStreaks,
        [habitId]: {
          bestStreak: Math.max(currentStreak.bestStreak, nextCurrentStreak),
          currentStreak: nextCurrentStreak,
        },
      },
    },
  });
}

export function refreshWeeklyReviewIfLoaded(): void {
  if (useWeeklyReviewStore.getState().weeklyReviewPhase === "idle") {
    return;
  }

  void useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
}

export function applyBootFailureState(bootError: HabitsIpcError): void {
  unstable_batchedUpdates(() => {
    useBootStore.setState({
      bootError,
      bootPhase: "error",
    });
    useHistoryStore.setState({
      history: [],
      historyLoadError: null,
      historyScope: "recent",
      isHistoryLoading: false,
    });
    syncHistoryCollections(null);
    useSettingsStore.setState({
      settingsDraft: null,
    });
    useTodayStore.setState({
      managedHabits: [],
      todayState: null,
    });
    useUiStore.setState({
      tab: "today",
    });
    useWeeklyReviewStore.setState({
      isWeeklyReviewSpotlightOpen: false,
      selectedWeeklyReview: null,
      weeklyReviewError: null,
      weeklyReviewOverview: null,
      weeklyReviewPhase: "idle",
    });
    useFocusStore.setState({
      focusSaveErrorMessage: null,
    });
  });
}
