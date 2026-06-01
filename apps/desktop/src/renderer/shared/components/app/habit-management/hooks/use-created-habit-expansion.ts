import { useEffect, useState } from "react";

import type { Habit } from "@/shared/domain/habit";

interface UseCreatedHabitExpansionInput {
  habits: Habit[];
  setExpandedHabitId: (habitId: number | null) => void;
}

export function useCreatedHabitExpansion({
  habits,
  setExpandedHabitId,
}: UseCreatedHabitExpansionInput) {
  const [pendingCreatedHabitName, setPendingCreatedHabitName] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!pendingCreatedHabitName) {
      return;
    }

    const createdHabit = habits.find(
      (habit) => habit.name === pendingCreatedHabitName
    );
    if (!createdHabit) {
      return;
    }

    setExpandedHabitId(createdHabit.id);
    setPendingCreatedHabitName(null);
  }, [habits, pendingCreatedHabitName, setExpandedHabitId]);

  return {
    setPendingCreatedHabitName,
  };
}
