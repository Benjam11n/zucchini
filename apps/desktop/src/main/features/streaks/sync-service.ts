import { createRollingStreakState } from "@/main/features/today/state-builder";
import type { AppRepository } from "@/main/ports/app-repository";
/**
 * Rolling streak synchronization service.
 *
 * Catches up streak evaluation from the last persisted checkpoint to
 * yesterday. For each unprocessed day, it settles the streak outcome
 * (complete, missed, or freeze) and writes a daily summary row.
 * This runs on every read path so the streak is always current.
 */
import type { Clock } from "@/shared/domain/clock";
import type { DayStatusKind } from "@/shared/domain/day-status";
import { isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import { settleClosedDay } from "@/shared/domain/streak-engine";

function createEmptyHabitStreakState(
  habitId: number
): PersistedHabitStreakState {
  return {
    bestStreak: 0,
    currentStreak: 0,
    habitId,
    lastEvaluatedDate: null,
  };
}

function getNextHabitStreakState({
  cursor,
  dayStatus,
  freezeUsed,
  habit,
  state,
}: {
  cursor: string;
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  habit: HabitWithStatus | null;
  state: PersistedHabitStreakState;
}): PersistedHabitStreakState {
  if (dayStatus || freezeUsed || !habit) {
    return {
      ...state,
      lastEvaluatedDate: cursor,
    };
  }

  if (!habit.completed) {
    return {
      ...state,
      currentStreak: 0,
      lastEvaluatedDate: cursor,
    };
  }

  const currentStreak = state.currentStreak + 1;

  return {
    ...state,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    currentStreak,
    lastEvaluatedDate: cursor,
  };
}

function syncHabitStreakStates(
  repository: AppRepository,
  clock: Clock,
  firstTrackedDate: string,
  yesterday: string
): void {
  const dailyHabits = repository.getHabits().filter(isDailyHabit);
  const habitIds = dailyHabits.map((habit) => habit.id);
  if (habitIds.length === 0) {
    return;
  }

  const persistedStates = repository.getPersistedHabitStreakStates(habitIds);
  const shouldBackfillMissingStates = persistedStates.length === 0;
  const stateByHabitId = new Map(
    persistedStates.map((state) => [state.habitId, state])
  );
  let addedMissingState = false;

  for (const habitId of habitIds) {
    if (stateByHabitId.has(habitId)) {
      continue;
    }

    stateByHabitId.set(habitId, {
      ...createEmptyHabitStreakState(habitId),
      lastEvaluatedDate: shouldBackfillMissingStates ? null : yesterday,
    });
    addedMissingState = true;
  }

  const firstUnevaluatedDates = dailyHabits
    .map((habit) => {
      const state = stateByHabitId.get(habit.id);
      return state?.lastEvaluatedDate
        ? clock.addDays(state.lastEvaluatedDate, 1)
        : firstTrackedDate;
    })
    .filter((date) => clock.compareDateKeys(date, yesterday) <= 0);

  const [firstUnevaluatedDate] = firstUnevaluatedDates.toSorted((left, right) =>
    left.localeCompare(right)
  );
  if (!firstUnevaluatedDate) {
    if (addedMissingState) {
      repository.savePersistedHabitStreakStates([...stateByHabitId.values()]);
    }
    return;
  }

  let cursor = firstUnevaluatedDate;

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    repository.ensureStatusRowsForDate(cursor);
    const dayStatus = repository.getDayStatus(cursor)?.kind ?? null;
    const [summary] = repository.getDailySummariesInRange(cursor, cursor);
    const habitById = new Map(
      repository
        .getHabitsWithStatus(cursor)
        .filter(isDailyHabit)
        .map((habit) => [habit.id, habit])
    );

    for (const habit of dailyHabits) {
      const currentState =
        stateByHabitId.get(habit.id) ?? createEmptyHabitStreakState(habit.id);
      const nextDate = currentState.lastEvaluatedDate
        ? clock.addDays(currentState.lastEvaluatedDate, 1)
        : firstTrackedDate;

      if (clock.compareDateKeys(nextDate, cursor) > 0) {
        continue;
      }

      stateByHabitId.set(
        habit.id,
        getNextHabitStreakState({
          cursor,
          dayStatus,
          freezeUsed: summary?.freezeUsed ?? false,
          habit: habitById.get(habit.id) ?? null,
          state: currentState,
        })
      );
    }

    cursor = clock.addDays(cursor, 1);
  }

  repository.savePersistedHabitStreakStates([...stateByHabitId.values()]);
}

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
    syncHabitStreakStates(repository, clock, firstTrackedDate, yesterday);
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
    const currentDayStatus = repository.getDayStatus(cursor);

    const next = settleClosedDay(createRollingStreakState(rollingState), {
      allCompleted,
      completedAt,
      dayStatus: currentDayStatus?.kind ?? null,
    });

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
      dayStatus: next.dayStatus,
      freezeUsed: next.freezeUsed,
      streakCountAfterDay: next.currentStreak,
    });

    cursor = clock.addDays(cursor, 1);
  }

  repository.savePersistedStreakState(rollingState);
  syncHabitStreakStates(repository, clock, firstTrackedDate, yesterday);
}
