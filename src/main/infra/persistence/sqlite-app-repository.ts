import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import { runMigrations } from "../db/migrations";
import { SqliteDatabaseClient } from "../db/sqlite-client";
import type { AppRepository, SettledHistoryOptions } from "./app-repository";
import { SqliteFocusSessionRepository } from "./focus-session-repository";
import { SqliteHabitsRepository } from "./habit-repository";
import { SqliteHistoryRepository } from "./history-repository";
import { SqliteReminderRuntimeStateRepository } from "./reminder-runtime-state-repository";
import { SqliteSettingsRepository } from "./settings-repository";
import { SqliteStreakRepository } from "./streak-repository";
import type { HabitPeriodStatusSnapshot } from "./types";

export interface SqliteAppRepositoryOptions {
  databasePath?: string;
}

export class SqliteAppRepository implements AppRepository {
  private readonly client: SqliteDatabaseClient;
  private readonly habitsRepository: SqliteHabitsRepository;
  private readonly historyRepository: SqliteHistoryRepository;
  private readonly focusSessionRepository: SqliteFocusSessionRepository;
  private readonly settingsRepository: SqliteSettingsRepository;
  private readonly reminderRuntimeStateRepository: SqliteReminderRuntimeStateRepository;
  private readonly streakRepository: SqliteStreakRepository;

  constructor(options: SqliteAppRepositoryOptions = {}) {
    this.client = new SqliteDatabaseClient({
      databasePath: options.databasePath,
    });
    this.habitsRepository = new SqliteHabitsRepository(this.client);
    this.historyRepository = new SqliteHistoryRepository(
      this.client,
      this.habitsRepository
    );
    this.focusSessionRepository = new SqliteFocusSessionRepository(this.client);
    this.settingsRepository = new SqliteSettingsRepository(this.client);
    this.reminderRuntimeStateRepository =
      new SqliteReminderRuntimeStateRepository(this.client);
    this.streakRepository = new SqliteStreakRepository(this.client);
  }

  initializeSchema(): void {
    runMigrations(this.client);
  }

  getDatabasePath(): string {
    return this.client.getDatabasePath();
  }

  async exportBackup(destinationPath: string): Promise<void> {
    await this.client.exportBackup(destinationPath);
  }

  replaceDatabase(sourcePath: string): void {
    this.client.replaceDatabase(sourcePath);
  }

  close(): void {
    this.client.close();
  }

  runInTransaction<A>(label: string, execute: () => A): A {
    return this.client.transaction(label, execute);
  }

  seedDefaults(_nowIso: string, timezone: string): void {
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

  removeStatusRowsForDate(date: string, habitId: number): void {
    this.historyRepository.removeStatusRowsForDate(date, habitId);
  }

  toggleHabit(date: string, habitId: number): void {
    this.historyRepository.toggleHabit(date, habitId);
  }

  getFocusSessions(limit?: number): FocusSession[] {
    return this.focusSessionRepository.listRecentSessions(limit);
  }

  saveFocusSession(input: CreateFocusSessionInput): FocusSession {
    return this.focusSessionRepository.insertSession(input);
  }

  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[] {
    return this.historyRepository.getSettledHistory(limit, options);
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
    selectedWeekdays: HabitWeekday[] | null,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.habitsRepository.insertHabit(
      name,
      category,
      frequency,
      selectedWeekdays,
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

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void {
    this.habitsRepository.updateHabitWeekdays(habitId, selectedWeekdays);
  }

  archiveHabit(habitId: number): void {
    this.habitsRepository.archiveHabit(habitId);
  }

  unarchiveHabit(habitId: number): void {
    this.habitsRepository.unarchiveHabit(habitId);
  }

  normalizeHabitOrder(): void {
    this.habitsRepository.normalizeHabitOrder();
  }

  reorderHabits(habitIds: number[]): void {
    this.habitsRepository.reorderHabits(habitIds);
  }
}
