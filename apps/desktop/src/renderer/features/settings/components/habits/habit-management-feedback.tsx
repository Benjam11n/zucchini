import { cn } from "@/renderer/shared/lib/class-names";
import { Button } from "@/renderer/shared/ui/button";

import type { HabitFeedback } from "./habit-management-content.types";

interface HabitManagementFeedbackProps {
  feedback: HabitFeedback;
  onUndoArchive: () => void;
}

export function HabitManagementFeedback({
  feedback,
  onUndoArchive,
}: HabitManagementFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
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
          onClick={onUndoArchive}
          type="button"
          variant="secondary"
        >
          Undo
        </Button>
      ) : null}
    </div>
  );
}
