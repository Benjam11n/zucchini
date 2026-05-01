import type { TodayState } from "@/shared/contracts/today-state";
import { isHabitScheduledForDate } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

export interface HabitStreak {
  bestStreak: number;
  currentStreak: number;
}

interface HabitStreakDay {
  completed: boolean;
  date: string;
  isOpenToday: boolean;
  skipped: boolean;
}

function isSkippedDay(
  day: Pick<HistoryDay, "summary"> | Pick<TodayState, "dayStatus">
): boolean {
  if ("summary" in day) {
    return day.summary.dayStatus === "sick" || day.summary.freezeUsed;
  }

  return day.dayStatus === "sick";
}

function getHabitForDay(
  habitId: number,
  habits: readonly HabitWithStatus[]
): HabitWithStatus | null {
  return habits.find((habit) => habit.id === habitId) ?? null;
}

function buildHabitStreakDays(
  habitId: number,
  history: readonly HistoryDay[],
  todayState: TodayState
): HabitStreakDay[] {
  const days: HabitStreakDay[] = [];
  const sortedHistory = [...history].toSorted((left, right) =>
    left.date.localeCompare(right.date)
  );

  for (const day of sortedHistory) {
    const habit = getHabitForDay(habitId, day.habits);
    if (!habit || !isHabitScheduledForDate(habit, day.date)) {
      continue;
    }

    days.push({
      completed: habit.completed,
      date: day.date,
      isOpenToday: false,
      skipped: isSkippedDay(day),
    });
  }

  const todayHabit = getHabitForDay(habitId, todayState.habits);
  if (
    todayHabit &&
    isHabitScheduledForDate(todayHabit, todayState.date) &&
    !days.some((day) => day.date === todayState.date)
  ) {
    days.push({
      completed: todayHabit.completed,
      date: todayState.date,
      isOpenToday: true,
      skipped: isSkippedDay(todayState),
    });
  }

  return days;
}

export function calculateHabitStreak(
  habitId: number,
  history: readonly HistoryDay[],
  todayState: TodayState
): HabitStreak {
  let bestStreak = 0;
  let currentStreak = 0;

  for (const day of buildHabitStreakDays(habitId, history, todayState)) {
    if (day.skipped) {
      continue;
    }

    if (!day.completed) {
      if (!day.isOpenToday) {
        currentStreak = 0;
      }
      continue;
    }

    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  return {
    bestStreak,
    currentStreak,
  };
}

export function calculateHabitStreaks(
  history: readonly HistoryDay[],
  todayState: TodayState
): Map<number, HabitStreak> {
  const streaks = new Map<number, HabitStreak>();

  for (const habit of todayState.habits) {
    if (habit.frequency !== "daily") {
      continue;
    }

    streaks.set(habit.id, calculateHabitStreak(habit.id, history, todayState));
  }

  return streaks;
}
