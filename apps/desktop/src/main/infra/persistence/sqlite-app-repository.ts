import { runMigrations } from "@/main/infra/db/migrations";
import { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";

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

type Public<T> = Pick<T, keyof T>;

export interface AppRepository {
  focusQuotaGoals: Public<SqliteFocusQuotaGoalRepository>;
  focusSessions: Public<SqliteFocusSessionRepository>;
  focusTimerState: Public<SqliteFocusTimerStateRepository>;
  habits: Public<SqliteHabitsRepository>;
  history: Public<SqliteHistoryRepository>;
  reminderRuntimeState: Public<SqliteReminderRuntimeStateRepository>;
  settings: Public<SqliteSettingsRepository>;
  streaks: Public<SqliteStreakRepository>;
  windDownActions: Public<SqliteWindDownActionRepository>;
  windDownRuntimeState: Public<SqliteWindDownRuntimeStateRepository>;

  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(timezone: string): void;
}

export class SqliteAppRepository {
  private readonly client: SqliteDatabaseClient;
  readonly habits: SqliteHabitsRepository;
  readonly history: SqliteHistoryRepository;
  readonly focusSessions: SqliteFocusSessionRepository;
  readonly focusQuotaGoals: SqliteFocusQuotaGoalRepository;
  readonly focusTimerState: SqliteFocusTimerStateRepository;
  readonly settings: SqliteSettingsRepository;
  readonly reminderRuntimeState: SqliteReminderRuntimeStateRepository;
  readonly streaks: SqliteStreakRepository;
  readonly windDownActions: SqliteWindDownActionRepository;
  readonly windDownRuntimeState: SqliteWindDownRuntimeStateRepository;

  constructor(options: SqliteAppRepositoryOptions = {}) {
    this.client = new SqliteDatabaseClient(
      options.databasePath ? { databasePath: options.databasePath } : {}
    );
    this.habits = new SqliteHabitsRepository(this.client);
    this.focusQuotaGoals = new SqliteFocusQuotaGoalRepository(this.client);
    this.history = new SqliteHistoryRepository(
      this.client,
      this.habits,
      this.focusQuotaGoals
    );
    this.focusSessions = new SqliteFocusSessionRepository(this.client);
    this.focusTimerState = new SqliteFocusTimerStateRepository(this.client);
    this.settings = new SqliteSettingsRepository(this.client);
    this.reminderRuntimeState = new SqliteReminderRuntimeStateRepository(
      this.client
    );
    this.streaks = new SqliteStreakRepository(this.client);
    this.windDownActions = new SqliteWindDownActionRepository(this.client);
    this.windDownRuntimeState = new SqliteWindDownRuntimeStateRepository(
      this.client
    );
  }

  initializeSchema(): void {
    runMigrations(this.client);
    this.habits.repairHabitPauseCache();
  }

  seedDefaults(timezone: string): void {
    this.streaks.ensureInitialized();
    this.settings.seedDefaults(timezone);
  }

  runInTransaction<A>(label: string, execute: () => A): A {
    return this.client.transaction(label, execute);
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

  getDatabasePreview(sourcePath: string) {
    return this.client.getDatabasePreview(sourcePath);
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
}
