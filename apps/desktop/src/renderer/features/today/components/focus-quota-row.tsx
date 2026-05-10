import { Timer } from "lucide-react";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  HABIT_ROW_BASE_CLASSNAME,
  HABIT_ROW_CONTENT_INTERACTION_CLASSNAME,
  HABIT_ROW_INTERACTIVE_CLASSNAME,
} from "@/renderer/shared/lib/habit-row-interaction";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";

export function FocusQuotaRow({ goal }: { goal: FocusQuotaGoalWithStatus }) {
  const percentage = Math.min(
    Math.round((goal.completedMinutes / goal.targetMinutes) * 100),
    100
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-2.5 py-1.5 text-sm",
        HABIT_ROW_BASE_CLASSNAME,
        !goal.completed && HABIT_ROW_INTERACTIVE_CLASSNAME
      )}
    >
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
        <Timer
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            goal.completed
              ? "text-primary"
              : [
                  "text-muted-foreground/60",
                  HABIT_ROW_CONTENT_INTERACTION_CLASSNAME,
                ]
          )}
        />
        <div
          className={cn(
            "truncate font-medium transition-all",
            goal.completed
              ? "text-muted-foreground/65"
              : ["text-primary", HABIT_ROW_CONTENT_INTERACTION_CLASSNAME]
          )}
        >
          Focus quota
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 tabular-nums">
        <div className="relative hidden h-1 w-12 overflow-hidden rounded-full bg-muted/40 transition-colors group-hover:bg-muted/60 md:block">
          <div
            className="habit-progress-fill absolute inset-y-0 left-0 bg-primary transition-all duration-500"
            key={goal.completedMinutes}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium transition-colors",
            goal.completed
              ? "habit-completion-pop bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {goal.completedMinutes} / {goal.targetMinutes} m
        </span>
      </div>
    </div>
  );
}
