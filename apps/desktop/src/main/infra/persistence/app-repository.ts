/**
 * Repository data-access contract.
 *
 * Defines every read and write operation the application service needs.
 * The concrete implementation (`SqliteAppRepository`) delegates to
 * domain-specific sub-repositories backed by SQLite via Drizzle ORM.
 *
 * This interface is the single boundary between business logic and
 * persistence — service code never imports database clients directly.
 */
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
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
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import type { HabitPeriodStatusSnapshot } from "./types";

export interface SettledHistoryOptions {
  uncapped?: boolean;
}

export interface AppRepository {
  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(nowIso: string, timezone: string): void;
  getHabits(): Habit[];
  getFocusQuotaGoals(includeArchived?: boolean): FocusQuotaGoal[];
  getFocusQuotaGoalsWithStatusForDate(date: string): FocusQuotaGoalWithStatus[];
  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[];
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[];
  getHabitProgress(date: string, habitId: number): number;
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  removeStatusRowsForDate(date: string, habitId: number): void;
  setHabitProgress(date: string, habitId: number, completedCount: number): void;
  toggleHabit(date: string, habitId: number): void;
  adjustHabitProgress(date: string, habitId: number, delta: number): void;
  getFocusSessions(limit?: number): FocusSession[];
  getFocusSessionsInRange(start: string, end: string): FocusSession[];
  saveFocusSession(input: CreateFocusSessionInput): FocusSession;
  getPersistedFocusTimerState(): PersistedFocusTimerState | null;
  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState;
  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[];
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
    selectedWeekdays: HabitWeekday[] | null,
    targetCount: number,
    sortOrder: number,
    createdAt: string
  ): number;
  renameHabit(habitId: number, name: string): void;
  updateHabitCategory(habitId: number, category: HabitCategory): void;
  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number
  ): void;
  updateHabitTargetCount(habitId: number, targetCount: number): void;
  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void;
  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void;
  archiveFocusQuotaGoal(goalId: number, archivedAt: string): void;
  unarchiveFocusQuotaGoal(goalId: number, restoredAt: string): void;
  archiveHabit(habitId: number): void;
  unarchiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}
