import {
  getHabitCategoryProgress,
  normalizeHabitCategory,
} from "../shared/domain/habit";
import type {
  HabitCategory,
  HabitWithStatus,
} from "../shared/domain/habit";
import type { HistoryDay } from "../shared/domain/history";
import type { AppSettings } from "../shared/domain/settings";
import type { DailySummary, StreakState } from "../shared/domain/streak";
import {
  previewOpenDay,
  settleClosedDay,
} from "../shared/domain/streak-engine";
import type { TodayState } from "../shared/types/ipc";
import type { Clock } from "./clock";
import type { HabitRepository } from "./repository";

export interface HabitsService {
  initialize(): void;
  getTodayState(): TodayState;
  toggleHabit(habitId: number): TodayState;
  getHistory(): HistoryDay[];
  updateSettings(settings: AppSettings): AppSettings;
  createHabit(name: string, category: HabitCategory): TodayState;
  renameHabit(habitId: number, name: string): TodayState;
  updateHabitCategory(habitId: number, category: HabitCategory): TodayState;
  archiveHabit(habitId: number): TodayState;
  reorderHabits(habitIds: number[]): TodayState;
}

export class HabitService implements HabitsService {
  private readonly repository: HabitRepository;
  private readonly clock: Clock;

  constructor(repository: HabitRepository, clock: Clock) {
    this.repository = repository;
    this.clock = clock;
  }

  initialize(): void {
    this.repository.initializeSchema();
    this.repository.seedDefaults(
      this.clock.now().toISOString(),
      this.clock.timezone()
    );
    this.syncRollingState();
  }

  getTodayState(): TodayState {
    this.syncRollingState();
    return this.buildTodayState();
  }

  toggleHabit(habitId: number): TodayState {
    const today = this.clock.todayKey();
    this.syncRollingState();
    this.repository.ensureStatusRowsForDate(today);
    this.repository.toggleHabit(today, habitId);
    return this.buildTodayState();
  }

  getHistory(): HistoryDay[] {
    this.syncRollingState();
    return [
      this.buildHistoryDay(
        this.getTodayPreviewSummary(),
        this.repository.getHabitsWithStatus(this.clock.todayKey())
      ),
      ...this.repository
        .getSettledHistory()
        .map((summary) =>
          this.buildHistoryDay(
            summary,
            this.repository.getHistoricalHabitsWithStatus(summary.date)
          )
        ),
    ];
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.repository.saveSettings(settings, this.clock.timezone());
  }

  createHabit(name: string, category: HabitCategory): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    const today = this.clock.todayKey();
    this.syncRollingState();
    const habitId = this.repository.insertHabit(
      trimmedName,
      normalizeHabitCategory(category),
      this.repository.getMaxSortOrder() + 1,
      this.clock.now().toISOString()
    );
    this.repository.ensureStatusRow(today, habitId);
    return this.buildTodayState();
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    this.repository.renameHabit(habitId, trimmedName);
    return this.buildTodayState();
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    this.repository.updateHabitCategory(
      habitId,
      normalizeHabitCategory(category)
    );
    return this.buildTodayState();
  }

  archiveHabit(habitId: number): TodayState {
    this.repository.archiveHabit(habitId);
    this.repository.normalizeHabitOrder();
    this.syncRollingState();
    return this.buildTodayState();
  }

  reorderHabits(habitIds: number[]): TodayState {
    const activeHabits = this.repository.getHabits();
    if (habitIds.length !== activeHabits.length) {
      return this.buildTodayState();
    }

    this.repository.reorderHabits(habitIds);
    return this.buildTodayState();
  }

  private buildTodayState(): TodayState {
    const today = this.clock.todayKey();
    this.repository.ensureStatusRowsForDate(today);

    const habits = this.repository.getHabitsWithStatus(today);
    const settledStreak = this.repository.getPersistedStreakState();
    const preview = previewOpenDay(
      settledStreak,
      habits.length > 0 && habits.every((habit) => habit.completed)
    );

    return {
      date: today,
      habits,
      settings: this.repository.getSettings(this.clock.timezone()),
      streak: {
        availableFreezes: preview.availableFreezes,
        bestStreak: preview.bestStreak,
        currentStreak: preview.currentStreak,
        lastEvaluatedDate: settledStreak.lastEvaluatedDate,
      },
    };
  }

  private getTodayPreviewSummary(): DailySummary {
    const todayState = this.buildTodayState();
    const allCompleted =
      todayState.habits.length > 0 &&
      todayState.habits.every((habit) => habit.completed);

    return {
      allCompleted,
      completedAt: allCompleted ? this.clock.now().toISOString() : null,
      date: todayState.date,
      freezeUsed: false,
      streakCountAfterDay: todayState.streak.currentStreak,
    };
  }

  private buildHistoryDay(
    summary: DailySummary,
    habits: HabitWithStatus[]
  ): HistoryDay {
    return {
      categoryProgress: getHabitCategoryProgress(habits),
      date: summary.date,
      habits,
      summary,
    };
  }

  private syncRollingState(): void {
    const today = this.clock.todayKey();
    this.repository.ensureStatusRowsForDate(today);

    const persisted = this.repository.getPersistedStreakState();
    const yesterday = this.clock.addDays(today, -1);
    const firstTrackedDate = this.repository.getFirstTrackedDate();

    if (!firstTrackedDate) {
      return;
    }

    let cursor = persisted.lastEvaluatedDate
      ? this.clock.addDays(persisted.lastEvaluatedDate, 1)
      : firstTrackedDate;

    if (this.clock.compareDateKeys(cursor, yesterday) > 0) {
      return;
    }

    let rollingState: StreakState = { ...persisted };

    while (this.clock.compareDateKeys(cursor, yesterday) <= 0) {
      this.repository.ensureStatusRowsForDate(cursor);
      const habits = this.repository.getHabitsWithStatus(cursor);
      const allCompleted =
        habits.length > 0 && habits.every((habit) => habit.completed);
      const completedAt = allCompleted
        ? (this.repository.getExistingCompletedAt(cursor) ??
          `${cursor}T23:59:59.000`)
        : null;

      const next = settleClosedDay(
        {
          availableFreezes: rollingState.availableFreezes,
          bestStreak: rollingState.bestStreak,
          currentStreak: rollingState.currentStreak,
        },
        allCompleted,
        completedAt
      );

      rollingState = {
        availableFreezes: next.availableFreezes,
        bestStreak: next.bestStreak,
        currentStreak: next.currentStreak,
        lastEvaluatedDate: cursor,
      };

      this.repository.saveDailySummary({
        allCompleted: next.allCompleted,
        completedAt: next.completedAt,
        date: cursor,
        freezeUsed: next.freezeUsed,
        streakCountAfterDay: next.currentStreak,
      });

      cursor = this.clock.addDays(cursor, 1);
    }

    this.repository.savePersistedStreakState(rollingState);
  }
}
