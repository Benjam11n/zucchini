import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";

import type { HabitFeedback } from "./habit-management-content.types";

interface HabitManagementFeedbackProps {
  feedback: HabitFeedback;
  onUndoAutoSort: () => void;
}

export function HabitManagementFeedback({
  feedback,
  onUndoAutoSort,
}: HabitManagementFeedbackProps) {
  if (!feedback) {
    return null;
  }

  let feedbackClassName = "border-border/70 bg-muted/30 text-primary";

  if (feedback.kind === "auto-sorted") {
    feedbackClassName = "border-primary/25 bg-primary/10 text-foreground";
  } else if (feedback.kind === "error") {
    feedbackClassName =
      "border-destructive/30 bg-destructive/8 text-destructive";
  }

  let undoAction: (() => void) | null = null;

  if (feedback.kind === "auto-sorted") {
    undoAction = onUndoAutoSort;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs",
        feedbackClassName
      )}
      role="status"
    >
      <span>{feedback.message}</span>
      {undoAction ? (
        <Button
          className="h-7 px-2.5 text-[0.7rem]"
          onClick={undoAction}
          type="button"
          variant="secondary"
        >
          Undo
        </Button>
      ) : null}
    </div>
  );
}
