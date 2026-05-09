import { getHistoryDailyCounts } from "@/renderer/shared/lib/history-daily-counts";
import type { HistoryDailyCountDay } from "@/renderer/shared/lib/history-daily-counts";

export interface HistoryMonthStats {
  averageCompletion: number;
  bestDay: HistoryDailyCountDay | null;
  perfectDays: number;
  totalFocusMinutes: number;
  trackedDays: number;
}

export interface HistoryTrendPoint {
  date: string;
  percent: number;
}

export function getDailyCompletionPercent(day: HistoryDailyCountDay): number {
  const { completed, total } = getHistoryDailyCounts(day);

  if (total === 0) {
    return day.summary.allCompleted ? 100 : 0;
  }

  return Math.round((completed / total) * 100);
}

export function getDailyMissCount(day: HistoryDailyCountDay): number {
  const { completed, total } = getHistoryDailyCounts(day);

  return Math.max(total - completed, 0);
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
  history: HistoryDailyCountDay[],
  selectedDateKey: string | null
): HistoryDailyCountDay[] {
  const fallbackMonth = history[0]?.date.slice(0, 7) ?? null;
  const selectedMonth = selectedDateKey?.slice(0, 7) ?? fallbackMonth;

  if (!selectedMonth) {
    return [];
  }

  return history.filter((day) => day.date.startsWith(selectedMonth));
}

export function getHistoryMonthStats(
  days: HistoryDailyCountDay[]
): HistoryMonthStats {
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

export function getHistoryTrendPoints(
  days: HistoryDailyCountDay[]
): HistoryTrendPoint[] {
  return days
    .toSorted((left, right) => left.date.localeCompare(right.date))
    .map((day) => ({
      date: day.date,
      percent: getDailyCompletionPercent(day),
    }));
}
