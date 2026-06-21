import { createRollingStreakState } from "@/main/features/today/state-builder";
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
import type {
  Habit,
  HabitCategory,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import { settleClosedDay } from "@/shared/domain/streak-engine";

interface StreakSyncRepository {
  habits: {
    getHabits(): Habit[];
  };
  history: {
    clearDayStatus(date: string): void;
    createHabitCarryovers(
      sourceDate: string,
      targetDate: string,
      createdAt: string
    ): void;
    ensureStatusRowsForDate(date: string): void;
    getDailySummariesInRange(
      start: string,
      end: string
    ): {
      dayStatus: DayStatusKind | null;
      freezeUsed: boolean;
    }[];
    getDayStatus(date: string): { kind: DayStatusKind } | null;
    getExistingCompletedAt(date: string): string | null;
    getFirstTrackedDate(): string | null;
    getHabitCarryoversForDate(date: string): {
      category: HabitCategory;
      completed: boolean;
      id: number;
    }[];
    getHabitsWithStatus(date: string): HabitWithStatus[];
    getHistoricalHabitPeriodStatusesOverlappingRange(
      start: string,
      end: string
    ): HabitPeriodStatusSnapshot[];
    saveDailySummary(summary: {
      allCompleted: boolean;
      completedAt: string | null;
      date: string;
      dayStatus: DayStatusKind | null;
      freezeUsed: boolean;
      streakCountAfterDay: number;
    }): void;
    setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void;
  };
  streaks: {
    getPersistedCategoryStreakStates(): PersistedCategoryStreakState[];
    getPersistedHabitStreakStates(
      habitIds: readonly number[]
    ): PersistedHabitStreakState[];
    getPersistedStreakState(): {
      availableFreezes: number;
      bestStreak: number;
      currentStreak: number;
      lastEvaluatedDate: string | null;
    };
    savePersistedCategoryStreakStates(
      states: readonly PersistedCategoryStreakState[]
    ): void;
    savePersistedHabitStreakStates(
      states: readonly PersistedHabitStreakState[]
    ): void;
    savePersistedStreakState(state: {
      availableFreezes: number;
      bestStreak: number;
      currentStreak: number;
      lastEvaluatedDate: string | null;
    }): void;
  };
}

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
  repository: StreakSyncRepository,
  cursor: string
): {
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  hasIncompleteCarryover: boolean;
} {
  repository.history.ensureStatusRowsForDate(cursor);
  const dayStatus = repository.history.getDayStatus(cursor)?.kind ?? null;
  const [summary] = repository.history.getDailySummariesInRange(cursor, cursor);

  return {
    dayStatus: summary ? summary.dayStatus : dayStatus,
    freezeUsed: summary?.freezeUsed ?? false,
    hasIncompleteCarryover: repository.history
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
  repository: StreakSyncRepository;
}): DayStatusKind | null {
  const currentDayStatus =
    repository.history.getDayStatus(cursor)?.kind ?? null;
  if (currentDayStatus === "rest" || currentDayStatus === "sick") {
    return currentDayStatus;
  }

  const incomingCarryovers =
    repository.history.getHabitCarryoversForDate(cursor);
  const hasIncompleteIncomingCarryover = incomingCarryovers.some(
    (carryover) => !carryover.completed
  );
  const hasUnfinishedDailyHabit = dailyHabits.some((habit) => !habit.completed);
  if (!hasUnfinishedDailyHabit) {
    if (currentDayStatus === "rescheduled") {
      repository.history.clearDayStatus(cursor);
    }
    return null;
  }

  repository.history.createHabitCarryovers(
    cursor,
    clock.addDays(cursor, 1),
    `${cursor}${AUTO_RESCHEDULED_TIME}`
  );

  if (hasIncompleteIncomingCarryover) {
    if (currentDayStatus === "rescheduled") {
      repository.history.clearDayStatus(cursor);
    }
    return null;
  }

  repository.history.setDayStatus(
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
  hasIncompleteHabitCarryover,
  habit,
  state,
}: {
  cursor: string;
  dayStatus: DayStatusKind | null;
  freezeUsed: boolean;
  hasIncompleteHabitCarryover: boolean;
  habit: HabitWithStatus | null;
  state: PersistedHabitStreakState;
}): PersistedHabitStreakState {
  const hasBlockingCarryover =
    hasIncompleteHabitCarryover && state.currentStreak > 0;

  return getNextStreakCounterState({
    cursor,
    isComplete: Boolean(habit?.completed) && !hasBlockingCarryover,
    isNeutral: Boolean(dayStatus || freezeUsed || !habit),
    state,
  });
}

function syncHabitStreakStates(
  repository: StreakSyncRepository,
  clock: Clock,
  firstTrackedDate: string,
  yesterday: string
): void {
  const dailyHabits = repository.habits.getHabits().filter(isDailyHabit);
  const habitIds = dailyHabits.map((habit) => habit.id);
  if (habitIds.length === 0) {
    return;
  }

  const persistedStates =
    repository.streaks.getPersistedHabitStreakStates(habitIds);
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
      repository.streaks.savePersistedHabitStreakStates([
        ...stateByHabitId.values(),
      ]);
    }
    return;
  }

  let cursor = firstUnevaluatedDate;

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    const { dayStatus, freezeUsed } = getClosedDayStreakInputs(
      repository,
      cursor
    );
    const habitIdsWithIncompleteCarryovers = new Set<number>();
    for (const carryover of repository.history.getHabitCarryoversForDate(
      cursor
    )) {
      if (!carryover.completed) {
        habitIdsWithIncompleteCarryovers.add(carryover.id);
      }
    }

    const habitById = new Map<number, HabitWithStatus>();
    for (const habit of repository.history.getHabitsWithStatus(cursor)) {
      if (isDailyHabit(habit)) {
        habitById.set(habit.id, habit);
      }
    }

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
          hasIncompleteHabitCarryover: habitIdsWithIncompleteCarryovers.has(
            habit.id
          ),
          state: currentState,
        })
      );
    }

    cursor = clock.addDays(cursor, 1);
  }

  repository.streaks.savePersistedHabitStreakStates([
    ...stateByHabitId.values(),
  ]);
}

function getNextCategoryStreakState({
  categoryHabits,
  cursor,
  dayStatus,
  hasIncompleteCategoryCarryover,
  state,
}: {
  categoryHabits: Pick<HabitWithStatus, "category" | "completed">[];
  cursor: string;
  dayStatus: DayStatusKind | null;
  hasIncompleteCategoryCarryover: boolean;
  state: PersistedCategoryStreakState;
}): PersistedCategoryStreakState {
  const isRestorativeDay = dayStatus === "rest" || dayStatus === "sick";
  const hasBlockingCarryover =
    hasIncompleteCategoryCarryover && state.currentStreak > 0;
  const isCategoryComplete =
    categoryHabits.every((habit) => habit.completed) && !hasBlockingCarryover;

  return getNextStreakCounterState({
    cursor,
    isComplete: isCategoryComplete,
    isNeutral:
      isRestorativeDay ||
      categoryHabits.length === 0 ||
      (dayStatus === "rescheduled" && !isCategoryComplete),
    state,
  });
}

function syncCategoryStreakStates(
  repository: StreakSyncRepository,
  clock: Clock,
  firstTrackedDate: string,
  yesterday: string
): void {
  const stateByCategory = new Map(
    repository.streaks
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
      repository.streaks.savePersistedCategoryStreakStates([
        ...stateByCategory.values(),
      ]);
    }
    return;
  }

  let cursor = firstUnevaluatedDate;

  while (clock.compareDateKeys(cursor, yesterday) <= 0) {
    const { dayStatus } = getClosedDayStreakInputs(repository, cursor);
    const habitsByCategory = new Map<
      HabitCategory,
      Pick<HabitWithStatus, "category" | "completed">[]
    >();
    const hasIncompleteCarryoverByCategory = new Set<HabitCategory>();

    for (const carryover of repository.history.getHabitCarryoversForDate(
      cursor
    )) {
      if (!carryover.completed) {
        hasIncompleteCarryoverByCategory.add(carryover.category);
      }
    }

    for (const habit of repository.history
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
          hasIncompleteCategoryCarryover:
            hasIncompleteCarryoverByCategory.has(value),
          state: currentState,
        })
      );
    }

    cursor = clock.addDays(cursor, 1);
  }

  repository.streaks.savePersistedCategoryStreakStates([
    ...stateByCategory.values(),
  ]);
}

export function syncRollingState(
  repository: StreakSyncRepository,
  clock: Clock
): void {
  const today = clock.todayKey();
  repository.history.ensureStatusRowsForDate(today);

  const persisted = repository.streaks.getPersistedStreakState();
  const yesterday = clock.addDays(today, -1);
  const firstTrackedDate = repository.history.getFirstTrackedDate();

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
    repository.history.ensureStatusRowsForDate(cursor);
    const habits = repository.history
      .getHabitsWithStatus(cursor)
      .filter(isDailyHabit);
    const incomingCarryovers =
      repository.history.getHabitCarryoversForDate(cursor);
    const hasIncompleteIncomingCarryover = incomingCarryovers.some(
      (carryover) => !carryover.completed
    );
    const allCompleted =
      habits.length > 0 &&
      habits.every((habit) => habit.completed) &&
      (!hasIncompleteIncomingCarryover || rollingState.currentStreak === 0);
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
      ? (repository.history.getExistingCompletedAt(cursor) ??
        `${cursor}T23:59:59.000`)
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

    repository.history.saveDailySummary({
      allCompleted: next.allCompleted,
      completedAt: next.completedAt,
      date: cursor,
      dayStatus: next.dayStatus,
      freezeUsed: next.freezeUsed,
      streakCountAfterDay: next.currentStreak,
    });

    cursor = clock.addDays(cursor, 1);
  }

  repository.streaks.savePersistedStreakState(rollingState);
  syncHabitStreakStates(repository, clock, firstTrackedDate, yesterday);
  syncCategoryStreakStates(repository, clock, firstTrackedDate, yesterday);
}
