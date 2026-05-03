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
import type { WindDownRuntimeState } from "@/main/features/wind-down/runtime-state";
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
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import type {
  WindDownAction,
  WindDownActionWithStatus,
} from "@/shared/domain/wind-down";

import type { HabitPeriodStatusSnapshot } from "./types";

export interface SettledHistoryOptions {
  uncapped?: boolean;
}

export interface RepositoryLifecyclePort {
  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(nowIso: string, timezone: string): void;
}

export interface HabitRepositoryPort {
  getHabits(): Habit[];
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
  archiveHabit(habitId: number): void;
  unarchiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}

export interface HabitStatusRepositoryPort {
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHabitWithStatus(date: string, habitId: number): HabitWithStatus | null;
  getHistoricalHabitPeriodStatusesOverlappingRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[];
  getHabitProgress(date: string, habitId: number): number;
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  removeStatusRowsForDate(date: string, habitId: number): void;
  setHabitProgress(date: string, habitId: number, completedCount: number): void;
  toggleHabit(date: string, habitId: number): void;
  adjustHabitProgress(date: string, habitId: number, delta: number): void;
}

export interface FocusQuotaGoalRepositoryPort {
  getFocusQuotaGoals(includeArchived?: boolean): FocusQuotaGoal[];
  getFocusQuotaGoalsWithStatusForDate(date: string): FocusQuotaGoalWithStatus[];
  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[];
  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void;
  archiveFocusQuotaGoal(goalId: number, archivedAt: string): void;
  unarchiveFocusQuotaGoal(goalId: number, restoredAt: string): void;
}

export interface FocusSessionRepositoryPort {
  getFocusSessions(limit?: number): FocusSession[];
  getFocusSessionsInRange(start: string, end: string): FocusSession[];
  saveFocusSession(input: CreateFocusSessionInput): FocusSession;
}

export interface FocusTimerStateRepositoryPort {
  getPersistedFocusTimerState(): PersistedFocusTimerState | null;
  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState;
}

export interface HistoryRepositoryPort {
  getDayStatus(date: string): DayStatus | null;
  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[];
  getDailySummariesInRange(start: string, end: string): DailySummary[];
  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[];
  getFirstTrackedDate(): string | null;
  getLatestTrackedDate(): string | null;
  getExistingCompletedAt(date: string): string | null;
  setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void;
  clearDayStatus(date: string): void;
  saveDailySummary(summary: DailySummary): void;
}

export interface StreakRepositoryPort {
  getPersistedStreakState(): StreakState;
  savePersistedStreakState(state: StreakState): void;
}

export interface SettingsRepositoryPort {
  getSettings(defaultTimezone: string): AppSettings;
  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings;
}

export interface ReminderRuntimeStateRepositoryPort {
  getReminderRuntimeState(): ReminderRuntimeState;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
}

export interface WindDownRepositoryPort {
  getWindDownRuntimeState(): WindDownRuntimeState;
  saveWindDownRuntimeState(state: WindDownRuntimeState): void;
  getWindDownActions(): WindDownAction[];
  getWindDownActionsWithStatus(date: string): WindDownActionWithStatus[];
  ensureWindDownStatusRowsForDate(date: string): void;
  createWindDownAction(name: string, createdAt: string): number;
  renameWindDownAction(actionId: number, name: string): void;
  deleteWindDownAction(actionId: number): void;
  toggleWindDownAction(
    date: string,
    actionId: number,
    completedAt: string
  ): void;
}

export interface AppRepository
  extends
    RepositoryLifecyclePort,
    HabitRepositoryPort,
    HabitStatusRepositoryPort,
    FocusQuotaGoalRepositoryPort,
    FocusSessionRepositoryPort,
    FocusTimerStateRepositoryPort,
    HistoryRepositoryPort,
    StreakRepositoryPort,
    SettingsRepositoryPort,
    ReminderRuntimeStateRepositoryPort,
    WindDownRepositoryPort {}

export type TodayReadModelRepositoryPort = Pick<
  AppRepository,
  | "ensureStatusRowsForDate"
  | "ensureWindDownStatusRowsForDate"
  | "getDayStatus"
  | "getFocusQuotaGoalsWithStatusForDate"
  | "getFocusSessionsInRange"
  | "getHabitWithStatus"
  | "getHabitsWithStatus"
  | "getHistoricalHabitPeriodStatusesOverlappingRange"
  | "getPersistedStreakState"
  | "getSettings"
  | "getSettledHistory"
  | "getWindDownActionsWithStatus"
>;
