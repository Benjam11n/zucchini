import { Timer } from "lucide-react";
import type { ReactNode } from "react";

import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";

function formatQuotaLabel(
  completed: number,
  target: number,
  suffix: ReactNode
): ReactNode {
  return (
    <>
      <span className="font-medium text-foreground">{completed}</span>
      <span>/</span>
      <span>{target}</span>
      <span>{suffix}</span>
    </>
  );
}

export function FocusQuotaRow({ goal }: { goal: FocusQuotaGoalWithStatus }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm">
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <Timer className="size-3.5 shrink-0 text-primary/80" />
        <div className="truncate">Focus quota</div>
        {goal.completed ? (
          <span className="shrink-0 text-xs text-primary">Complete</span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            In progress
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
        {formatQuotaLabel(goal.completedMinutes, goal.targetMinutes, " min")}
      </span>
    </div>
  );
}
