import { m } from "framer-motion";

import { HISTORY_STATUS_UI } from "@/renderer/shared/components/history-status/history-status-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import { hoverLift, tapPress } from "@/renderer/shared/lib/motion";
import type {
  ContributionIntensity,
  HistoryStatus,
} from "@/renderer/shared/types/contribution";
import { formatDateKey } from "@/shared/utils/date";

interface ContributionCalendarCell {
  completedCount: number;
  date: string;
  intensity: ContributionIntensity;
  isToday: boolean;
  label: string;
  status: HistoryStatus;
  totalCount: number;
}

const CONTRIBUTION_INTENSITY_CLASSNAMES: Record<ContributionIntensity, string> =
  {
    0: "border-border/60 bg-transparent",
    1: "border-primary/20 bg-primary/15",
    2: "border-primary/35 bg-primary/30",
    3: "border-primary/50 bg-primary/55",
    4: "border-primary/70 bg-primary/85",
  };

function getContributionSquareClassName(
  cell: ContributionCalendarCell
): string {
  if (cell.status === "complete") {
    return HISTORY_STATUS_UI.complete.squareClassName;
  }

  if (cell.status === "freeze") {
    return HISTORY_STATUS_UI.freeze.squareClassName;
  }

  return CONTRIBUTION_INTENSITY_CLASSNAMES[cell.intensity];
}

export function ContributionSquare({
  cell,
}: {
  cell: ContributionCalendarCell;
}) {
  const completionLabel =
    cell.totalCount === 0
      ? "No daily habits tracked"
      : `${cell.completedCount}/${cell.totalCount} daily habits completed`;
  let detailLabel = "No tracked data";

  if (cell.status === "freeze") {
    detailLabel = "Freeze used to preserve streak";
  } else if (cell.status === "complete") {
    detailLabel = "All daily habits completed";
  } else if (cell.status === "in-progress") {
    detailLabel = "Still in progress";
  } else if (cell.status === "missed") {
    detailLabel = "Day ended incomplete";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <m.div
          aria-label={cell.label}
          className={cn(
            "size-3.5 cursor-help rounded-[2px] border outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            getContributionSquareClassName(cell),
            cell.isToday && "ring-1 ring-ring/60 ring-offset-1 ring-offset-card"
          )}
          role="img"
          tabIndex={0}
          whileHover={hoverLift}
          whileTap={tapPress}
        />
      </TooltipTrigger>
      <TooltipContent
        className="max-w-[220px] rounded-md border border-border/60 bg-card px-3 py-2 text-card-foreground shadow-lg"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-1">
          <p className="ui-eyebrow text-[11px]">
            {formatDateKey(cell.date, {
              day: "numeric",
              month: "short",
              weekday: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm font-medium text-foreground">
            {completionLabel}
          </p>
          <p className="text-xs text-muted-foreground">{detailLabel}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
