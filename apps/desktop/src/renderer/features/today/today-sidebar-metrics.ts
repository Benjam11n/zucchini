import { getHistoryDailyCounts } from "@/renderer/features/history/lib/history-daily-counts";
import type { HistoryDailyCountDay } from "@/renderer/features/history/lib/history-daily-counts";
import type { TodayState } from "@/shared/contracts/today-state";
import { addDays, startOfWeek } from "@/shared/utils/date";

type TodayMetricsState = Pick<TodayState, "date" | "habits">;

interface TodaySidebarCompletion {
  completed: number;
  percent: number;
  total: number;
}

interface TodaySidebarWeekDay {
  completed: number;
  date: string;
  label: string;
  percent: number;
  total: number;
}

interface TodaySidebarConsistencyDay {
  completed: boolean;
  date: string;
}

interface TodaySidebarConsistencySummary {
  completedDays: number;
  days: TodaySidebarConsistencyDay[];
  percent: number;
  totalDays: number;
}

export function getTodayCompletion(
  habits: TodayState["habits"]
): TodaySidebarCompletion {
  const dailyHabits = habits.filter((habit) => habit.frequency === "daily");
  const completed = dailyHabits.filter((habit) => habit.completed).length;
  const total = dailyHabits.length;

  return {
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  };
}

function getHistoryCompletion(
  historyDay: HistoryDailyCountDay
): TodaySidebarCompletion {
  const { completed, total } = getHistoryDailyCounts(historyDay);

  return {
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  };
}

function getCompletionForDate(
  date: string,
  historyByDate: ReadonlyMap<string, HistoryDailyCountDay>,
  state: TodayMetricsState
): TodaySidebarCompletion | null {
  if (date === state.date) {
    return getTodayCompletion(state.habits);
  }

  const historyDay = historyByDate.get(date);
  if (!historyDay) {
    return null;
  }

  return getHistoryCompletion(historyDay);
}

export function getWeekCompletionSeries(
  history: readonly HistoryDailyCountDay[],
  state: TodayMetricsState
): TodaySidebarWeekDay[] {
  const historyByDate = new Map(history.map((day) => [day.date, day]));
  const weekStart = startOfWeek(state.date);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const completion = getCompletionForDate(date, historyByDate, state) ?? {
      completed: 0,
      percent: 0,
      total: 0,
    };

    return {
      ...completion,
      date,
      label: ["S", "M", "T", "W", "T", "F", "S"][index] ?? "",
    };
  });
}

export function getRecentConsistencySummary(
  history: readonly HistoryDailyCountDay[],
  state: TodayMetricsState,
  days = 30
): TodaySidebarConsistencySummary {
  const historyByDate = new Map(history.map((day) => [day.date, day]));
  const consistencyDays: TodaySidebarConsistencyDay[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(state.date, -offset);
    const completion = getCompletionForDate(date, historyByDate, state);
    const completed =
      completion !== null &&
      completion.total > 0 &&
      completion.completed === completion.total;

    consistencyDays.push({
      completed,
      date,
    });
  }

  const completedDays = consistencyDays.filter((day) => day.completed).length;

  return {
    completedDays,
    days: consistencyDays,
    percent: days === 0 ? 0 : Math.round((completedDays / days) * 100),
    totalDays: days,
  };
}
