import type { DayStatusKind } from "@/shared/domain/day-status";

export function getBarClassName(percent: number): string {
  if (percent === 100) {
    return "bg-primary";
  }

  if (percent > 0) {
    return "bg-primary/60";
  }

  return "bg-muted";
}

export function formatDays(value: number): string {
  return value === 1 ? "1 day" : `${value} days`;
}

export function formatWeekBarLabel(day: {
  completed: number;
  date: string;
  percent: number;
  total: number;
}): string {
  return day.total === 0
    ? `${day.date}: no daily habits tracked`
    : `${day.date}: ${day.completed} of ${day.total} daily habits complete`;
}

export const DAY_STATUS_COPY: Record<
  DayStatusKind,
  {
    iconClassName: string;
    label: string;
    message: string;
  }
> = {
  rescheduled: {
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    label: "Moved",
    message: "Unfinished habits carried over.",
  },
  rest: {
    iconClassName: "text-sky-600 dark:text-sky-400",
    label: "Rest day",
    message: "Habits paused.",
  },
  sick: {
    iconClassName: "text-amber-600 dark:text-amber-400",
    label: "Sick day",
    message: "Streak preserved.",
  },
};
