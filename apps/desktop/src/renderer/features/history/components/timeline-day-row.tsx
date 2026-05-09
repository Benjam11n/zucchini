import { HistoryStatusBadge } from "@/renderer/features/history/components/history-status-badge";
import { getActivityStatus } from "@/renderer/features/history/lib/history-summary";
import {
  formatFocusMinutes,
  getDailyCompletionPercent,
  getDailyMissCount,
} from "@/renderer/features/history/lib/history-timeline";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistorySummaryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

interface TimelineDayRowProps {
  day: HistorySummaryDay;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}

export function TimelineDayRow({
  day,
  isSelected,
  isToday,
  onSelect,
}: TimelineDayRowProps) {
  const percent = getDailyCompletionPercent(day);
  const status = getActivityStatus(day.summary, isToday);
  const missedCount = getDailyMissCount(day);

  return (
    <button
      className={cn(
        "grid w-full grid-cols-[72px_1fr_72px_88px_72px_24px] items-center gap-3 border-b border-l-2 border-b-border/55 border-l-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
        isSelected && "border-l-primary bg-primary/5"
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="font-medium text-foreground">
        {isToday ? "Today" : formatDateKey(day.date, { weekday: "short" })}
      </div>
      <div className="min-w-0">
        <p className="truncate text-muted-foreground">
          {formatDateKey(day.date, { day: "numeric", month: "short" })}
        </p>
      </div>
      <div className="font-medium text-foreground">{percent}%</div>
      <div className="text-muted-foreground">
        {formatFocusMinutes(day.focusMinutes)}
      </div>
      <HistoryStatusBadge
        className="justify-self-start"
        isToday={isToday}
        status={status}
      />
      <div className="flex justify-end">
        <span className="min-w-5 rounded-md bg-muted px-1.5 py-0.5 text-center text-xs font-medium text-muted-foreground">
          {missedCount}
        </span>
      </div>
    </button>
  );
}
