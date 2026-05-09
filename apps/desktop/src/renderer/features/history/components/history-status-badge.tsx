import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistoryStatus } from "@/renderer/shared/types/contribution";

interface HistoryStatusBadgeProps {
  className?: string | undefined;
  compact?: boolean;
  isToday?: boolean | undefined;
  status: HistoryStatus;
}

function getHistoryStatusBadgeLabel(
  status: HistoryStatus,
  isToday?: boolean
): string {
  if (status === "sick") {
    return "Sick";
  }

  if (status === "rest") {
    return "Rest";
  }

  if (status === "rescheduled") {
    return "Moved";
  }

  if (status === "freeze") {
    return "Freeze";
  }

  if (status === "complete") {
    return "Completed";
  }

  if (status === "in-progress") {
    return isToday ? "Today" : "In Progress";
  }

  return "Missed";
}

export function HistoryStatusBadge({
  className,
  compact = false,
  isToday,
  status,
}: HistoryStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        compact && "px-1.5 py-0 text-[0.58rem] leading-none",
        HISTORY_STATUS_UI[status].badgeClassName,
        className
      )}
      variant="outline"
    >
      {getHistoryStatusBadgeLabel(status, isToday)}
    </Badge>
  );
}
