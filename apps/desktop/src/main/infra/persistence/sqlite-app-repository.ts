/**
 * Concrete SQLite implementation of {@link AppRepository}.
 *
 * Delegates every operation to domain-specific sub-repositories
 * (habits, history, focus sessions, streaks, settings, reminders)
 * that share a single `SqliteDatabaseClient`. The client manages
 * WAL-mode connections and transaction boundaries.
 *
 * @see AppRepository for the full interface contract.
 */
import { runMigrations } from "@/main/infra/db/migrations";
import { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type {
  AppRepository,
  SettledHistoryOptions,
} from "@/main/ports/app-repository";
import type { PersistedCategoryStreakState } from "@/shared/domain/category-streak";
import type { DayStatus, DayStatusKind } from "@/shared/domain/day-status";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type {
  FocusQuotaGoal,
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HabitCarryover } from "@/shared/domain/habit-carryover";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import type {
  WindDownAction,
  WindDownActionWithStatus,
} from "@/shared/domain/wind-down";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

import { SqliteFocusQuotaGoalRepository } from "./focus-quota-goal-repository";
import { SqliteFocusSessionRepository } from "./focus-session-repository";
import { SqliteFocusTimerStateRepository } from "./focus-timer-state-repository";
import { SqliteHabitsRepository } from "./habit-repository";
import { SqliteHistoryRepository } from "./history-repository";
import { SqliteReminderRuntimeStateRepository } from "./reminder-runtime-state-repository";
import { SqliteSettingsRepository } from "./settings-repository";
import { SqliteStreakRepository } from "./streak-repository";
import { SqliteWindDownActionRepository } from "./wind-down-action-repository";
import { SqliteWindDownRuntimeStateRepository } from "./wind-down-runtime-state-repository";

export interface SqliteAppRepositoryOptions {
  databasePath?: string;
}

export class SqliteAppRepository implements AppRepository {
  private readonly client: SqliteDatabaseClient;
  private readonly habitsRepository: SqliteHabitsRepository;
  private readonly historyRepository: SqliteHistoryRepository;
  private readonly focusSessionRepository: SqliteFocusSessionRepository;
  private readonly focusQuotaGoalRepository: SqliteFocusQuotaGoalRepository;
  private readonly focusTimerStateRepository: SqliteFocusTimerStateRepository;
  private readonly settingsRepository: SqliteSettingsRepository;
  private readonly reminderRuntimeStateRepository: SqliteReminderRuntimeStateRepository;
  private readonly streakRepository: SqliteStreakRepository;
  private readonly windDownActionRepository: SqliteWindDownActionRepository;
  private readonly windDownRuntimeStateRepository: SqliteWindDownRuntimeStateRepository;

  constructor(options: SqliteAppRepositoryOptions = {}) {
    this.client = new SqliteDatabaseClient(
      options.databasePath
        ? {
            databasePath: options.databasePath,
          }
        : {}
    );
    this.habitsRepository = new SqliteHabitsRepository(this.client);
    this.focusQuotaGoalRepository = new SqliteFocusQuotaGoalRepository(
      this.client
    );
    this.historyRepository = new SqliteHistoryRepository(
      this.client,
      this.habitsRepository,
      this.focusQuotaGoalRepository
    );
    this.focusSessionRepository = new SqliteFocusSessionRepository(this.client);
    this.focusTimerStateRepository = new SqliteFocusTimerStateRepository(
      this.client
    );
    this.settingsRepository = new SqliteSettingsRepository(this.client);
    this.reminderRuntimeStateRepository =
      new SqliteReminderRuntimeStateRepository(this.client);
    this.streakRepository = new SqliteStreakRepository(this.client);
    this.windDownActionRepository = new SqliteWindDownActionRepository(
      this.client
    );
    this.windDownRuntimeStateRepository =
      new SqliteWindDownRuntimeStateRepository(this.client);
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

  exportCsvData(destinationPath: string): void {
    this.client.exportCsvData(destinationPath);
  }

  validateDatabase(sourcePath: string): void {
    this.client.validateDatabase(sourcePath);
  }

  replaceDatabase(sourcePath: string): void {
    this.client.replaceDatabase(sourcePath);
  }

  resetDatabase(): void {
    this.client.resetDatabase();
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

  getFocusQuotaGoals(includeArchived = false): FocusQuotaGoal[] {
    return this.focusQuotaGoalRepository.getGoals(includeArchived);
  }

  getFocusQuotaGoalsWithStatusForDate(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.historyRepository.getFocusQuotaGoalsWithStatus(date);
  }

  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.historyRepository.getHistoricalFocusQuotaGoalsWithStatus(date);
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.historyRepository.getHabitsWithStatus(date);
  }

  getHabitWithStatus(date: string, habitId: number): HabitWithStatus | null {
    return this.historyRepository.getHabitWithStatus(date, habitId);
  }

  getHistoricalHabitPeriodStatusesOverlappingRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return this.historyRepository.getHistoricalHabitPeriodStatusesOverlappingRange(
      start,
      end
    );
  }

  getHabitProgress(date: string, habitId: number): number {
    return this.historyRepository.getHabitProgress(date, habitId);
  }

  getDayStatus(date: string): DayStatus | null {
    return this.historyRepository.getDayStatus(date);
  }

  getHabitCarryoversForDate(targetDate: string): HabitCarryover[] {
    return this.historyRepository.getHabitCarryoversForDate(targetDate);
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

  setHabitProgress(
    date: string,
    habitId: number,
    completedCount: number
  ): void {
    this.historyRepository.setHabitProgress(date, habitId, completedCount);
  }

  toggleHabit(date: string, habitId: number): void {
    this.historyRepository.toggleHabit(date, habitId);
  }

  adjustHabitProgress(date: string, habitId: number, delta: number): void {
    this.historyRepository.adjustHabitProgress(date, habitId, delta);
  }

  getFocusSessions(limit?: number): FocusSession[] {
    return this.focusSessionRepository.listRecentSessions(limit);
  }

  getFocusSessionsInRange(start: string, end: string): FocusSession[] {
    return this.focusSessionRepository.listSessionsInRange(start, end);
  }

  saveFocusSession(input: CreateFocusSessionInput): FocusSession {
    return this.focusSessionRepository.insertSession(input);
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.focusTimerStateRepository.getState();
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    return this.focusTimerStateRepository.saveState(state);
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

  getSettledHistoryYears(): number[] {
    return this.historyRepository.getSettledHistoryYears();
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

  getPersistedHabitStreakStates(
    habitIds: readonly number[]
  ): PersistedHabitStreakState[] {
    return this.streakRepository.getPersistedHabitStreakStates(habitIds);
  }

  savePersistedHabitStreakStates(
    states: readonly PersistedHabitStreakState[]
  ): void {
    this.streakRepository.savePersistedHabitStreakStates(states);
  }

  getPersistedCategoryStreakStates(): PersistedCategoryStreakState[] {
    return this.streakRepository.getPersistedCategoryStreakStates();
  }

  savePersistedCategoryStreakStates(
    states: readonly PersistedCategoryStreakState[]
  ): void {
    this.streakRepository.savePersistedCategoryStreakStates(states);
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.reminderRuntimeStateRepository.getState();
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.reminderRuntimeStateRepository.saveState(state);
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.windDownRuntimeStateRepository.getState();
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.windDownRuntimeStateRepository.saveState(state);
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.settingsRepository.getSettings(defaultTimezone);
  }

  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings {
    return this.settingsRepository.saveSettings(settings, defaultTimezone);
  }

  getWindDownActions(): WindDownAction[] {
    return this.windDownActionRepository.getActions();
  }

  getWindDownActionsWithStatus(date: string): WindDownActionWithStatus[] {
    return this.windDownActionRepository.getActionsWithStatus(date);
  }

  ensureWindDownStatusRowsForDate(date: string): void {
    this.windDownActionRepository.ensureStatusRowsForDate(date);
  }

  createWindDownAction(name: string, createdAt: string): number {
    return this.windDownActionRepository.createAction(name, createdAt);
  }

  renameWindDownAction(actionId: number, name: string): void {
    this.windDownActionRepository.renameAction(actionId, name);
  }

  deleteWindDownAction(actionId: number): void {
    this.windDownActionRepository.deleteAction(actionId);
  }

  toggleWindDownAction(
    date: string,
    actionId: number,
    completedAt: string
  ): void {
    this.windDownActionRepository.toggleAction(date, actionId, completedAt);
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

  setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void {
    this.historyRepository.setDayStatus(date, kind, createdAt);
  }

  createHabitCarryovers(
    sourceDate: string,
    targetDate: string,
    createdAt: string
  ): void {
    this.historyRepository.createHabitCarryovers(
      sourceDate,
      targetDate,
      createdAt
    );
  }

  toggleHabitCarryover(
    targetDate: string,
    sourceDate: string,
    habitId: number,
    completedAt: string
  ): void {
    this.historyRepository.toggleHabitCarryover(
      targetDate,
      sourceDate,
      habitId,
      completedAt
    );
  }

  clearHabitCarryoversFromSourceDate(sourceDate: string): void {
    this.historyRepository.clearHabitCarryoversFromSourceDate(sourceDate);
  }

  clearDayStatus(date: string): void {
    this.historyRepository.clearDayStatus(date);
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
    targetCount: number,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.habitsRepository.insertHabit(
      name,
      category,
      frequency,
      selectedWeekdays,
      targetCount,
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

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number
  ): void {
    this.habitsRepository.updateHabitFrequency(habitId, frequency, targetCount);
  }

  updateHabitTargetCount(habitId: number, targetCount: number): void {
    this.habitsRepository.updateHabitTargetCount(habitId, targetCount);
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void {
    this.habitsRepository.updateHabitWeekdays(habitId, selectedWeekdays);
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void {
    this.focusQuotaGoalRepository.upsertGoal(
      frequency,
      targetMinutes,
      createdAt
    );
  }

  archiveFocusQuotaGoal(goalId: number, archivedAt: string): void {
    this.focusQuotaGoalRepository.archiveGoal(goalId, archivedAt);
  }

  unarchiveFocusQuotaGoal(goalId: number, restoredAt: string): void {
    this.focusQuotaGoalRepository.unarchiveGoal(goalId, restoredAt);
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
