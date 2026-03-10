import { m } from "framer-motion";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ContributionIntensity } from "@/renderer/features/history/types";
import type { HistoryStatus } from "@/renderer/lib/history-status";
import { hoverLift, tapPress } from "@/renderer/lib/motion";
import { formatDateKey } from "@/shared/utils/date";

interface GitHubCalendarCell {
  completedCount: number;
  date: string;
  intensity: ContributionIntensity;
  isToday: boolean;
  label: string;
  status: HistoryStatus;
  totalCount: number;
}

interface GitHubCalendarWeek {
  cells: GitHubCalendarCell[];
  key: string;
}

interface GitHubCalendarProps {
  weeks: GitHubCalendarWeek[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEGEND_INTENSITIES: ContributionIntensity[] = [0, 1, 2, 3, 4];
const SPECIAL_STATE_LABELS: Record<"complete" | "freeze", string> = {
  complete: "Complete",
  freeze: "Freeze",
};
const CONTRIBUTION_INTENSITY_CLASSNAMES: Record<ContributionIntensity, string> =
  {
    0: "border-border/60 bg-transparent",
    1: "border-primary/20 bg-primary/15",
    2: "border-primary/35 bg-primary/30",
    3: "border-primary/50 bg-primary/55",
    4: "border-primary/70 bg-primary/85",
  };
const SPECIAL_CONTRIBUTION_STATE_CLASSNAMES: Record<
  "complete" | "freeze",
  string
> = {
  complete:
    "border-emerald-500/85 bg-emerald-500 shadow-[0_0_0_1px_rgb(16_185_129_/_0.18)]",
  freeze:
    "border-sky-500/85 bg-sky-400/85 shadow-[0_0_0_1px_rgb(14_165_233_/_0.18)]",
};

function formatMonth(dateKey: string): string {
  return formatDateKey(dateKey, { month: "short" });
}

function getMonthLabel(
  weeks: GitHubCalendarWeek[],
  index: number,
  dateKey: string
): string {
  if (index === 0) {
    return formatMonth(dateKey);
  }

  const previousDate =
    weeks[index - 1]?.cells[0]?.date ?? weeks[index - 1]?.key;

  if (!previousDate) {
    return formatMonth(dateKey);
  }

  return formatMonth(previousDate) === formatMonth(dateKey)
    ? ""
    : formatMonth(dateKey);
}

function getContributionSquareClassName(cell: GitHubCalendarCell): string {
  if (cell.status === "complete") {
    return SPECIAL_CONTRIBUTION_STATE_CLASSNAMES.complete;
  }

  if (cell.status === "freeze") {
    return SPECIAL_CONTRIBUTION_STATE_CLASSNAMES.freeze;
  }

  return CONTRIBUTION_INTENSITY_CLASSNAMES[cell.intensity];
}

function ContributionSquare({ cell }: { cell: GitHubCalendarCell }) {
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
            "size-3.5 cursor-help rounded-[4px] border outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
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
        className="max-w-[220px] rounded-xl border border-border/60 bg-card px-3 py-2 text-card-foreground shadow-lg"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted-foreground">
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

function GitHubCalendar({ weeks }: GitHubCalendarProps) {
  if (weeks.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-border/60 bg-background/20 px-4 py-10 text-center text-sm text-muted-foreground">
        No history yet. Complete a day to populate the heatmap.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-[28px] border border-border/60 bg-background/30 p-4 sm:p-5">
        <div className="min-w-max">
          <div className="mb-3 flex gap-1 pl-8 text-[11px] text-muted-foreground">
            {weeks.map((week, index) => {
              const dateKey = week.cells[0]?.date ?? week.key;

              return (
                <div key={week.key} className="w-3.5">
                  <span className="block w-0 text-left">
                    {getMonthLabel(weeks, index, dateKey)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="grid gap-1 pt-[2px] text-[11px] text-muted-foreground">
              {DAY_LABELS.map((day) => (
                <span key={day} className="flex h-3.5 items-center">
                  {day}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week) => (
                <div key={week.key} className="grid gap-1">
                  {week.cells.map((cell) => (
                    <ContributionSquare key={cell.date} cell={cell} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
            <span>Less</span>
            {LEGEND_INTENSITIES.map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  "size-3.5 rounded-[4px] border",
                  CONTRIBUTION_INTENSITY_CLASSNAMES[intensity]
                )}
              />
            ))}
            <span>More</span>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 text-[11px] text-muted-foreground">
            {Object.entries(SPECIAL_STATE_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "size-3.5 rounded-[4px] border",
                    SPECIAL_CONTRIBUTION_STATE_CLASSNAMES[
                      status as keyof typeof SPECIAL_CONTRIBUTION_STATE_CLASSNAMES
                    ]
                  )}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { GitHubCalendar };
