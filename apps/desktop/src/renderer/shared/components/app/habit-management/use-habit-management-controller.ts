import { useState } from "react";

import { sortHabitListByCategory } from "@/renderer/shared/lib/reorder-habits";
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type { HabitManagementContentProps } from "./habit-management-content/habit-management-content";
import { useCreatedHabitExpansion } from "./hooks/use-created-habit-expansion";
import { useHabitActionRunner } from "./hooks/use-habit-action-runner";
import { useHabitArchiveUndo } from "./hooks/use-habit-archive-undo";
import { useHabitDragReorder } from "./hooks/use-habit-drag-reorder";
import { useHabitManagementFeedback } from "./hooks/use-habit-management-feedback";

const noopPauseAction: NonNullable<HabitManagementActions["pauseHabit"]> = () =>
  Promise.resolve();
const noopResumeAction: NonNullable<
  HabitManagementActions["resumeHabit"]
> = () => Promise.resolve();

export function useHabitManagementController({
  actions,
  habits,
}: HabitManagementContentProps) {
  const {
    archiveHabit,
    createHabit,
    pauseHabit = noopPauseAction,
    renameHabit,
    reorderHabits,
    resumeHabit = noopResumeAction,
    unarchiveHabit,
    updateHabitCategory,
    updateHabitFrequency,
    updateHabitTargetCount,
    updateHabitWeekdays,
  } = actions;
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);
  const {
    clearFeedback,
    consumeAutoSortUndoHabits,
    feedback,
    showAutoSortFeedback,
    showErrorFeedback,
  } = useHabitManagementFeedback();
  const archiveUndo = useHabitArchiveUndo();
  const { setPendingCreatedHabitName } = useCreatedHabitExpansion({
    habits,
    setExpandedHabitId,
  });
  const runHabitAction = useHabitActionRunner({
    onError: showErrorFeedback,
  });

  async function handleRenameHabit(habitId: number, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    await runHabitAction({
      task: () => renameHabit(habitId, name),
    });
  }

  async function saveHabitChanges(task: () => Promise<void>) {
    await runHabitAction({
      task,
    });
  }

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory,
    _habitName: string
  ) {
    await saveHabitChanges(() => updateHabitCategory(habitId, category));
  }

  async function handleUpdateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null | undefined,
    _habitName: string
  ) {
    await saveHabitChanges(() =>
      updateHabitFrequency(habitId, frequency, targetCount)
    );
  }

  async function handleUpdateHabitTargetCount(
    habitId: number,
    targetCount: number,
    _habitName: string
  ) {
    await saveHabitChanges(() => updateHabitTargetCount(habitId, targetCount));
  }

  async function handleUpdateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    _habitName: string
  ) {
    await saveHabitChanges(() =>
      updateHabitWeekdays(habitId, selectedWeekdays)
    );
  }

  async function handleArchive(
    habitId: number,
    habitName: string,
    frequency: HabitFrequency,
    index: number
  ) {
    await runHabitAction({
      onSuccess: () => {
        archiveUndo.show({
          frequency,
          habitId,
          habitName,
          index,
        });
        if (expandedHabitId === habitId) {
          setExpandedHabitId(null);
        }
      },
      task: () => archiveHabit(habitId),
    });
  }

  async function handlePauseHabit(habitId: number, _habitName: string) {
    await runHabitAction({
      task: () => pauseHabit(habitId),
    });
  }

  async function handleResumeHabit(habitId: number, _habitName: string) {
    await runHabitAction({
      task: () => resumeHabit(habitId),
    });
  }

  async function handleUndoArchive() {
    const archivedHabit = archiveUndo.consume();
    if (!archivedHabit) {
      return;
    }

    await runHabitAction({
      onSuccess: () => {
        archiveUndo.clear();
      },
      task: () => unarchiveHabit(archivedHabit.habitId),
    });
  }

  async function handleUndoAutoSort() {
    const previousHabits = consumeAutoSortUndoHabits();
    if (!previousHabits) {
      return;
    }

    await runHabitAction({
      onSuccess: clearFeedback,
      task: () => reorderHabits(previousHabits),
    });
  }

  async function handleReorderHabits(nextHabits: Habit[]) {
    await runHabitAction({
      task: () => reorderHabits(nextHabits),
    });
  }

  const { dragState, handleDrop, setDragState } = useHabitDragReorder({
    habits,
    onReorderHabits: handleReorderHabits,
  });

  async function handleAutoSort() {
    const nextHabits = sortHabitListByCategory(habits);

    if (nextHabits === habits) {
      return;
    }

    await runHabitAction({
      onSuccess: () => {
        showAutoSortFeedback(habits);
      },
      task: () => reorderHabits(nextHabits),
    });
  }

  async function handleCreateHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) {
    const trimmedName = name.trim();
    await runHabitAction({
      onSuccess: () => {
        if (trimmedName) {
          setPendingCreatedHabitName(trimmedName);
        }
      },
      task: () =>
        createHabit(name, category, frequency, selectedWeekdays, targetCount),
    });
  }

  return {
    dragState,
    expandedHabitId,
    feedback,
    handleArchive,
    handleAutoSort,
    handleCreateHabit,
    handleDrop,
    handlePauseHabit,
    handleRenameHabit,
    handleReorderHabits,
    handleResumeHabit,
    handleUndoArchive,
    handleUndoAutoSort,
    handleUpdateHabitCategory,
    handleUpdateHabitFrequency,
    handleUpdateHabitTargetCount,
    handleUpdateHabitWeekdays,
    recentArchivedHabit: archiveUndo.value,
    setDragState,
    setExpandedHabitId,
  };
}
