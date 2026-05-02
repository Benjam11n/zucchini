import type { TodayState } from "@/shared/contracts/today-state";
import type { HistoryDay } from "@/shared/domain/history";
import { addDays, startOfWeek } from "@/shared/utils/date";

type TodayMetricsState = Pick<TodayState, "date" | "habits">;

export interface TodaySidebarCompletion {
  completed: number;
  percent: number;
  total: number;
}

export interface TodaySidebarWeekDay {
  completed: number;
  date: string;
  label: string;
  percent: number;
  total: number;
}

export interface TodaySidebarConsistencyDay {
  completed: boolean;
  date: string;
}

export interface TodaySidebarConsistencySummary {
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

function getHistoryCompletion(historyDay: HistoryDay): TodaySidebarCompletion {
  const dailyHabits = historyDay.habits.filter(
    (habit) => habit.frequency === "daily"
  );
  const completed = dailyHabits.filter((habit) => habit.completed).length;
  const total = dailyHabits.length;

  return {
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  };
}

function getCompletionForDate(
  date: string,
  historyByDate: ReadonlyMap<string, HistoryDay>,
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
  history: readonly HistoryDay[],
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

export function getRecentConsistency(
  history: readonly HistoryDay[],
  state: TodayMetricsState,
  days = 7
): number {
  const historyByDate = new Map(history.map((day) => [day.date, day]));
  let availableDays = 0;
  let completedDays = 0;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(state.date, -offset);
    const completion = getCompletionForDate(date, historyByDate, state);

    if (!completion || completion.total === 0) {
      continue;
    }

    availableDays += 1;
    if (completion.completed === completion.total) {
      completedDays += 1;
    }
  }

  return availableDays === 0
    ? 0
    : Math.round((completedDays / availableDays) * 100);
}

export function getRecentConsistencySummary(
  history: readonly HistoryDay[],
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
