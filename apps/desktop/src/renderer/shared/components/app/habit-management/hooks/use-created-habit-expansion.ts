import { useCallback, useEffect, useRef } from "react";

import type { Habit } from "@/shared/domain/habit";

interface UseCreatedHabitExpansionInput {
  habits: Habit[];
  setExpandedHabitId: (habitId: number | null) => void;
}

export function useCreatedHabitExpansion({
  habits,
  setExpandedHabitId,
}: UseCreatedHabitExpansionInput) {
  const pendingCreatedHabitNameRef = useRef<string | null>(null);

  useEffect(() => {
    const pendingCreatedHabitName = pendingCreatedHabitNameRef.current;
    if (!pendingCreatedHabitName) {
      return;
    }

    const createdHabit = habits.find(
      (habit) => habit.name === pendingCreatedHabitName
    );
    if (!createdHabit) {
      return;
    }

    pendingCreatedHabitNameRef.current = null;
    setExpandedHabitId(createdHabit.id);
  }, [habits, setExpandedHabitId]);

  const setPendingCreatedHabitName = useCallback((name: string) => {
    pendingCreatedHabitNameRef.current = name;
  }, []);

  return {
    setPendingCreatedHabitName,
  };
}
