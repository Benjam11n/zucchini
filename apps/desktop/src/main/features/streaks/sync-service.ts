/**
 * Rolling streak synchronization service.
 *
 * Catches up streak evaluation from the last persisted checkpoint to
 * yesterday. For each unprocessed day, it settles the streak outcome
 * (complete, missed, or freeze) and writes a daily summary row.
 * This runs on every read path so the streak is always current.
 */
import type { Clock } from "@/main/app/clock";
import { createRollingStreakState } from "@/main/features/today/state-builder";
import type { AppRepository } from "@/main/infra/persistence/app-repository";
import { isDailyHabit } from "@/shared/domain/habit";
import { settleClosedDay } from "@/shared/domain/streak-engine";

export function syncRollingState(
  repository: AppRepository,
  clock: Clock
): void {
  const today = clock.todayKey();
  repository.ensureStatusRowsForDate(today);

  const persisted = repository.getPersistedStreakState();
  const yesterday = clock.addDays(today, -1);
  const firstTrackedDate = repository.getFirstTrackedDate();

  if (!firstTrackedDate) {
    return;
  }

  let cursor = persisted.lastEvaluatedDate
    ? clock.addDays(persisted.lastEvaluatedDate, 1)
    : firstTrackedDate;

  if (clock.compareDateKeys(cursor, yesterday) > 0) {
    return;
  }

  let rollingState = createRollingStreakState(persisted);

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    repository.ensureStatusRowsForDate(cursor);
    const habits = repository.getHabitsWithStatus(cursor).filter(isDailyHabit);
    if (habits.length === 0) {
      rollingState.lastEvaluatedDate = cursor;
      cursor = clock.addDays(cursor, 1);
      continue;
    }

    const allCompleted =
      habits.length > 0 && habits.every((habit) => habit.completed);
    const completedAt = allCompleted
      ? (repository.getExistingCompletedAt(cursor) ?? `${cursor}T23:59:59.000`)
      : null;

    const next = settleClosedDay(
      createRollingStreakState(rollingState),
      allCompleted,
      completedAt
    );

    rollingState = {
      availableFreezes: next.availableFreezes,
      bestStreak: next.bestStreak,
      currentStreak: next.currentStreak,
      lastEvaluatedDate: cursor,
    };

    repository.saveDailySummary({
      allCompleted: next.allCompleted,
      completedAt: next.completedAt,
      date: cursor,
      freezeUsed: next.freezeUsed,
      streakCountAfterDay: next.currentStreak,
    });

    cursor = clock.addDays(cursor, 1);
  }

  repository.savePersistedStreakState(rollingState);
}
