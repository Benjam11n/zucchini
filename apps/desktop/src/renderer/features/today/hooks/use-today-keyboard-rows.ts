import { useCallback, useMemo } from "react";

import type { TodayKeyboardRow } from "@/renderer/features/today/hooks/use-today-keyboard-flow";
import { useTodayKeyboardFlow } from "@/renderer/features/today/hooks/use-today-keyboard-flow";
import {
  getCarryoverKeyboardRowId,
  getDailyHabitKeyboardRowId,
  getPeriodicHabitKeyboardRowId,
} from "@/renderer/features/today/lib/today-keyboard-row-ids";
import type { TodayState } from "@/shared/contracts/today-state";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface UseTodayKeyboardRowsOptions {
  dailyHabits: HabitWithStatus[];
  onDecrementHabitProgress: (habitId: number) => void;
  onIncrementHabitProgress: (habitId: number) => void;
  onToggleHabit: (habitId: number) => void;
  onToggleHabitCarryover: (sourceDate: string, habitId: number) => void;
  periodicHabits: HabitWithStatus[];
  state: TodayState;
}

export function useTodayKeyboardRows({
  dailyHabits,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
  onToggleHabit,
  onToggleHabitCarryover,
  periodicHabits,
  state,
}: UseTodayKeyboardRowsOptions) {
  const orderedDailyHabits = useMemo(
    () =>
      HABIT_CATEGORY_SLOTS.flatMap((category) =>
        dailyHabits.filter((habit) => habit.category === category.value)
      ),
    [dailyHabits]
  );
  const orderedPeriodicHabits = useMemo(
    () =>
      ["weekly", "monthly"].flatMap((frequency) =>
        periodicHabits.filter((habit) => habit.frequency === frequency)
      ),
    [periodicHabits]
  );
  const keyboardRows = useMemo<TodayKeyboardRow[]>(
    () => [
      ...orderedDailyHabits.map((habit) => ({
        disabled: state.dayStatus !== null,
        id: getDailyHabitKeyboardRowId(habit.id),
        incomplete: !habit.completed,
        kind: "daily" as const,
        onToggle: () => onToggleHabit(habit.id),
      })),
      ...(state.habitCarryovers ?? []).map((carryover) => ({
        id: getCarryoverKeyboardRowId(carryover.sourceDate, carryover.id),
        incomplete: !carryover.completed,
        kind: "carryover" as const,
        onToggle: () =>
          onToggleHabitCarryover(carryover.sourceDate, carryover.id),
      })),
      ...orderedPeriodicHabits.map((habit) => ({
        completesOnIncrement:
          !habit.completed &&
          (habit.completedCount ?? 0) + 1 >= (habit.targetCount ?? 1),
        id: getPeriodicHabitKeyboardRowId(habit.id),
        incomplete: !habit.completed,
        kind: "periodic" as const,
        onDecrement:
          (habit.completedCount ?? 0) > 0
            ? () => onDecrementHabitProgress(habit.id)
            : undefined,
        onIncrement: () => {
          onIncrementHabitProgress(habit.id);
        },
      })),
    ],
    [
      onDecrementHabitProgress,
      onIncrementHabitProgress,
      onToggleHabit,
      onToggleHabitCarryover,
      orderedDailyHabits,
      orderedPeriodicHabits,
      state.dayStatus,
      state.habitCarryovers,
    ]
  );
  const { getRowProps, markRowCompleted } = useTodayKeyboardFlow(keyboardRows);
  const handleToggleDailyHabit = useCallback(
    (habitId: number) => {
      const habit = orderedDailyHabits.find(
        (candidateHabit) => candidateHabit.id === habitId
      );
      if (habit && !habit.completed && state.dayStatus === null) {
        markRowCompleted(getDailyHabitKeyboardRowId(habit.id));
      }

      onToggleHabit(habitId);
    },
    [markRowCompleted, onToggleHabit, orderedDailyHabits, state.dayStatus]
  );
  const handleToggleCarryover = useCallback(
    (sourceDate: string, habitId: number) => {
      const carryover = (state.habitCarryovers ?? []).find(
        (candidateCarryover) =>
          candidateCarryover.id === habitId &&
          candidateCarryover.sourceDate === sourceDate
      );
      if (carryover && !carryover.completed) {
        markRowCompleted(
          getCarryoverKeyboardRowId(carryover.sourceDate, carryover.id)
        );
      }

      onToggleHabitCarryover(sourceDate, habitId);
    },
    [markRowCompleted, onToggleHabitCarryover, state.habitCarryovers]
  );
  const handleIncrementPeriodicHabit = useCallback(
    (habitId: number) => {
      const habit = orderedPeriodicHabits.find(
        (candidateHabit) => candidateHabit.id === habitId
      );
      const habitCompletedCount = habit?.completedCount ?? 0;
      const targetCount = habit?.targetCount ?? 1;
      if (habit && !habit.completed && habitCompletedCount + 1 >= targetCount) {
        markRowCompleted(getPeriodicHabitKeyboardRowId(habit.id));
      }

      onIncrementHabitProgress(habitId);
    },
    [markRowCompleted, onIncrementHabitProgress, orderedPeriodicHabits]
  );

  return {
    getRowProps,
    handleIncrementPeriodicHabit,
    handleToggleCarryover,
    handleToggleDailyHabit,
  };
}
