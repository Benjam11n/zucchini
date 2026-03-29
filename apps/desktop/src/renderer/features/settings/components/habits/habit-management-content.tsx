import { domAnimation, LazyMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type {
  HabitDragState,
  HabitFeedback,
} from "./habit-management-content.types";
import { HabitManagementFeedback } from "./habit-management-feedback";
import { HabitManagementList } from "./habit-management-list";
import type { HabitManagementCardProps } from "./habit-management.types";
import { NewHabitForm } from "./new-habit-form";
import { reorderHabitListByDropPosition } from "./reorder-habits";

const FEEDBACK_TIMEOUT_MS = 2200;
const UNDO_TIMEOUT_MS = 5000;

export function HabitManagementContent({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUnarchiveHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<HabitFeedback>(null);
  const [dragState, setDragState] = useState<HabitDragState>(null);
  const [pendingCreatedHabitName, setPendingCreatedHabitName] = useState<
    string | null
  >(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    },
    []
  );

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
  }, [habits, pendingCreatedHabitName]);

  function clearFeedbackTimer() {
    if (feedbackTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = null;
  }

  function showSavedFeedback(message: string) {
    clearFeedbackTimer();
    setFeedback({
      kind: "saved",
      message,
    });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) => (current?.kind === "saved" ? null : current));
      feedbackTimeoutRef.current = null;
    }, FEEDBACK_TIMEOUT_MS);
  }

  function showErrorFeedback(message: string) {
    clearFeedbackTimer();
    setFeedback({
      kind: "error",
      message,
    });
  }

  function showArchivedFeedback(habitId: number, habitName: string) {
    clearFeedbackTimer();
    setFeedback({
      habitId,
      habitName,
      kind: "archived",
    });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) =>
        current?.kind === "archived" && current.habitId === habitId
          ? null
          : current
      );
      feedbackTimeoutRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  async function runHabitAction({
    onSuccess,
    task,
  }: {
    onSuccess?: () => void | Promise<void>;
    task: () => Promise<void>;
  }) {
    await runAsyncTask(task, {
      mapError: toHabitsIpcError,
      onError: (error) => {
        showErrorFeedback(error.message);
      },
      ...(onSuccess ? { onSuccess } : {}),
    });
  }

  async function handleRenameHabit(habitId: number, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback(`Saved "${trimmedName}".`);
      },
      task: () => onRenameHabit(habitId, name),
    });
  }

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory,
    habitName: string
  ) {
    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback(`Saved changes to "${habitName}".`);
      },
      task: () => onUpdateHabitCategory(habitId, category),
    });
  }

  async function handleUpdateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    habitName: string
  ) {
    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback(`Saved changes to "${habitName}".`);
      },
      task: () => onUpdateHabitFrequency(habitId, frequency),
    });
  }

  async function handleUpdateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    habitName: string
  ) {
    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback(`Saved changes to "${habitName}".`);
      },
      task: () => onUpdateHabitWeekdays(habitId, selectedWeekdays),
    });
  }

  async function handleArchive(habitId: number, habitName: string) {
    await runHabitAction({
      onSuccess: () => {
        showArchivedFeedback(habitId, habitName);
        if (expandedHabitId === habitId) {
          setExpandedHabitId(null);
        }
      },
      task: () => onArchiveHabit(habitId),
    });
  }

  async function handleUndoArchive() {
    if (feedback?.kind !== "archived") {
      return;
    }

    const archivedHabit = feedback;
    clearFeedbackTimer();
    await runHabitAction({
      onSuccess: () => {
        setFeedback(null);
        showSavedFeedback(`Restored "${archivedHabit.habitName}".`);
      },
      task: () => onUnarchiveHabit(archivedHabit.habitId),
    });
  }

  async function handleReorderHabits(
    nextHabits: HabitManagementCardProps["habits"]
  ) {
    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback("Saved habit order.");
      },
      task: () => onReorderHabits(nextHabits),
    });
  }

  async function handleCreateHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ) {
    const trimmedName = name.trim();
    await runHabitAction({
      onSuccess: () => {
        if (trimmedName) {
          setPendingCreatedHabitName(trimmedName);
        }
      },
      task: () => onCreateHabit(name, category, frequency, selectedWeekdays),
    });
  }

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

    await handleReorderHabits(nextHabits);
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-10 pb-3">
        <NewHabitForm onCreateHabit={handleCreateHabit} />
        <HabitManagementFeedback
          feedback={feedback}
          onUndoArchive={handleUndoArchive}
        />
      </div>

      <HabitManagementList
        dragState={dragState}
        expandedHabitId={expandedHabitId}
        habits={habits}
        onArchiveHabit={handleArchive}
        onDragStateChange={setDragState}
        onDrop={handleDrop}
        onExpandedHabitChange={setExpandedHabitId}
        onRenameHabit={handleRenameHabit}
        onReorderHabits={handleReorderHabits}
        onUpdateHabitCategory={handleUpdateHabitCategory}
        onUpdateHabitFrequency={handleUpdateHabitFrequency}
        onUpdateHabitWeekdays={handleUpdateHabitWeekdays}
      />
    </LazyMotion>
  );
}
