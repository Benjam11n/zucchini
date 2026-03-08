import type { ReminderRuntimeState } from "@/main/reminder-runtime-state";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import { runMigrations } from "../db/migrations";
import { SqliteDatabaseClient } from "../db/sqlite-client";
import { SqliteHabitsRepository } from "./habit-repository";
import { SqliteHistoryRepository } from "./history-repository";
import { SqliteReminderRuntimeStateRepository } from "./reminder-runtime-state-repository";
import { SqliteSettingsRepository } from "./settings-repository";
import { SqliteStreakRepository } from "./streak-repository";
import type { HabitPeriodStatusSnapshot } from "./types";

export interface HabitRepository {
  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(nowIso: string, timezone: string): void;
  getHabits(): Habit[];
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[];
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  toggleHabit(date: string, habitId: number): void;
  getSettledHistory(limit?: number): DailySummary[];
  getDailySummariesInRange(start: string, end: string): DailySummary[];
  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[];
  getPersistedStreakState(): StreakState;
  savePersistedStreakState(state: StreakState): void;
  getReminderRuntimeState(): ReminderRuntimeState;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  getSettings(defaultTimezone: string): AppSettings;
  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings;
  getFirstTrackedDate(): string | null;
  getLatestTrackedDate(): string | null;
  getExistingCompletedAt(date: string): string | null;
  saveDailySummary(summary: DailySummary): void;
  getMaxSortOrder(): number;
  insertHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    sortOrder: number,
    createdAt: string
  ): number;
  renameHabit(habitId: number, name: string): void;
  updateHabitCategory(habitId: number, category: HabitCategory): void;
  updateHabitFrequency(habitId: number, frequency: HabitFrequency): void;
  archiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}

export class SqliteHabitRepository implements HabitRepository {
  private readonly client = new SqliteDatabaseClient();
  private readonly habitsRepository = new SqliteHabitsRepository(this.client);
  private readonly historyRepository = new SqliteHistoryRepository(
    this.client,
    this.habitsRepository
  );
  private readonly settingsRepository = new SqliteSettingsRepository(
    this.client
  );
  private readonly reminderRuntimeStateRepository =
    new SqliteReminderRuntimeStateRepository(this.client);
  private readonly streakRepository = new SqliteStreakRepository(this.client);

  initializeSchema(): void {
    runMigrations(this.client);
  }

  runInTransaction<A>(label: string, execute: () => A): A {
    return this.client.transaction(label, execute);
  }

  seedDefaults(nowIso: string, timezone: string): void {
    if (this.habitsRepository.countActiveHabits() === 0) {
      this.habitsRepository.insertHabit(
        "Eat a whole food meal",
        "nutrition",
        "daily",
        0,
        nowIso
      );
      this.habitsRepository.insertHabit(
        "Deep work block",
        "productivity",
        "daily",
        1,
        nowIso
      );
      this.habitsRepository.insertHabit(
        "Move for 20 minutes",
        "fitness",
        "daily",
        2,
        nowIso
      );
    }

    this.streakRepository.ensureInitialized();
    this.settingsRepository.seedDefaults(timezone);
  }

  getHabits(): Habit[] {
    return this.habitsRepository.getHabits();
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.historyRepository.getHabitsWithStatus(date);
  }

  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.historyRepository.getHistoricalHabitsWithStatus(date);
  }

  ensureStatusRowsForDate(date: string): void {
    this.historyRepository.ensureStatusRowsForDate(date);
  }

  ensureStatusRow(date: string, habitId: number): void {
    this.historyRepository.ensureStatusRow(date, habitId);
  }

  toggleHabit(date: string, habitId: number): void {
    this.historyRepository.toggleHabit(date, habitId);
  }

  getSettledHistory(limit?: number): DailySummary[] {
    return this.historyRepository.getSettledHistory(limit);
  }

  getDailySummariesInRange(start: string, end: string): DailySummary[] {
    return this.historyRepository.getDailySummariesInRange(start, end);
  }

  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return this.historyRepository.getHabitPeriodStatusesEndingInRange(
      start,
      end
    );
  }

  getPersistedStreakState(): StreakState {
    return this.streakRepository.getPersistedStreakState();
  }

  savePersistedStreakState(state: StreakState): void {
    this.streakRepository.savePersistedStreakState(state);
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.reminderRuntimeStateRepository.getState();
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.reminderRuntimeStateRepository.saveState(state);
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.settingsRepository.getSettings(defaultTimezone);
  }

  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings {
    return this.settingsRepository.saveSettings(settings, defaultTimezone);
  }

  getFirstTrackedDate(): string | null {
    return this.historyRepository.getFirstTrackedDate();
  }

  getLatestTrackedDate(): string | null {
    return this.historyRepository.getLatestTrackedDate();
  }

  getExistingCompletedAt(date: string): string | null {
    return this.historyRepository.getExistingCompletedAt(date);
  }

  saveDailySummary(summary: DailySummary): void {
    this.historyRepository.saveDailySummary(summary);
  }

  getMaxSortOrder(): number {
    return this.habitsRepository.getMaxSortOrder();
  }

  insertHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.habitsRepository.insertHabit(
      name,
      category,
      frequency,
      sortOrder,
      createdAt
    );
  }

  renameHabit(habitId: number, name: string): void {
    this.habitsRepository.renameHabit(habitId, name);
  }

  updateHabitCategory(habitId: number, category: HabitCategory): void {
    this.habitsRepository.updateHabitCategory(habitId, category);
  }

  updateHabitFrequency(habitId: number, frequency: HabitFrequency): void {
    this.habitsRepository.updateHabitFrequency(habitId, frequency);
  }

  archiveHabit(habitId: number): void {
    this.habitsRepository.archiveHabit(habitId);
  }

  normalizeHabitOrder(): void {
    this.habitsRepository.normalizeHabitOrder();
  }

  reorderHabits(habitIds: number[]): void {
    this.habitsRepository.reorderHabits(habitIds);
  }
}
