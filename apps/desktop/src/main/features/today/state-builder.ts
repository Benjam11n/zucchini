/**
 * Today state builder — assembles the read-model the renderer consumes.
 *
 * Pure functions that query the repository and compose the {@link TodayState},
 * {@link HistoryDay}, and streak preview objects. Called on every read path
 * after streak synchronization.
 */
import type { Clock } from "@/main/app/clock";
import type { AppRepository } from "@/main/infra/persistence/app-repository";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import { previewOpenDay } from "@/shared/domain/streak-engine";

export function buildTodayState(
  repository: AppRepository,
  clock: Clock
): TodayState {
  const today = clock.todayKey();
  repository.ensureStatusRowsForDate(today);

  const habits = repository.getHabitsWithStatus(today);
  const dailyHabits = habits.filter(isDailyHabit);
  const settledStreak = repository.getPersistedStreakState();
  const preview = previewOpenDay(
    settledStreak,
    dailyHabits.length > 0 && dailyHabits.every((habit) => habit.completed)
  );

  const focusSessions = repository.getFocusSessionsInRange(today, today);
  const totalSeconds = focusSessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );
  const focusMinutes =
    totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0;

  return {
    date: today,
    focusMinutes,
    focusQuotaGoals: repository.getFocusQuotaGoalsWithStatusForDate(today),
    habits,
    settings: repository.getSettings(clock.timezone()),
    streak: {
      availableFreezes: preview.availableFreezes,
      bestStreak: preview.bestStreak,
      currentStreak: preview.currentStreak,
      lastEvaluatedDate: settledStreak.lastEvaluatedDate,
    },
  };
}

export function buildTodayPreviewSummary(
  todayState: TodayState,
  nowIso: string
): DailySummary {
  const dailyHabits = todayState.habits.filter(isDailyHabit);
  const allCompleted =
    dailyHabits.length > 0 && dailyHabits.every((habit) => habit.completed);

  return {
    allCompleted,
    completedAt: allCompleted ? nowIso : null,
    date: todayState.date,
    freezeUsed: false,
    streakCountAfterDay: todayState.streak.currentStreak,
  };
}

export function buildHistoryDay(
  summary: DailySummary,
  habits: HabitWithStatus[],
  focusMinutes: number,
  focusQuotaGoals: HistoryDay["focusQuotaGoals"]
): HistoryDay {
  return {
    categoryProgress: getHabitCategoryProgress(habits.filter(isDailyHabit)),
    date: summary.date,
    focusMinutes,
    habits,
    summary,
    ...(focusQuotaGoals ? { focusQuotaGoals } : {}),
  };
}

export function createRollingStreakState(streak: StreakState): StreakState {
  return {
    availableFreezes: streak.availableFreezes,
    bestStreak: streak.bestStreak,
    currentStreak: streak.currentStreak,
    lastEvaluatedDate: streak.lastEvaluatedDate,
  };
}
