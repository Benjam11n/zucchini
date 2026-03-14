import type { Clock } from "@/main/app/clock";
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import { syncRollingState } from "@/main/features/streaks/sync-service";
import {
  buildHistoryDay,
  buildTodayPreviewSummary,
  buildTodayState,
} from "@/main/features/today/state-builder";
import {
  buildWeeklyReview,
  buildWeeklyReviewOverview,
} from "@/main/features/weekly-review/builder";
import type { HabitRepository } from "@/main/repository";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import {
  endOfIsoWeek,
  getPreviousCompletedIsoWeek,
  startOfIsoWeek,
} from "@/shared/utils/date";

export interface HabitsService {
  initialize(): void;
  getHabits(): Habit[];
  getTodayState(): TodayState;
  toggleHabit(habitId: number): TodayState;
  getFocusSessions(limit?: number): FocusSession[];
  recordFocusSession(input: CreateFocusSessionInput): FocusSession;
  getHistory(limit?: number): HistoryDay[];
  getWeeklyReviewOverview(): WeeklyReviewOverview;
  getWeeklyReview(weekStart: string): WeeklyReview;
  getReminderRuntimeState(): ReminderRuntimeState;
  updateSettings(settings: AppSettings): AppSettings;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ): TodayState;
  renameHabit(habitId: number, name: string): TodayState;
  updateHabitCategory(habitId: number, category: HabitCategory): TodayState;
  updateHabitFrequency(habitId: number, frequency: HabitFrequency): TodayState;
  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState;
  archiveHabit(habitId: number): TodayState;
  unarchiveHabit(habitId: number): TodayState;
  reorderHabits(habitIds: number[]): TodayState;
}

function isValidIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidFocusSessionEntryKind(
  value: string
): value is CreateFocusSessionInput["entryKind"] {
  return value === "completed" || value === "partial";
}

function assertValidFocusSessionInput(input: CreateFocusSessionInput): void {
  if (
    !isValidIsoTimestamp(input.startedAt) ||
    !isValidIsoTimestamp(input.completedAt)
  ) {
    throw new Error("Focus session timestamps must use ISO 8601 format.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.completedDate)) {
    throw new Error("Focus session dates must use YYYY-MM-DD format.");
  }

  if (
    !Number.isInteger(input.durationSeconds) ||
    input.durationSeconds <= 0 ||
    input.durationSeconds > 60 * 60 * 8
  ) {
    throw new Error("Focus session durations must be positive integers.");
  }

  if (!isValidFocusSessionEntryKind(input.entryKind)) {
    throw new Error("Focus session entries must be completed or partial.");
  }

  if (input.timerSessionId.trim().length === 0) {
    throw new Error("Focus session entries must include a timer session id.");
  }
}

export class HabitService implements HabitsService {
  private readonly repository: HabitRepository;
  private readonly clock: Clock;
  private initialized = false;

  constructor(repository: HabitRepository, clock: Clock) {
    this.repository = repository;
    this.clock = clock;
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.repository.initializeSchema();
    this.repository.seedDefaults(
      this.clock.now().toISOString(),
      this.clock.timezone()
    );
    this.syncRollingState();
    this.initialized = true;
  }

  getHabits(): Habit[] {
    this.initialize();
    return this.repository.runInTransaction("getHabits", () =>
      this.repository.getHabits()
    );
  }

  getTodayState(): TodayState {
    this.initialize();
    return this.repository.runInTransaction("getTodayState", () => {
      this.syncRollingState();
      return buildTodayState(this.repository, this.clock);
    });
  }

  toggleHabit(habitId: number): TodayState {
    this.initialize();
    return this.repository.runInTransaction("toggleHabit", () => {
      const today = this.clock.todayKey();
      this.syncRollingState();
      this.repository.ensureStatusRowsForDate(today);
      this.repository.toggleHabit(today, habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  getFocusSessions(limit?: number): FocusSession[] {
    this.initialize();
    return this.repository.runInTransaction("getFocusSessions", () =>
      this.repository.getFocusSessions(limit)
    );
  }

  recordFocusSession(input: CreateFocusSessionInput): FocusSession {
    this.initialize();
    assertValidFocusSessionInput(input);

    return this.repository.runInTransaction("recordFocusSession", () =>
      this.repository.saveFocusSession(input)
    );
  }

  getHistory(limit?: number): HistoryDay[] {
    this.initialize();
    return this.repository.runInTransaction("getHistory", () => {
      this.syncRollingState();
      const todayState = buildTodayState(this.repository, this.clock);
      const settledHistoryLimit =
        limit === undefined ? undefined : Math.max(limit - 1, 0);
      const settledHistoryOptions =
        limit === undefined ? { uncapped: true } : undefined;

      return [
        buildHistoryDay(
          buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
          this.repository.getHabitsWithStatus(this.clock.todayKey())
        ),
        ...this.repository
          .getSettledHistory(settledHistoryLimit, settledHistoryOptions)
          .map((summary) =>
            buildHistoryDay(
              summary,
              this.repository.getHistoricalHabitsWithStatus(summary.date)
            )
          ),
      ];
    });
  }

  getWeeklyReviewOverview(): WeeklyReviewOverview {
    this.initialize();
    return this.repository.runInTransaction("getWeeklyReviewOverview", () => {
      this.syncRollingState();
      const firstTrackedDate = this.repository.getFirstTrackedDate();
      const latestTrackedDate = this.repository.getLatestTrackedDate();

      if (!firstTrackedDate || !latestTrackedDate) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const latestCompletedWeek = getPreviousCompletedIsoWeek(
        this.clock.todayKey()
      );
      if (latestTrackedDate < latestCompletedWeek.weekStart) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const rangeStart = startOfIsoWeek(firstTrackedDate);
      const rangeEnd = latestCompletedWeek.weekEnd;

      return buildWeeklyReviewOverview({
        dailySummaries: this.repository.getDailySummariesInRange(
          rangeStart,
          rangeEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          rangeStart,
          rangeEnd
        ),
      });
    });
  }

  getWeeklyReview(weekStart: string): WeeklyReview {
    this.initialize();
    return this.repository.runInTransaction("getWeeklyReview", () => {
      this.syncRollingState();
      const normalizedWeekStart = startOfIsoWeek(weekStart);
      const weekEnd = endOfIsoWeek(normalizedWeekStart);

      return buildWeeklyReview({
        dailySummaries: this.repository.getDailySummariesInRange(
          normalizedWeekStart,
          weekEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          normalizedWeekStart,
          weekEnd
        ),
        weekStart: normalizedWeekStart,
      });
    });
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    this.initialize();
    return this.repository.getReminderRuntimeState();
  }

  updateSettings(settings: AppSettings): AppSettings {
    this.initialize();
    return this.repository.saveSettings(settings, this.clock.timezone());
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.initialize();
    this.repository.saveReminderRuntimeState(state);
  }

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays: HabitWeekday[] | null = null
  ): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    this.initialize();
    return this.repository.runInTransaction("createHabit", () => {
      const today = this.clock.todayKey();
      this.syncRollingState();
      const habitId = this.repository.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        normalizeHabitWeekdays(selectedWeekdays),
        this.repository.getMaxSortOrder() + 1,
        this.clock.now().toISOString()
      );
      this.repository.reorderHabits([
        habitId,
        ...this.repository
          .getHabits()
          .filter((habit) => habit.id !== habitId)
          .map((habit) => habit.id),
      ]);
      this.repository.ensureStatusRow(today, habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    this.initialize();
    this.repository.renameHabit(habitId, trimmedName);
    return buildTodayState(this.repository, this.clock);
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    this.initialize();
    this.repository.updateHabitCategory(
      habitId,
      normalizeHabitCategory(category)
    );
    return buildTodayState(this.repository, this.clock);
  }

  updateHabitFrequency(habitId: number, frequency: HabitFrequency): TodayState {
    this.initialize();
    return this.repository.runInTransaction("updateHabitFrequency", () => {
      this.repository.removeStatusRowsForDate(this.clock.todayKey(), habitId);
      this.repository.updateHabitFrequency(
        habitId,
        normalizeHabitFrequency(frequency)
      );
      this.repository.ensureStatusRow(this.clock.todayKey(), habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState {
    this.initialize();
    return this.repository.runInTransaction("updateHabitWeekdays", () => {
      this.repository.removeStatusRowsForDate(this.clock.todayKey(), habitId);
      this.repository.updateHabitWeekdays(
        habitId,
        normalizeHabitWeekdays(selectedWeekdays)
      );
      this.repository.ensureStatusRow(this.clock.todayKey(), habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  archiveHabit(habitId: number): TodayState {
    this.initialize();
    return this.repository.runInTransaction("archiveHabit", () => {
      this.repository.archiveHabit(habitId);
      this.repository.normalizeHabitOrder();
      this.syncRollingState();
      return buildTodayState(this.repository, this.clock);
    });
  }

  unarchiveHabit(habitId: number): TodayState {
    this.initialize();
    return this.repository.runInTransaction("unarchiveHabit", () => {
      this.repository.unarchiveHabit(habitId);
      this.repository.reorderHabits([
        ...this.repository
          .getHabits()
          .filter((habit) => habit.id !== habitId)
          .map((habit) => habit.id),
        habitId,
      ]);
      this.repository.ensureStatusRow(this.clock.todayKey(), habitId);
      this.syncRollingState();
      return buildTodayState(this.repository, this.clock);
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    this.initialize();
    return this.repository.runInTransaction("reorderHabits", () => {
      const activeHabits = this.repository.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return buildTodayState(this.repository, this.clock);
      }

      this.repository.reorderHabits(habitIds);
      return buildTodayState(this.repository, this.clock);
    });
  }

  private syncRollingState(): void {
    syncRollingState(this.repository, this.clock);
  }
}
