import { domAnimation, LazyMotion } from "framer-motion";
import { ArrowDownAZ } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  reorderHabitListByDropPosition,
  sortHabitListByCategory,
} from "@/renderer/features/settings/lib/reorder-habits";
import { Button } from "@/renderer/shared/components/ui/button";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type {
  HabitDragState,
  HabitFeedback,
  RecentArchivedHabit,
} from "./habit-management-content.types";
import { HabitManagementFeedback } from "./habit-management-feedback";
import { HabitManagementList } from "./habit-management-list";
import type { HabitManagementCardProps } from "./habit-management.types";
import { NewHabitForm } from "./new-habit-form";

const FEEDBACK_TIMEOUT_MS = 2200;
const UNDO_TIMEOUT_MS = 5000;

function clearTimeoutRef(timeoutRef: { current: number | null }) {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

export function HabitManagementContent({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUnarchiveHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<HabitFeedback>(null);
  const [dragState, setDragState] = useState<HabitDragState>(null);
  const [recentArchivedHabit, setRecentArchivedHabit] =
    useState<RecentArchivedHabit | null>(null);
  const [pendingCreatedHabitName, setPendingCreatedHabitName] = useState<
    string | null
  >(null);
  const [autoSortUndoHabits, setAutoSortUndoHabits] = useState<Habit[] | null>(
    null
  );
  const feedbackTimeoutRef = useRef<number | null>(null);
  const archivedHabitTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }

      if (archivedHabitTimeoutRef.current !== null) {
        window.clearTimeout(archivedHabitTimeoutRef.current);
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

  function setFeedbackWithTimeout(
    nextFeedback: HabitFeedback,
    timeoutMs?: number
  ) {
    clearTimeoutRef(feedbackTimeoutRef);
    setAutoSortUndoHabits(null);
    setFeedback(nextFeedback);

    if (!nextFeedback || timeoutMs === undefined) {
      return;
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) =>
        current?.kind === nextFeedback.kind ? null : current
      );
      feedbackTimeoutRef.current = null;
    }, timeoutMs);
  }

  function showSavedFeedback(message: string) {
    setFeedbackWithTimeout(
      {
        kind: "saved",
        message,
      },
      FEEDBACK_TIMEOUT_MS
    );
  }

  function showErrorFeedback(message: string) {
    setFeedbackWithTimeout({
      kind: "error",
      message,
    });
  }

  function setArchivedHabitWithTimeout(
    nextArchivedHabit: RecentArchivedHabit | null
  ) {
    clearTimeoutRef(archivedHabitTimeoutRef);
    setRecentArchivedHabit(nextArchivedHabit);

    if (!nextArchivedHabit) {
      return;
    }

    archivedHabitTimeoutRef.current = window.setTimeout(() => {
      setRecentArchivedHabit((current) =>
        current?.habitId === nextArchivedHabit.habitId ? null : current
      );
      archivedHabitTimeoutRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  function showAutoSortFeedback(previousHabits: Habit[]) {
    clearTimeoutRef(feedbackTimeoutRef);
    setAutoSortUndoHabits(previousHabits);
    setFeedback({
      kind: "auto-sorted",
      message: "Grouped habits by category order.",
    });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) =>
        current?.kind === "auto-sorted" ? null : current
      );
      setAutoSortUndoHabits(null);
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

  async function saveHabitChanges(
    habitName: string,
    task: () => Promise<void>
  ) {
    await runHabitAction({
      onSuccess: () => {
        showSavedFeedback(`Saved changes to "${habitName}".`);
      },
      task,
    });
  }

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory,
    habitName: string
  ) {
    await saveHabitChanges(habitName, () =>
      onUpdateHabitCategory(habitId, category)
    );
  }

  async function handleUpdateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null | undefined,
    habitName: string
  ) {
    await saveHabitChanges(habitName, () =>
      onUpdateHabitFrequency(habitId, frequency, targetCount)
    );
  }

  async function handleUpdateHabitTargetCount(
    habitId: number,
    targetCount: number,
    habitName: string
  ) {
    await saveHabitChanges(
      habitName,
      () =>
        onUpdateHabitTargetCount?.(habitId, targetCount) ?? Promise.resolve()
    );
  }

  async function handleUpdateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    habitName: string
  ) {
    await saveHabitChanges(habitName, () =>
      onUpdateHabitWeekdays(habitId, selectedWeekdays)
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
        setArchivedHabitWithTimeout({
          frequency,
          habitId,
          habitName,
          index,
        });
        if (expandedHabitId === habitId) {
          setExpandedHabitId(null);
        }
      },
      task: () => onArchiveHabit(habitId),
    });
  }

  async function handleUndoArchive() {
    if (!recentArchivedHabit) {
      return;
    }

    const archivedHabit = recentArchivedHabit;
    clearTimeoutRef(archivedHabitTimeoutRef);
    await runHabitAction({
      onSuccess: () => {
        setArchivedHabitWithTimeout(null);
      },
      task: () => onUnarchiveHabit(archivedHabit.habitId),
    });
  }

  async function handleUndoAutoSort() {
    if (feedback?.kind !== "auto-sorted" || !autoSortUndoHabits) {
      return;
    }

    const previousHabits = autoSortUndoHabits;
    clearTimeoutRef(feedbackTimeoutRef);
    await runHabitAction({
      onSuccess: () => {
        setAutoSortUndoHabits(null);
        setFeedback(null);
        showSavedFeedback("Restored the previous habit order.");
      },
      task: () => onReorderHabits(previousHabits),
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

  async function handleAutoSort() {
    const nextHabits = sortHabitListByCategory(habits);

    if (nextHabits === habits) {
      showSavedFeedback("Habits are already grouped by category.");
      return;
    }

    await runHabitAction({
      onSuccess: () => {
        showAutoSortFeedback(habits);
      },
      task: () => onReorderHabits(nextHabits),
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
        onCreateHabit(name, category, frequency, selectedWeekdays, targetCount),
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
      </div>

      <div className="grid gap-3 pb-3">
        <div className="mt-3 flex justify-end">
          <Button onClick={handleAutoSort} type="button" variant="outline">
            <ArrowDownAZ className="size-4" />
            Auto sort
          </Button>
        </div>
        <HabitManagementFeedback
          feedback={feedback}
          onUndoAutoSort={handleUndoAutoSort}
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
        onUndoArchive={handleUndoArchive}
        onUpdateHabitCategory={handleUpdateHabitCategory}
        onUpdateHabitFrequency={handleUpdateHabitFrequency}
        onUpdateHabitTargetCount={handleUpdateHabitTargetCount}
        onUpdateHabitWeekdays={handleUpdateHabitWeekdays}
        recentArchivedHabit={recentArchivedHabit}
      />
    </LazyMotion>
  );
}
