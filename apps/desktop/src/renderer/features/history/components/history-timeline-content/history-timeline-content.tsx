import { m } from "framer-motion";

import { TimelineDayRow } from "@/renderer/features/history/components/timeline-day-row";
import { TimelineHeaderRow } from "@/renderer/features/history/components/timeline-header-row";
import { staggerItemVariants } from "@/renderer/shared/lib/motion";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface HistoryTimelineContentProps {
  selectedDateKey: string | null;
  todayDate: string;
  visibleMonthDays: HistorySummaryDay[];
  visibleMonthLabel: string;
  selectHistoryDate: (dateKey: string) => void;
}

export function HistoryTimelineContent({
  selectedDateKey,
  selectHistoryDate,
  todayDate,
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
