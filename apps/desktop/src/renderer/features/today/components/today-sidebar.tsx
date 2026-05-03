import { MoreHorizontal } from "lucide-react";
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
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

import {
  getRecentConsistencySummary,
  getTodayCompletion,
  getWeekCompletionSeries,
} from "../today-sidebar-metrics";

interface TodaySidebarProps {
  history: HistoryDay[];
  isSickDay: boolean;
  state: TodayState;
  onToggleSickDay: () => void;
}

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
  isSickDay,
  state,
  onToggleSickDay,
}: TodaySidebarProps) {
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleSickDay}>
                {isSickDay ? "Undo sick day" : "Mark today sick"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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

      {isSickDay ? (
        <p className="-mt-3 text-xs text-muted-foreground">
          Today marked sick. Streak preserved.
        </p>
      ) : null}

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
