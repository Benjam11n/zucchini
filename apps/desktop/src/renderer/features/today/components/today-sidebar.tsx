import {
  CalendarPlus,
  HeartPulse,
  MoreHorizontal,
  Pause,
  X,
} from "lucide-react";
import { useMemo } from "react";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/shared/components/ui/dropdown-menu";
import { Separator } from "@/renderer/shared/components/ui/separator";
import { cn } from "@/renderer/shared/lib/class-names";
import type { TodayState } from "@/shared/contracts/today-state";
import type { DayStatusKind } from "@/shared/domain/day-status";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

import {
  getRecentConsistencySummary,
  getTodayCompletion,
  getWeekCompletionSeries,
} from "../today-sidebar-metrics";

interface TodaySidebarProps {
  history: HistoryDay[];
  state: TodayState;
  onSetDayStatus: (kind: DayStatusKind | null) => void;
}

const DAY_STATUS_COPY: Record<
  DayStatusKind,
  {
    icon: typeof HeartPulse;
    iconClassName: string;
    label: string;
    message: string;
  }
> = {
  rest: {
    icon: Pause,
    iconClassName: "text-sky-600 dark:text-sky-400",
    label: "Rest day",
    message: "Habits paused.",
  },
  sick: {
    icon: HeartPulse,
    iconClassName: "text-amber-600 dark:text-amber-400",
    label: "Sick day",
    message: "Streak preserved.",
  },
};

function getBarClassName(percent: number): string {
  if (percent === 100) {
    return "bg-primary";
  }

  if (percent > 0) {
    return "bg-primary/60";
  }

  return "bg-muted";
}

function formatDays(value: number): string {
  return value === 1 ? "1 day" : `${value} days`;
}

export function TodaySidebar({
  history,
  state,
  onSetDayStatus,
}: TodaySidebarProps) {
  const { dayStatus } = state;
  const dayStatusCopy = dayStatus ? DAY_STATUS_COPY[dayStatus] : null;
  const DayStatusIcon = dayStatusCopy?.icon;
  const todayMetricsState = useMemo(
    () => ({
      date: state.date,
      habits: state.habits,
    }),
    [state.date, state.habits]
  );
  const { consistency, todayCompletion, weekSeries } = useMemo(
    () => ({
      consistency: getRecentConsistencySummary(history, todayMetricsState),
      todayCompletion: getTodayCompletion(state.habits),
      weekSeries: getWeekCompletionSeries(history, todayMetricsState),
    }),
    [history, state.habits, todayMetricsState]
  );
  const categoryProgress = useMemo(
    () =>
      getHabitCategoryProgress(
        state.habits.filter((habit) => habit.frequency === "daily")
      ),
    [state.habits]
  );

  return (
    <div className="grid min-w-0 gap-6">
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Today
            </h2>
            <p className="text-xs text-muted-foreground">
              {todayCompletion.completed} of {todayCompletion.total} complete
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open today options"
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Day options
              </div>
              <DropdownMenuItem onClick={() => onSetDayStatus("sick")}>
                <HeartPulse className="size-4 text-amber-600" />
                <div className="grid gap-0.5">
                  <span>Sick day</span>
                  <span className="text-xs text-muted-foreground">
                    Preserve streak today
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetDayStatus("rest")}>
                <Pause className="size-4 text-sky-600" />
                <div className="grid gap-0.5">
                  <span>Rest day</span>
                  <span className="text-xs text-muted-foreground">
                    Pause habits today
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <CalendarPlus className="size-4" />
                <div className="grid gap-0.5">
                  <span>Move unfinished</span>
                  <span className="text-xs text-muted-foreground">
                    Carry remaining to tomorrow
                  </span>
                </div>
              </DropdownMenuItem>
              {dayStatus ? (
                <DropdownMenuItem onClick={() => onSetDayStatus(null)}>
                  <X className="size-4" />
                  Clear day status
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {dayStatusCopy ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/65 bg-muted/30 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid size-7 shrink-0 place-items-center rounded-full bg-background/80">
                {DayStatusIcon ? (
                  <DayStatusIcon
                    className={cn("size-3.5", dayStatusCopy.iconClassName)}
                  />
                ) : null}
              </div>
              <div className="grid min-w-0 gap-0.5">
                <p className="truncate text-xs font-semibold text-foreground">
                  {dayStatusCopy.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {dayStatusCopy.message}
                </p>
              </div>
            </div>
            <Button
              aria-label="Clear day status"
              className="size-7 shrink-0"
              onClick={() => onSetDayStatus(null)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : null}

        <div className="flex justify-center py-1">
          <div
            aria-label={`Today completion ${todayCompletion.percent}%`}
            className="relative grid size-36 place-items-center"
            role="img"
          >
            <HabitActivityRingGlyph
              categoryProgress={categoryProgress}
              size={144}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="grid gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Current streak
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight text-foreground">
            {state.streak.currentStreak}
          </span>
          <span className="text-base text-muted-foreground">
            {state.streak.currentStreak === 1 ? "day" : "days"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Best: {formatDays(state.streak.bestStreak)}
        </p>
      </section>

      <Separator />

      <section className="grid gap-4">
        <div className="grid gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Consistency
          </h2>
          <span className="text-5xl font-semibold tracking-tight text-foreground">
            {consistency.percent}%
          </span>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {consistency.completedDays} of {consistency.totalDays} days
            </p>
            <div
              aria-label={`${consistency.completedDays} of ${consistency.totalDays} days complete`}
              className="grid grid-cols-10 gap-1"
              role="img"
            >
              {consistency.days.map((day) => (
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    day.completed ? "bg-primary" : "bg-muted"
                  )}
                  key={day.date}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="flex h-28 items-end gap-2">
            {weekSeries.map((day) => (
              <div
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                key={day.date}
              >
                <div className="flex h-20 w-full items-end">
                  <div
                    aria-label={`${day.label} ${day.percent}% complete`}
                    className={cn(
                      "w-full rounded-t-sm bg-muted transition-colors",
                      getBarClassName(day.percent)
                    )}
                    style={{
                      height: `${Math.max(day.total === 0 ? 4 : 10, day.percent)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">This week</p>
        </div>
      </section>
    </div>
  );
}
