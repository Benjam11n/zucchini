import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import { formatDateKey } from "@/shared/domain/date-key";
import type {
  WeeklyReviewHabitHeatmapCell,
  WeeklyReviewHabitHeatmapCellStatus,
} from "@/shared/domain/weekly-review";

interface HeatmapCellProps {
  cell: WeeklyReviewHabitHeatmapCell;
  habitName: string;
}

const STATUS_LABELS = {
  complete: "Complete",
  missed: "Missed",
  "not-scheduled": "Not scheduled",
  partial: "Partial",
} satisfies Record<WeeklyReviewHabitHeatmapCellStatus, string>;

function getHeatmapCellClassName(
  status: WeeklyReviewHabitHeatmapCellStatus
): string {
  if (status === "complete") {
    return "bg-primary text-primary-foreground";
  }

  if (status === "partial") {
    return "bg-primary/35 text-foreground";
  }

  if (status === "missed") {
    return "bg-destructive/18 text-destructive";
  }

  return "border border-dashed border-border/60 bg-muted/35 text-muted-foreground";
}

function getCellTooltip(
  habitName: string,
  cell: WeeklyReviewHabitHeatmapCell
): string {
  const dateLabel = formatDateKey(
    cell.date,
    { day: "numeric", month: "short", weekday: "long" },
    "en-US"
  );

  return `${habitName} · ${dateLabel} · ${STATUS_LABELS[cell.status]}`;
}

export function HeatmapCell({ cell, habitName }: HeatmapCellProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          aria-label={getCellTooltip(habitName, cell)}
          className={cn(
            "size-7 rounded-md",
            getHeatmapCellClassName(cell.status)
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        {getCellTooltip(habitName, cell)}
      </TooltipContent>
    </Tooltip>
  );
}
