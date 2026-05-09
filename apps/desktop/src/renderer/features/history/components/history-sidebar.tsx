import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Target,
  Timer,
} from "lucide-react";
import type { ElementType } from "react";

import {
  formatFocusMinutes,
  getDailyCompletionPercent,
} from "@/renderer/features/history/lib/history-timeline";
import type {
  HistoryMonthStats,
  HistoryTrendPoint,
} from "@/renderer/features/history/lib/history-timeline";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/components/ui/button";
import { Separator } from "@/renderer/shared/components/ui/separator";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HistorySummaryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

interface HistorySidebarProps {
  monthStats: HistoryMonthStats;
  nextDateKey: string | null;
  previousDateKey: string | null;
  selectedDay: HistorySummaryDay | null;
  todayDate: string;
  trendPoints: HistoryTrendPoint[];
  onSelectDate: (dateKey: string) => void;
}

function SidebarMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function TrendLine({ points }: { points: HistoryTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
        No trend yet
      </div>
    );
  }

  const getTrendCoordinate = (point: HistoryTrendPoint, index: number) => ({
    x:
      points.length === 1
        ? 100
        : Math.round((index / (points.length - 1)) * 200),
    y: Math.round(90 - point.percent * 0.8),
  });
  const path = points
    .map((point, index) => {
      const { x, y } = getTrendCoordinate(point, index);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-label="Completion trend"
      className="h-28 w-full overflow-visible"
      role="img"
      viewBox="0 0 200 100"
    >
      {[10, 30, 50, 70, 90].map((y) => (
        <line
          className="stroke-border/70"
          key={y}
          strokeDasharray="4 4"
          x1="0"
          x2="200"
          y1={y}
          y2={y}
        />
      ))}
      <path
        className="stroke-primary"
        d={path}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {points.map((point, index) => {
        const { x, y } = getTrendCoordinate(point, index);

        return (
          <circle
            className="fill-background stroke-primary"
            cx={x}
            cy={y}
            key={point.date}
            r={index === points.length - 1 ? 3.5 : 2.5}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

export function HistorySidebar({
  monthStats,
  nextDateKey,
  onSelectDate,
  previousDateKey,
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {selectedDay
              ? formatDateKey(selectedDay.date, {
                  month: "long",
                  year: "numeric",
                })
              : "History"}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous history day"
              disabled={!previousDateKey}
              onClick={() => previousDateKey && onSelectDate(previousDateKey)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              aria-label="Next history day"
              disabled={!nextDateKey}
              onClick={() => nextDateKey && onSelectDate(nextDateKey)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

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
                {formatDateKey(selectedDay.date, {
                  day: "numeric",
                  month: "short",
                  weekday: "short",
                })}
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
              ? `${formatDateKey(monthStats.bestDay.date, {
                  day: "numeric",
                  month: "short",
                })} (${getDailyCompletionPercent(monthStats.bestDay)}%)`
              : "--"}
          </span>
        </div>
      </section>
    </div>
  );
}
