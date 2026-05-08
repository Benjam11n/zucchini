import type { HistoryDay } from "@/shared/domain/history";

export interface HistoryMonthStats {
  averageCompletion: number;
  bestDay: HistoryDay | null;
  perfectDays: number;
  totalFocusMinutes: number;
  trackedDays: number;
}

export interface HistoryTrendPoint {
  date: string;
  percent: number;
}

function getUniqueDailyHabits(day: HistoryDay) {
  return [
    ...new Map(
      day.habits
        .filter((habit) => habit.frequency === "daily")
        .map((habit) => [habit.id, habit])
    ).values(),
  ];
}

export function getDailyCompletionPercent(day: HistoryDay): number {
  const uniqueDailyHabits = getUniqueDailyHabits(day);

  if (uniqueDailyHabits.length === 0) {
    return day.summary.allCompleted ? 100 : 0;
  }

  return Math.round(
    (uniqueDailyHabits.filter((habit) => habit.completed).length /
      uniqueDailyHabits.length) *
      100
  );
}

export function formatFocusMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

export function getHistoryMonthDays(
  history: HistoryDay[],
  selectedDateKey: string | null
): HistoryDay[] {
  const fallbackMonth = history[0]?.date.slice(0, 7) ?? null;
  const selectedMonth = selectedDateKey?.slice(0, 7) ?? fallbackMonth;

  if (!selectedMonth) {
    return [];
  }

  return history.filter((day) => day.date.startsWith(selectedMonth));
}

export function getHistoryMonthStats(days: HistoryDay[]): HistoryMonthStats {
  if (days.length === 0) {
    return {
      averageCompletion: 0,
      bestDay: null,
      perfectDays: 0,
      totalFocusMinutes: 0,
      trackedDays: 0,
    };
  }

  const totalCompletion = days.reduce(
    (total, day) => total + getDailyCompletionPercent(day),
    0
  );
  const [bestDay = null] = days.toSorted((left, right) => {
    const completionDelta =
      getDailyCompletionPercent(right) - getDailyCompletionPercent(left);

    if (completionDelta !== 0) {
      return completionDelta;
    }

    return right.focusMinutes - left.focusMinutes;
  });

  return {
    averageCompletion: Math.round(totalCompletion / days.length),
    bestDay,
    perfectDays: days.filter((day) => day.summary.allCompleted).length,
    totalFocusMinutes: days.reduce((total, day) => total + day.focusMinutes, 0),
    trackedDays: days.length,
  };
}

export function getHistoryTrendPoints(days: HistoryDay[]): HistoryTrendPoint[] {
  return days
    .toSorted((left, right) => left.date.localeCompare(right.date))
    .map((day) => ({
      date: day.date,
      percent: getDailyCompletionPercent(day),
    }));
}
