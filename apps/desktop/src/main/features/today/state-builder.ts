import type { TodayReadModelRepositoryPort } from "@/main/ports/app-repository";
import type { TodayState } from "@/shared/contracts/today-state";
import type { CategoryStreak } from "@/shared/domain/category-streak";
/**
 * Today state builder — assembles the read-model the renderer consumes.
 *
 * Pure functions that query the repository and compose the {@link TodayState},
 * {@link HistoryDay}, and streak preview objects. Called on every read path
 * after streak synchronization.
 */
import type { Clock } from "@/shared/domain/clock";
import type { DayStatusKind } from "@/shared/domain/day-status";
import { toFocusMinutes } from "@/shared/domain/focus-session";
import {
  HABIT_CATEGORY_SLOTS,
  getHabitCategoryProgress,
  isDailyHabit,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";
import type { HabitStreak } from "@/shared/domain/habit-streak";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import { previewOpenDay } from "@/shared/domain/streak-engine";
import { buildEmptyWindDownState } from "@/shared/domain/wind-down";
import { addDays } from "@/shared/utils/date";

function mapStatusToHabit(status: {
  category: HabitWithStatus["category"];
  completed: boolean;
  completedCount?: number;
  createdAt?: string;
  frequency: HabitWithStatus["frequency"];
  habitId: number;
  name: string;
  periodStart: string;
  selectedWeekdays?: HabitWithStatus["selectedWeekdays"];
  sortOrder: number;
  targetCount?: number;
}): HabitWithStatus {
  return {
    category: status.category,
    completed: status.completed,
    completedCount: status.completedCount ?? 0,
    createdAt: status.createdAt ?? status.periodStart,
    frequency: status.frequency,
    id: status.habitId,
    isArchived: false,
    name: status.name,
    selectedWeekdays: status.selectedWeekdays ?? null,
    sortOrder: status.sortOrder,
    targetCount: status.targetCount ?? 1,
  };
}

export function buildHistoricalHabitsByDate(
  summaries: DailySummary[],
  statuses: ReturnType<
    TodayReadModelRepositoryPort["getHistoricalHabitPeriodStatusesOverlappingRange"]
  >
): Map<string, HabitWithStatus[]> {
  const habitsByDate = new Map<string, HabitWithStatus[]>();
  const sortedSummaries = [...summaries].toSorted((left, right) =>
    left.date.localeCompare(right.date)
  );
  const firstDate = sortedSummaries[0]?.date;
  const lastDate = sortedSummaries.at(-1)?.date;

  if (!firstDate || !lastDate) {
    return habitsByDate;
  }

  for (const status of statuses) {
    for (
      let date =
        status.periodStart < firstDate ? firstDate : status.periodStart;
      date <= status.periodEnd && date <= lastDate;
      date = addDays(date, 1)
    ) {
      const dayHabits = habitsByDate.get(date) ?? [];
      dayHabits.push(mapStatusToHabit(status));
      habitsByDate.set(date, dayHabits);
    }
  }

  for (const [date, habits] of habitsByDate) {
    habitsByDate.set(
      date,
      habits.toSorted(
        (left, right) => left.sortOrder - right.sortOrder || left.id - right.id
      )
    );
  }

  return habitsByDate;
}

function buildTodayHabitStreaksFromHabits(
  repository: TodayReadModelRepositoryPort,
  habits: HabitWithStatus[],
  dayStatus: DayStatusKind | null
): Record<number, HabitStreak> {
  const dailyHabits = habits.filter(isDailyHabit);
  const persistedStateByHabitId = new Map(
    repository
      .getPersistedHabitStreakStates(dailyHabits.map((habit) => habit.id))
      .map((state) => [state.habitId, state])
  );
  const habitStreaks: Record<number, HabitStreak> = {};

  for (const habit of dailyHabits) {
    const persistedState = persistedStateByHabitId.get(habit.id);
    const settledCurrentStreak = persistedState?.currentStreak ?? 0;
    const currentStreak =
      !dayStatus && habit.completed
        ? settledCurrentStreak + 1
        : settledCurrentStreak;

    habitStreaks[habit.id] = dayStatus
      ? {
          bestStreak: persistedState?.bestStreak ?? 0,
          currentStreak,
        }
      : {
          bestStreak: Math.max(persistedState?.bestStreak ?? 0, currentStreak),
          currentStreak,
        };
  }

  return habitStreaks;
}

function buildTodayCategoryStreaksFromHabits(
  repository: TodayReadModelRepositoryPort,
  habits: HabitWithStatus[],
  dayStatus: DayStatusKind | null
): Record<HabitCategory, CategoryStreak> {
  const persistedStateByCategory = new Map(
    repository
      .getPersistedCategoryStreakStates()
      .map((state) => [state.category, state])
  );
  const dailyHabits = habits.filter(isDailyHabit);
  const streaks = {} as Record<HabitCategory, CategoryStreak>;

  for (const { value } of HABIT_CATEGORY_SLOTS) {
    const persistedState = persistedStateByCategory.get(value);
    const categoryHabits = dailyHabits.filter(
      (habit) => habit.category === value
    );
    const settledCurrentStreak = persistedState?.currentStreak ?? 0;
    const currentStreak =
      !dayStatus &&
      categoryHabits.length > 0 &&
      categoryHabits.every((habit) => habit.completed)
        ? settledCurrentStreak + 1
        : settledCurrentStreak;

    streaks[value] = {
      bestStreak: Math.max(persistedState?.bestStreak ?? 0, currentStreak),
      category: value,
      currentStreak,
    };
  }

  return streaks;
}

export function buildTodayState(
  repository: TodayReadModelRepositoryPort,
  clock: Clock
): TodayState {
  const today = clock.todayKey();
  repository.ensureStatusRowsForDate(today);

  const habits = repository.getHabitsWithStatus(today);
  const currentDayStatus = repository.getDayStatus(today);
  const dailyHabits = habits.filter(isDailyHabit);
  const settledStreak = repository.getPersistedStreakState();
  const preview = previewOpenDay(
    settledStreak,
    dailyHabits.length > 0 && dailyHabits.every((habit) => habit.completed),
    currentDayStatus?.kind ?? null
  );

  const focusSessions = repository.getFocusSessionsInRange(today, today);
  const focusMinutes = toFocusMinutes(
    focusSessions.reduce((total, session) => total + session.durationSeconds, 0)
  );
  repository.ensureWindDownStatusRowsForDate(today);
  const windDownActions = repository.getWindDownActionsWithStatus(today);
  return {
    categoryStreaks: buildTodayCategoryStreaksFromHabits(
      repository,
      habits,
      currentDayStatus?.kind ?? null
    ),
    date: today,
    dayStatus: currentDayStatus?.kind ?? null,
    focusMinutes,
    focusQuotaGoals: repository.getFocusQuotaGoalsWithStatusForDate(today),
    habitCarryovers: repository.getHabitCarryoversForDate(today),
    habitStreaks: buildTodayHabitStreaksFromHabits(
      repository,
      habits,
      currentDayStatus?.kind ?? null
    ),
    habits,
    settings: repository.getSettings(clock.timezone()),
    streak: {
      availableFreezes: preview.availableFreezes,
      bestStreak: preview.bestStreak,
      currentStreak: preview.currentStreak,
      lastEvaluatedDate: settledStreak.lastEvaluatedDate,
    },
    windDown:
      windDownActions.length === 0
        ? buildEmptyWindDownState(today)
        : {
            actions: windDownActions,
            completedCount: windDownActions.filter((action) => action.completed)
              .length,
            date: today,
            isComplete: windDownActions.every((action) => action.completed),
            totalCount: windDownActions.length,
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
    dayStatus: todayState.dayStatus,
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

export function buildHistorySummaryDay(
  historyDay: Pick<
    HistoryDay,
    "categoryProgress" | "date" | "focusMinutes" | "summary"
  >
): HistorySummaryDay {
  return {
    categoryProgress: historyDay.categoryProgress,
    date: historyDay.date,
    focusMinutes: historyDay.focusMinutes,
    summary: historyDay.summary,
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
