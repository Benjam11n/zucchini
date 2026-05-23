import { createRollingStreakState } from "@/main/features/today/state-builder";
import type { AppRepository } from "@/main/ports/app-repository";
import type { PersistedCategoryStreakState } from "@/shared/domain/category-streak";
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
import { HABIT_CATEGORY_SLOTS, isDailyHabit } from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import { settleClosedDay } from "@/shared/domain/streak-engine";

const AUTO_RESCHEDULED_TIME = "T23:59:59.000";

interface StreakCounterState {
  bestStreak: number;
  currentStreak: number;
  lastEvaluatedDate: string | null;
}

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

function createEmptyCategoryStreakState(
  category: HabitCategory
): PersistedCategoryStreakState {
  return {
    bestStreak: 0,
    category,
    currentStreak: 0,
    lastEvaluatedDate: null,
  };
}

function getFirstUnevaluatedDate(
  dates: string[],
  clock: Clock,
  yesterday: string
): string | null {
  const [firstUnevaluatedDate] = dates
    .filter((date) => clock.compareDateKeys(date, yesterday) <= 0)
    .toSorted((left, right) => left.localeCompare(right));

  return firstUnevaluatedDate ?? null;
}

function getClosedDayStreakInputs(
  repository: AppRepository,
  cursor: string
): {
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  hasIncompleteCarryover: boolean;
} {
  repository.ensureStatusRowsForDate(cursor);
  const dayStatus = repository.getDayStatus(cursor)?.kind ?? null;
  const [summary] = repository.getDailySummariesInRange(cursor, cursor);

  return {
    dayStatus: summary ? summary.dayStatus : dayStatus,
    freezeUsed: summary?.freezeUsed ?? false,
    hasIncompleteCarryover: repository
      .getHabitCarryoversForDate(cursor)
      .some((carryover) => !carryover.completed),
  };
}

function applyClosedDayCarryoverPolicy({
  clock,
  cursor,
  dailyHabits,
  repository,
}: {
  clock: Clock;
  cursor: string;
  dailyHabits: HabitWithStatus[];
  repository: AppRepository;
}): DayStatusKind | null {
  const currentDayStatus = repository.getDayStatus(cursor)?.kind ?? null;
  if (currentDayStatus === "rest" || currentDayStatus === "sick") {
    return currentDayStatus;
  }

  const incomingCarryovers = repository.getHabitCarryoversForDate(cursor);
  const hasIncompleteIncomingCarryover = incomingCarryovers.some(
    (carryover) => !carryover.completed
  );
  const hasUnfinishedDailyHabit = dailyHabits.some((habit) => !habit.completed);
  if (!hasUnfinishedDailyHabit) {
    if (currentDayStatus === "rescheduled") {
      repository.clearDayStatus(cursor);
    }
    return null;
  }

  repository.createHabitCarryovers(
    cursor,
    clock.addDays(cursor, 1),
    `${cursor}${AUTO_RESCHEDULED_TIME}`
  );

  if (hasIncompleteIncomingCarryover) {
    if (currentDayStatus === "rescheduled") {
      repository.clearDayStatus(cursor);
    }
    return null;
  }

  repository.setDayStatus(
    cursor,
    "rescheduled",
    `${cursor}${AUTO_RESCHEDULED_TIME}`
  );
  return "rescheduled";
}

function getNextStreakCounterState<TState extends StreakCounterState>({
  cursor,
  isComplete,
  isNeutral,
  state,
}: {
  cursor: string;
  isComplete: boolean;
  isNeutral: boolean;
  state: TState;
}): TState {
  if (isNeutral) {
    return {
      ...state,
      lastEvaluatedDate: cursor,
    };
  }

  if (!isComplete) {
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

function getNextHabitStreakState({
  cursor,
  dayStatus,
  freezeUsed,
  hasIncompleteCarryover,
  habit,
  state,
}: {
  cursor: string;
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  hasIncompleteCarryover: boolean;
  habit: HabitWithStatus | null;
  state: PersistedHabitStreakState;
}): PersistedHabitStreakState {
  return getNextStreakCounterState({
    cursor,
    isComplete: Boolean(habit?.completed) && !hasIncompleteCarryover,
    isNeutral: Boolean(dayStatus || freezeUsed || !habit),
    state,
  });
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

  const firstUnevaluatedDate = getFirstUnevaluatedDate(
    dailyHabits.map((habit) => {
      const state = stateByHabitId.get(habit.id);
      return state?.lastEvaluatedDate
        ? clock.addDays(state.lastEvaluatedDate, 1)
        : firstTrackedDate;
    }),
    clock,
    yesterday
  );

  if (!firstUnevaluatedDate) {
    if (addedMissingState) {
      repository.savePersistedHabitStreakStates([...stateByHabitId.values()]);
    }
    return;
  }

  let cursor = firstUnevaluatedDate;

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    const { dayStatus, freezeUsed, hasIncompleteCarryover } =
      getClosedDayStreakInputs(repository, cursor);
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
          freezeUsed,
          habit: habitById.get(habit.id) ?? null,
          hasIncompleteCarryover,
          state: currentState,
        })
      );
    }

    cursor = clock.addDays(cursor, 1);
  }

  repository.savePersistedHabitStreakStates([...stateByHabitId.values()]);
}

function getNextCategoryStreakState({
  categoryHabits,
  cursor,
  dayStatus,
  freezeUsed,
  hasIncompleteCarryover,
  state,
}: {
  categoryHabits: Pick<HabitWithStatus, "category" | "completed">[];
  cursor: string;
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  hasIncompleteCarryover: boolean;
  state: PersistedCategoryStreakState;
}): PersistedCategoryStreakState {
  return getNextStreakCounterState({
    cursor,
    isComplete:
      categoryHabits.every((habit) => habit.completed) &&
      !hasIncompleteCarryover,
    isNeutral: Boolean(dayStatus || freezeUsed || categoryHabits.length === 0),
    state,
  });
}

function syncCategoryStreakStates(
  repository: AppRepository,
  clock: Clock,
  firstTrackedDate: string,
  yesterday: string
): void {
  const stateByCategory = new Map(
    repository
      .getPersistedCategoryStreakStates()
      .map((state) => [state.category, state])
  );
  let addedMissingState = false;

  for (const { value } of HABIT_CATEGORY_SLOTS) {
    if (stateByCategory.has(value)) {
      continue;
    }

    stateByCategory.set(value, createEmptyCategoryStreakState(value));
    addedMissingState = true;
  }

  const firstUnevaluatedDate = getFirstUnevaluatedDate(
    [...stateByCategory.values()].map((state) =>
      state.lastEvaluatedDate
        ? clock.addDays(state.lastEvaluatedDate, 1)
        : firstTrackedDate
    ),
    clock,
    yesterday
  );

  if (!firstUnevaluatedDate) {
    if (addedMissingState) {
      repository.savePersistedCategoryStreakStates([
        ...stateByCategory.values(),
      ]);
    }
    return;
  }

  let cursor = firstUnevaluatedDate;

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    const { dayStatus, freezeUsed, hasIncompleteCarryover } =
      getClosedDayStreakInputs(repository, cursor);
    const habitsByCategory = new Map<
      HabitCategory,
      Pick<HabitWithStatus, "category" | "completed">[]
    >();

    for (const habit of repository
      .getHistoricalHabitPeriodStatusesOverlappingRange(cursor, cursor)
      .filter(isDailyHabit)) {
      const categoryHabits = habitsByCategory.get(habit.category) ?? [];
      categoryHabits.push(habit);
      habitsByCategory.set(habit.category, categoryHabits);
    }

    for (const { value } of HABIT_CATEGORY_SLOTS) {
      const currentState =
        stateByCategory.get(value) ?? createEmptyCategoryStreakState(value);
      const nextDate = currentState.lastEvaluatedDate
        ? clock.addDays(currentState.lastEvaluatedDate, 1)
        : firstTrackedDate;

      if (clock.compareDateKeys(nextDate, cursor) > 0) {
        continue;
      }

      stateByCategory.set(
        value,
        getNextCategoryStreakState({
          categoryHabits: habitsByCategory.get(value) ?? [],
          cursor,
          dayStatus,
          freezeUsed,
          hasIncompleteCarryover,
          state: currentState,
        })
      );
    }

    cursor = clock.addDays(cursor, 1);
  }

  repository.savePersistedCategoryStreakStates([...stateByCategory.values()]);
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
    syncCategoryStreakStates(repository, clock, firstTrackedDate, yesterday);
    return;
  }

  let rollingState = createRollingStreakState(persisted);

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    repository.ensureStatusRowsForDate(cursor);
    const habits = repository.getHabitsWithStatus(cursor).filter(isDailyHabit);
    const incomingCarryovers = repository.getHabitCarryoversForDate(cursor);
    const hasIncompleteIncomingCarryover = incomingCarryovers.some(
      (carryover) => !carryover.completed
    );
    const allCompleted =
      habits.length > 0 &&
      habits.every((habit) => habit.completed) &&
      !hasIncompleteIncomingCarryover;
    const currentDayStatus = applyClosedDayCarryoverPolicy({
      clock,
      cursor,
      dailyHabits: habits,
      repository,
    });

    if (
      habits.length === 0 &&
      !hasIncompleteIncomingCarryover &&
      !currentDayStatus
    ) {
      rollingState.lastEvaluatedDate = cursor;
      cursor = clock.addDays(cursor, 1);
      continue;
    }

    const completedAt = allCompleted
      ? (repository.getExistingCompletedAt(cursor) ?? `${cursor}T23:59:59.000`)
      : null;

    const next = settleClosedDay(createRollingStreakState(rollingState), {
      allCompleted,
      completedAt,
      dayStatus: currentDayStatus,
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
  syncCategoryStreakStates(repository, clock, firstTrackedDate, yesterday);
}
