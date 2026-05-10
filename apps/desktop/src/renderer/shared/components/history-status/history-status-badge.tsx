import {
  getHistoryStatusLabel,
  HISTORY_STATUS_UI,
} from "@/renderer/shared/components/history-status/history-status-ui";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistoryStatus } from "@/renderer/shared/types/contribution";

interface HistoryStatusBadgeProps {
  className?: string | undefined;
  compact?: boolean;
  isToday?: boolean | undefined;
  status: HistoryStatus;
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
      {getHistoryStatusLabel(status, isToday)}
    </Badge>
  );
}
