import { useCallback, useState } from "react";

import { useTimedUndo } from "@/renderer/shared/hooks/use-timed-undo";
import type { Habit } from "@/shared/domain/habit";

import type { HabitFeedback } from "../habit-management-content/habit-management-content.types";

const FEEDBACK_TIMEOUT_MS = 5000;

export function useHabitManagementFeedback() {
  const [feedback, setFeedback] = useState<HabitFeedback>(null);
  const autoSortUndo = useTimedUndo<Habit[]>({
    timeoutMs: FEEDBACK_TIMEOUT_MS,
  });

  const clearFeedback = useCallback(() => {
    autoSortUndo.clear();
    setFeedback(null);
  }, [autoSortUndo]);

  const showErrorFeedback = useCallback(
    (message: string) => {
      autoSortUndo.clear();
      setFeedback({
        kind: "error",
        message,
      });
    },
    [autoSortUndo]
  );

  const showAutoSortFeedback = useCallback(
    (previousHabits: Habit[]) => {
      autoSortUndo.show(previousHabits);
      setFeedback({
        kind: "auto-sorted",
        message: "Grouped habits by category order.",
      });
    },
    [autoSortUndo]
  );

  const consumeAutoSortUndoHabits = useCallback(() => {
    if (feedback?.kind !== "auto-sorted") {
      return null;
    }

    return autoSortUndo.consume();
  }, [autoSortUndo, feedback]);

  return {
    clearFeedback,
    consumeAutoSortUndoHabits,
    feedback,
    showAutoSortFeedback,
    showErrorFeedback,
  };
}
