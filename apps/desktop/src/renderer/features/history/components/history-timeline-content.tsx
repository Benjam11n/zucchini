import { m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TimelineDayRow } from "@/renderer/features/history/components/timeline-day-row";
import { TimelineHeaderRow } from "@/renderer/features/history/components/timeline-header-row";
import { Button } from "@/renderer/shared/components/ui/button";
import { staggerItemVariants } from "@/renderer/shared/lib/motion";
import type { HistorySummaryDay } from "@/shared/domain/history";
import { formatDate } from "@/shared/utils/date";

interface HistoryTimelineContentProps {
  canShowNextMonth: boolean;
  canShowPreviousMonth: boolean;
  selectedDateKey: string | null;
  todayDate: string;
  visibleMonth: Date;
  visibleMonthDays: HistorySummaryDay[];
  visibleMonthLabel: string;
  selectHistoryDate: (dateKey: string) => void;
  showMonth: (offset: number) => void;
}

export function HistoryTimelineContent({
  canShowNextMonth,
  canShowPreviousMonth,
  selectedDateKey,
  selectHistoryDate,
  showMonth,
  todayDate,
  visibleMonth,
  visibleMonthDays,
  visibleMonthLabel,
}: HistoryTimelineContentProps) {
  return (
    <m.section className="grid gap-5" variants={staggerItemVariants}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {visibleMonthLabel}
          </h2>
          <span className="text-sm text-muted-foreground">
            {visibleMonthDays.length} tracked days
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Show previous month"
            disabled={!canShowPreviousMonth}
            onClick={() => showMonth(-1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-20 text-center text-sm font-medium text-muted-foreground">
            {formatDate(visibleMonth, { month: "long" })}
          </span>
          <Button
            aria-label="Show next month"
            disabled={!canShowNextMonth}
            onClick={() => showMonth(1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {visibleMonthDays.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/55 px-2">
            <TimelineHeaderRow />
            {visibleMonthDays.map((day) => (
              <TimelineDayRow
                day={day}
                isSelected={selectedDateKey === day.date}
                isToday={day.date === todayDate}
                key={day.date}
                onSelect={() => selectHistoryDate(day.date)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 bg-card/45 px-4 py-8 text-center text-sm text-muted-foreground">
            No history for this month.
          </div>
        )}
      </div>
    </m.section>
  );
}
