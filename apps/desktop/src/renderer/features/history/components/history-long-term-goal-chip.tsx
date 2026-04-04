import { StatusIndicator } from "@/renderer/features/history/components/status-indicator";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { cn } from "@/renderer/shared/lib/class-names";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";

type HistoryLongTermGoalChipProps =
  | {
      goal: FocusQuotaGoalWithStatus;
      habit?: never;
    }
  | {
      goal?: never;
      habit: HabitWithStatus;
    };

export function HistoryLongTermGoalChip({
  goal,
  habit,
}: HistoryLongTermGoalChipProps) {
  const completed = goal?.completed ?? habit?.completed ?? false;
  const label = goal
    ? `Focus quota • ${goal.completedMinutes}/${goal.targetMinutes} min`
    : habit?.name;
  const frequency = goal?.frequency ?? habit?.frequency;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        completed
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/60 bg-background/50 text-muted-foreground"
      )}
    >
      <StatusIndicator completed={completed} />
      {label}
      {frequency ? (
        <Badge
          className="ml-0.5 h-4 px-1 text-[0.65rem] capitalize"
          variant="secondary"
        >
          {frequency}
        </Badge>
      ) : null}
    </div>
  );
}
