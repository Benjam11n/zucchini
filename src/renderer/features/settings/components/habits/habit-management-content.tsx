import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  LayoutGroup,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";
import { cn } from "@/renderer/shared/lib/class-names";
import { Button } from "@/renderer/shared/ui/button";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import { HabitRowEditor } from "./habit-row-editor";
import { NewHabitForm } from "./new-habit-form";
import { reorderHabitListByIndex } from "./reorder-habits";

const FEEDBACK_TIMEOUT_MS = 2200;
const UNDO_TIMEOUT_MS = 5000;

type HabitFeedback =
  | {
      kind: "archived";
      habitId: number;
      habitName: string;
    }
  | {
      kind: "saved";
      message: string;
    }
  | null;

type DragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;

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
  const [dragState, setDragState] = useState<DragState>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    },
    []
  );

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

  async function handleRenameHabit(habitId: number, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    await onRenameHabit(habitId, name);
    showSavedFeedback(`Saved "${trimmedName}".`);
  }

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory,
    habitName: string
  ) {
    await onUpdateHabitCategory(habitId, category);
    showSavedFeedback(`Saved changes to "${habitName}".`);
  }

  async function handleUpdateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    habitName: string
  ) {
    await onUpdateHabitFrequency(habitId, frequency);
    showSavedFeedback(`Saved changes to "${habitName}".`);
  }

  async function handleUpdateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    habitName: string
  ) {
    await onUpdateHabitWeekdays(habitId, selectedWeekdays);
    showSavedFeedback(`Saved changes to "${habitName}".`);
  }

  async function handleArchive(habitId: number, habitName: string) {
    await onArchiveHabit(habitId);
    showArchivedFeedback(habitId, habitName);
    if (expandedHabitId === habitId) {
      setExpandedHabitId(null);
    }
  }

  async function handleUndoArchive() {
    if (feedback?.kind !== "archived") {
      return;
    }

    const archivedHabit = feedback;
    clearFeedbackTimer();
    await onUnarchiveHabit(archivedHabit.habitId);
    setFeedback(null);
    showSavedFeedback(`Restored "${archivedHabit.habitName}".`);
  }

  async function handleReorderHabits(
    nextHabits: HabitManagementCardProps["habits"]
  ) {
    await onReorderHabits(nextHabits);
    showSavedFeedback("Saved habit order.");
  }

  async function handleDrop(
    targetHabitId: number,
    position: "after" | "before"
  ) {
    if (!dragState) {
      return;
    }

    const sourceIndex = habits.findIndex(
      (habit) => habit.id === dragState.draggedHabitId
    );
    const targetIndex = habits.findIndex((habit) => habit.id === targetHabitId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDragState(null);
      return;
    }

    let nextIndex = targetIndex;

    if (position === "before") {
      nextIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    } else if (sourceIndex >= targetIndex) {
      nextIndex = targetIndex + 1;
    }

    const nextHabits = reorderHabitListByIndex(habits, sourceIndex, nextIndex);
    setDragState(null);

    if (nextHabits === habits) {
      return;
    }

    await handleReorderHabits(nextHabits);
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-10 pb-3">
        <NewHabitForm onCreateHabit={onCreateHabit} />
        {feedback ? (
          <div
            aria-live="polite"
            className={cn(
              "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs",
              feedback.kind === "archived"
                ? "border-primary/25 bg-primary/10 text-foreground"
                : "border-border/70 bg-muted/30 text-primary"
            )}
            role="status"
          >
            <span>
              {feedback.kind === "archived"
                ? `Archived "${feedback.habitName}".`
                : feedback.message}
            </span>
            {feedback.kind === "archived" ? (
              <Button
                className="h-7 px-2.5 text-[0.7rem]"
                onClick={() => {
                  void handleUndoArchive();
                }}
                type="button"
                variant="secondary"
              >
                Undo
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        <LayoutGroup>
          <AnimatePresence initial={false}>
            {habits.map((habit, index) => (
              <HabitRowEditor
                key={habit.id}
                dragState={dragState}
                habit={habit}
                habits={habits}
                index={index}
                isExpanded={expandedHabitId === habit.id}
                onArchiveHabit={async (habitId) => {
                  await handleArchive(habitId, habit.name);
                }}
                onDragEnd={() => {
                  setDragState(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dragState) {
                    return;
                  }

                  const bounds = event.currentTarget.getBoundingClientRect();
                  const midpoint = bounds.top + bounds.height / 2;
                  setDragState((current) =>
                    current
                      ? {
                          ...current,
                          overHabitId: habit.id,
                          position:
                            event.clientY < midpoint ? "before" : "after",
                        }
                      : current
                  );
                }}
                onDragStart={() => {
                  setDragState({
                    draggedHabitId: habit.id,
                    overHabitId: habit.id,
                    position: "before",
                  });
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const midpoint = bounds.top + bounds.height / 2;
                  const position =
                    event.clientY < midpoint ? "before" : "after";
                  void handleDrop(habit.id, position);
                }}
                onExpandedChange={(open) => {
                  setExpandedHabitId(open ? habit.id : null);
                }}
                onRenameHabit={handleRenameHabit}
                onReorderHabits={handleReorderHabits}
                onUpdateHabitCategory={(habitId, category) =>
                  handleUpdateHabitCategory(habitId, category, habit.name)
                }
                onUpdateHabitFrequency={(habitId, frequency) =>
                  handleUpdateHabitFrequency(habitId, frequency, habit.name)
                }
                onUpdateHabitWeekdays={(habitId, selectedWeekdays) =>
                  handleUpdateHabitWeekdays(
                    habitId,
                    selectedWeekdays,
                    habit.name
                  )
                }
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </LazyMotion>
  );
}
