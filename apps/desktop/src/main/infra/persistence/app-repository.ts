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

import type { HabitPeriodStatusSnapshot } from "./types";

export interface SettledHistoryOptions {
  uncapped?: boolean;
}

export interface AppRepository {
  initializeSchema(): void;
  runInTransaction<A>(label: string, execute: () => A): A;
  seedDefaults(nowIso: string, timezone: string): void;
  getHabits(): Habit[];
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[];
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  removeStatusRowsForDate(date: string, habitId: number): void;
  toggleHabit(date: string, habitId: number): void;
  getFocusSessions(limit?: number): FocusSession[];
  saveFocusSession(input: CreateFocusSessionInput): FocusSession;
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
    sortOrder: number,
    createdAt: string
  ): number;
  renameHabit(habitId: number, name: string): void;
  updateHabitCategory(habitId: number, category: HabitCategory): void;
  updateHabitFrequency(habitId: number, frequency: HabitFrequency): void;
  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void;
  archiveHabit(habitId: number): void;
  unarchiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}
