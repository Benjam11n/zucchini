import { CalendarDays, Target, Timer } from "lucide-react";

import {
  formatFocusMinutes,
  getDailyCompletionPercent,
} from "@/renderer/features/history/lib/history-timeline";
import type {
  HistoryMonthStats,
  HistoryTrendPoint,
} from "@/renderer/features/history/lib/history-timeline";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/app/activity-ring/habit-activity-ring-glyph/habit-activity-ring-glyph";
import { Separator } from "@/renderer/shared/components/ui/separator";
import { cn } from "@/renderer/shared/lib/class-names";
import { formatDateKey } from "@/shared/domain/date-format";
import type { HistorySummaryDay } from "@/shared/domain/history";

import { SidebarMetric } from "../sidebar-metric/sidebar-metric";
import { TrendLine } from "../trend-line/trend-line";

interface HistorySidebarProps {
  monthStats: HistoryMonthStats;
  monthLabel: string;
  selectedDay: HistorySummaryDay | null;
  todayDate: string;
  trendPoints: HistoryTrendPoint[];
}

export function HistorySidebar({
  monthStats,
  monthLabel,
  selectedDay,
  todayDate,
  trendPoints,
}: HistorySidebarProps) {
  let selectedDayDailyCompleted = 0;
  let selectedDayDailyTotal = 0;

  if (selectedDay) {
    for (const category of selectedDay.categoryProgress) {
      selectedDayDailyCompleted += category.completed;
      selectedDayDailyTotal += category.total;
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <section className="grid gap-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {monthLabel}
        </h2>

        <div className="flex justify-center py-1">
          <div className="relative grid size-32 place-items-center">
            {selectedDay ? (
              <HabitActivityRingGlyph
                categoryProgress={selectedDay.categoryProgress}
                size={128}
              />
            ) : (
              <div className="size-32 rounded-full border border-dashed border-border/70" />
            )}
          </div>
        </div>

        {selectedDay ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {formatDateKey(selectedDay.date, "shortDateWithDayShort")}
              </p>
              {selectedDay.date === todayDate ? (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  Today
                </span>
              ) : null}
            </div>
            <SidebarMetric
              icon={Target}
              label="Daily habits"
              value={`${selectedDayDailyCompleted}/${selectedDayDailyTotal}`}
            />
            <SidebarMetric
              icon={Timer}
              label="Focus time"
              value={formatFocusMinutes(selectedDay.focusMinutes)}
            />
            <SidebarMetric
              icon={CalendarDays}
              label="Streak after day"
              value={`${selectedDay.summary.streakCountAfterDay}`}
            />
          </div>
        ) : null}
      </section>

      <Separator />

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Monthly trend
        </h2>
        <TrendLine points={trendPoints} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{trendPoints[0]?.date.slice(8) ?? "--"}</span>
          <span className="font-medium text-primary">
            {trendPoints.at(-1)?.percent ?? 0}%
          </span>
          <span>{trendPoints.at(-1)?.date.slice(8) ?? "--"}</span>
        </div>
      </section>

      <Separator />

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Selected month
        </h2>
        <SidebarMetric
          icon={Target}
          label="Avg. completion"
          value={`${monthStats.averageCompletion}%`}
        />
        <SidebarMetric
          icon={CalendarDays}
          label="Perfect days"
          value={`${monthStats.perfectDays}`}
        />
        <SidebarMetric
          icon={Timer}
          label="Total focus"
          value={formatFocusMinutes(monthStats.totalFocusMinutes)}
        />
        <div className="pt-1 text-xs text-muted-foreground">
          Best day{" "}
          <span
            className={cn(
              "font-medium text-foreground",
              !monthStats.bestDay && "text-muted-foreground"
            )}
          >
            {monthStats.bestDay
              ? `${formatDateKey(
                  monthStats.bestDay.date,
                  "shortDate"
                )} (${getDailyCompletionPercent(monthStats.bestDay)}%)`
              : "--"}
          </span>
        </div>
      </section>
    </div>
  );
}
