import { useState } from "react";

import { reorderHabitListByDropPosition } from "@/renderer/shared/lib/reorder-habits";
import type { Habit } from "@/shared/domain/habit";

import type { HabitDragState } from "../habit-management-content/habit-management-content.types";

interface UseHabitDragReorderInput {
  habits: Habit[];
  onReorderHabits: (nextHabits: Habit[]) => Promise<void>;
}

export function useHabitDragReorder({
  habits,
  onReorderHabits,
}: UseHabitDragReorderInput) {
  const [dragState, setDragState] = useState<HabitDragState>(null);

  async function handleDrop(
    draggedHabitId: number | null,
    targetHabitId: number,
    position: "after" | "before"
  ) {
    const resolvedDraggedHabitId = draggedHabitId ?? dragState?.draggedHabitId;

    if (!resolvedDraggedHabitId) {
      return;
    }

    const nextHabits = reorderHabitListByDropPosition(
      habits,
      resolvedDraggedHabitId,
      targetHabitId,
      position
    );
    setDragState(null);

    if (nextHabits === habits) {
      return;
    }

    await onReorderHabits(nextHabits);
  }

  return {
    dragState,
    handleDrop,
    setDragState,
  };
}
