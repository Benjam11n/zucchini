import { useMemo } from "react";

import {
  buildContributionWeeks,
  formatContributionLabel,
} from "@/renderer/features/history/lib/history-contributions";
import { ContributionSquare } from "@/renderer/shared/components/contribution-square";
import { TooltipProvider } from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface ContributionGraphProps {
  history: HistorySummaryDay[];
  rangeEnd: string;
  rangeStart: string;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
}

export function ContributionGraph({
  history,
  onSelectDate,
  rangeEnd,
  rangeStart,
  selectedDateKey,
}: ContributionGraphProps) {
  const weeks = useMemo(
    () =>
      buildContributionWeeks(history, {
        endDate: rangeEnd,
        startDate: rangeStart,
      }).map((week) => ({
        ...week,
        cells: week.cells.map((cell) => ({
          completedCount: cell.completedCount,
          date: cell.date,
          intensity: cell.intensity,
          isToday: cell.isToday,
          label: formatContributionLabel(cell),
          status: cell.status,
          totalCount: cell.totalCount,
        })),
      })),
    [history, rangeEnd, rangeStart]
  );

  if (weeks.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/45 px-4 py-3">
        <div className="flex min-w-max gap-1.5">
          {weeks.map((week) => (
            <div className="grid gap-1" key={week.key}>
              {week.cells.map((cell) => (
                <button
                  aria-label={`Select ${cell.label}`}
                  className={cn(
                    "rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selectedDateKey === cell.date &&
                      "ring-1 ring-primary ring-offset-1"
                  )}
                  disabled={cell.totalCount === 0 && cell.status === "empty"}
                  key={cell.date}
                  onClick={() => onSelectDate(cell.date)}
                  type="button"
                >
                  <ContributionSquare cell={cell} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
