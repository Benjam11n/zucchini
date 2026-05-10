import { AnimatePresence, m } from "framer-motion";
import {
  CalendarPlus,
  HeartPulse,
  MoreHorizontal,
  Pause,
  X,
} from "lucide-react";
import { useMemo } from "react";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { HISTORY_STATUS_UI } from "@/renderer/shared/components/history-status/history-status-ui";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/shared/components/ui/dropdown-menu";
import { Separator } from "@/renderer/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";
import { microTransition } from "@/renderer/shared/lib/motion";
import type { TodayState } from "@/shared/contracts/today-state";
import type { DayStatusKind } from "@/shared/domain/day-status";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { HistorySummaryDay } from "@/shared/domain/history";

import {
  getRecentConsistencySummary,
  getTodayCompletion,
  getWeekCompletionSeries,
} from "../today-sidebar-metrics";

interface TodaySidebarProps {
  history: HistorySummaryDay[];
  state: TodayState;
  onMoveUnfinishedHabitsToTomorrow: () => void;
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
  rescheduled: {
    icon: CalendarPlus,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    label: "Moved",
    message: "Unfinished habits carried over.",
  },
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

function formatWeekBarLabel(day: {
  completed: number;
  date: string;
  percent: number;
  total: number;
}): string {
  return day.total === 0
    ? `${day.date}: no daily habits tracked`
    : `${day.date}: ${day.completed} of ${day.total} daily habits complete`;
}

export function TodaySidebar({
  history,
  onMoveUnfinishedHabitsToTomorrow,
  state,
  onSetDayStatus,
}: TodaySidebarProps) {
  const { dayStatus } = state;
  const dayStatusCopy = dayStatus ? DAY_STATUS_COPY[dayStatus] : null;
  const dayStatusUi = dayStatus ? HISTORY_STATUS_UI[dayStatus] : null;
  const DayStatusIcon = dayStatusCopy?.icon;
  const canMoveUnfinishedHabits = state.habits.some(
    (habit) => habit.frequency === "daily" && !habit.completed
  );
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
              <DropdownMenuItem
                disabled={!canMoveUnfinishedHabits}
                onClick={onMoveUnfinishedHabitsToTomorrow}
              >
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

        <AnimatePresence initial={false}>
          {dayStatusCopy ? (
            <m.div
              animate={{ height: "auto", opacity: 1, x: 0 }}
              className={cn(
                "flex items-center justify-between gap-3 overflow-hidden rounded-lg px-3 py-2",
                dayStatusUi?.badgeClassName
              )}
              exit={{ height: 0, opacity: 0, x: 8 }}
              initial={{ height: 0, opacity: 0, x: -8 }}
              key={dayStatus}
              transition={microTransition}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-background/80">
                  {DayStatusIcon ? (
                    <DayStatusIcon
                      className={cn("size-3.5", dayStatusCopy.iconClassName)}
                    />
                  ) : null}
                </div>
                <div className="grid min-w-0 gap-0.5">
                  <p className="truncate text-xs font-semibold">
                    {dayStatusCopy.label}
                  </p>
                  <p className="truncate text-xs opacity-80">
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
            </m.div>
          ) : null}
        </AnimatePresence>

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
          <TooltipProvider>
            <div className="flex h-28 items-end gap-2">
              {weekSeries.map((day) => (
                <div
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  key={day.date}
                >
                  <div className="flex h-20 w-full items-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label={formatWeekBarLabel(day)}
                          className="group/bar flex h-full w-full cursor-help items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          type="button"
                        >
                          <span
                            className={cn(
                              "w-full rounded-t-sm bg-muted transition-all duration-150 group-hover/bar:brightness-150 group-hover/bar:ring-2 group-hover/bar:ring-primary/25 group-focus-visible/bar:brightness-150",
                              getBarClassName(day.percent)
                            )}
                            style={{
                              height: `${Math.max(day.total === 0 ? 4 : 10, day.percent)}%`,
                            }}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {formatWeekBarLabel(day)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </TooltipProvider>
          <p className="text-xs text-muted-foreground">This week</p>
        </div>
      </section>
    </div>
  );
}
