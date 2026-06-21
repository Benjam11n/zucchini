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

export interface SettledHistoryOptions {
  uncapped?: boolean;
}

interface HabitRepositoryPort {
  archiveHabit(habitId: number): void;
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
  normalizeHabitOrder(): void;
  pauseHabit(habitId: number, pausedAt: string): void;
  renameHabit(habitId: number, name: string): void;
  reorderHabits(habitIds: number[]): void;
  resumeHabit(habitId: number, resumedAt: string): void;
  unarchiveHabit(habitId: number): void;
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
}

interface HistoryRepositoryPort {
  adjustHabitProgress(
    date: string,
    habitId: number,
    delta: number,
    completedAt: string
  ): void;
  clearDayStatus(date: string): void;
  clearHabitCarryoversFromSourceDate(sourceDate: string): void;
  createHabitCarryovers(
    sourceDate: string,
    targetDate: string,
    createdAt: string
  ): void;
  ensureStatusRow(date: string, habitId: number): void;
  ensureStatusRowsForDate(date: string): void;
  getDailySummariesInRange(start: string, end: string): DailySummary[];
  getDayStatus(date: string): DayStatus | null;
  getExistingCompletedAt(date: string): string | null;
  getFirstTrackedDate(): string | null;
  getFocusQuotaGoalsWithStatus(date: string): FocusQuotaGoalWithStatus[];
  getHabitCarryoversForDate(targetDate: string): HabitCarryover[];
  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[];
  getHabitProgress(date: string, habitId: number): number;
  getHabitWithStatus(date: string, habitId: number): HabitWithStatus | null;
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[];
  getHistoricalHabitPeriodStatusesOverlappingRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[];
  getLatestTrackedDate(): string | null;
  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[];
  getSettledHistoryYears(): number[];
  removeStatusRowsForDate(date: string, habitId: number): void;
  saveDailySummary(summary: DailySummary): void;
  setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void;
  setHabitProgress(date: string, habitId: number, completedCount: number): void;
  toggleHabit(date: string, habitId: number, completedAt: string): void;
  toggleHabitCarryover(
    targetDate: string,
    sourceDate: string,
    habitId: number,
    completedAt: string
  ): void;
}

interface FocusQuotaGoalRepositoryPort {
  archiveGoal(goalId: number, archivedAt: string): void;
  getGoals(includeArchived?: boolean): FocusQuotaGoal[];
  unarchiveGoal(goalId: number, restoredAt: string): void;
  upsertGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void;
}

interface FocusSessionRepositoryPort {
  insertSession(input: CreateFocusSessionInput): FocusSession;
  listRecentSessions(limit?: number): FocusSession[];
  listSessionsInRange(start: string, end: string): FocusSession[];
}

interface FocusTimerStateRepositoryPort {
  getState(): PersistedFocusTimerState | null;
  saveState(state: PersistedFocusTimerState): PersistedFocusTimerState;
}

interface RuntimeStateRepositoryPort<TState> {
  getState(): TState;
  saveState(state: TState): void;
}

interface SettingsRepositoryPort {
  getSettings(defaultTimezone: string): AppSettings;
  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings;
  updateAutoBackupLastRunAt(timestamp: string): void;
}

interface StreakRepositoryPort {
  getPersistedCategoryStreakStates(): PersistedCategoryStreakState[];
  getPersistedHabitStreakStates(
    habitIds: readonly number[]
  ): PersistedHabitStreakState[];
  getPersistedStreakState(): StreakState;
  savePersistedCategoryStreakStates(
    states: readonly PersistedCategoryStreakState[]
  ): void;
  savePersistedHabitStreakStates(
    states: readonly PersistedHabitStreakState[]
  ): void;
  savePersistedStreakState(state: StreakState): void;
}

interface WindDownActionRepositoryPort {
  createAction(name: string, createdAt: string): number;
  deleteAction(actionId: number): void;
  ensureStatusRowsForDate(date: string): void;
  getActions(): WindDownAction[];
  getActionsWithStatus(date: string): WindDownActionWithStatus[];
  renameAction(actionId: number, name: string): void;
  toggleAction(date: string, actionId: number, completedAt: string): void;
}

export interface AppRepository {
  focusQuotaGoals: FocusQuotaGoalRepositoryPort;
  focusSessions: FocusSessionRepositoryPort;
  focusTimerState: FocusTimerStateRepositoryPort;
  habits: HabitRepositoryPort;
  history: HistoryRepositoryPort;
  reminderRuntimeState: RuntimeStateRepositoryPort<ReminderRuntimeState>;
  settings: SettingsRepositoryPort;
  streaks: StreakRepositoryPort;
  windDownActions: WindDownActionRepositoryPort;
  windDownRuntimeState: RuntimeStateRepositoryPort<WindDownRuntimeState>;

  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(timezone: string): void;
}

export type TodayReadModelRepositoryPort = Pick<
  AppRepository,
  | "focusQuotaGoals"
  | "focusSessions"
  | "history"
  | "settings"
  | "streaks"
  | "windDownActions"
>;
