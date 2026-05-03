import { isHabitScheduledForDate } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";

export interface HabitStreak {
  bestStreak: number;
  currentStreak: number;
}

export interface PersistedHabitStreakState extends HabitStreak {
  habitId: number;
  lastEvaluatedDate: string | null;
}

export interface HabitStreakDay {
  date: string;
  dayStatus: "sick" | null;
  freezeUsed: boolean;
  habits: readonly HabitWithStatus[];
  isOpenToday: boolean;
}

function getHabitForDay(
  habitId: number,
  habits: readonly HabitWithStatus[]
): HabitWithStatus | null {
  return habits.find((habit) => habit.id === habitId) ?? null;
}

function isSkippedDay(day: Pick<HabitStreakDay, "dayStatus" | "freezeUsed">) {
  return day.dayStatus === "sick" || day.freezeUsed;
}

export function calculateHabitStreak(
  habitId: number,
  days: readonly HabitStreakDay[]
): HabitStreak {
  let bestStreak = 0;
  let currentStreak = 0;
  const sortedDays = [...days].toSorted((left, right) =>
    left.date.localeCompare(right.date)
  );

  for (const day of sortedDays) {
    const habit = getHabitForDay(habitId, day.habits);
    if (!habit || !isHabitScheduledForDate(habit, day.date)) {
      continue;
    }

    if (isSkippedDay(day)) {
      continue;
    }

    if (!habit.completed) {
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
  habits: readonly HabitWithStatus[],
  days: readonly HabitStreakDay[]
): Record<number, HabitStreak> {
  const streaks: Record<number, HabitStreak> = {};

  for (const habit of habits) {
    if (habit.frequency !== "daily") {
      continue;
    }

    streaks[habit.id] = calculateHabitStreak(habit.id, days);
  }

  return streaks;
}
