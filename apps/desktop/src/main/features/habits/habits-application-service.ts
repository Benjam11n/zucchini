import {
  executeHabitServiceCommand,
  readHabitServiceQuery,
} from "@/main/features/habits/habits-ipc-dispatch";
import { buildInsightsDashboard } from "@/main/features/insights/builder";
import { TodayReadModelService } from "@/main/features/read-models/today-read-model-service";
import { syncRollingState } from "@/main/features/streaks/sync-service";
import {
  buildHistoricalHabitsByDate,
  buildHistoryDay,
  buildHistorySummaryDay,
  buildTodayPreviewSummary,
} from "@/main/features/today/state-builder";
import {
  buildWeeklyReview,
  buildWeeklyReviewOverview,
} from "@/main/features/weekly-review/builder";
import type { AppRepository } from "@/main/ports/app-repository";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type {
  HabitCommand,
  HabitCommandResult,
} from "@/shared/contracts/habits-ipc-commands";
import type {
  HabitQuery,
  HabitQueryResult,
} from "@/shared/contracts/habits-ipc-queries";
import {
  createFocusSessionInputSchema,
  persistedFocusTimerStateSchema,
} from "@/shared/contracts/habits-ipc-schema";
import type { TodayState } from "@/shared/contracts/today-state";
/**
 * Core application service for habit management.
 *
 * Implements the {@link HabitsService} interface — the single entry point the
 * IPC layer calls for every user-facing operation. Each method runs inside a
 * SQLite transaction, synchronizes rolling streak state on read paths, and
 * returns fresh `TodayState` snapshots so the renderer stays in sync.
 *
 * @see AppRepository for the data access contract it delegates to.
 * @see syncRollingState for the streak catch-up logic.
 * @see buildTodayState for how the read-model is assembled.
 */
import type { Clock } from "@/shared/domain/clock";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import { toFocusMinutes } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import {
  isValidFocusQuotaTargetMinutes,
  normalizeFocusQuotaTargetMinutes,
  normalizeGoalFrequency,
} from "@/shared/domain/goal";
import type { GoalFrequency } from "@/shared/domain/goal";
import {
  getHabitCategoryProgress,
  isDailyHabit,
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type { InsightsDashboard } from "@/shared/domain/insights";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";
import {
  addDays,
  endOfIsoWeek,
  getPreviousCompletedIsoWeek,
  startOfIsoWeek,
  toDateKeyInTimeZone,
} from "@/shared/utils/date";

interface HistoryListContext {
  focusMinutesByDate: Map<string, number>;
  historicalHabitsByDate: Map<string, HabitWithStatus[]>;
  todayState: TodayState;
  settledSummaries: ReturnType<AppRepository["getSettledHistory"]>;
}

interface HistoryRangeContext {
  focusMinutesByDate: Map<string, number>;
  historicalHabitsByDate: Map<string, HabitWithStatus[]>;
  includeToday: boolean;
  settledSummaries: ReturnType<AppRepository["getDailySummariesInRange"]>;
  todayState: TodayState;
}

export interface HabitsService {
  execute(command: HabitCommand): HabitCommandResult;
  read(query: HabitQuery): HabitQueryResult;
  initialize(): void;
  getHabits(): Habit[];
  getTodayState(): TodayState;
  moveUnfinishedHabitsToTomorrow(): TodayState;
  setDayStatus(kind: DayStatusKind | null): TodayState;
  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState;
  toggleSickDay(): TodayState;
  toggleHabit(habitId: number): HabitStatusPatch;
  incrementHabitProgress(habitId: number): HabitStatusPatch;
  decrementHabitProgress(habitId: number): HabitStatusPatch;
  getFocusSessions(limit?: number): FocusSession[];
  recordFocusSession(input: CreateFocusSessionInput): FocusSession;
  getPersistedFocusTimerState(): PersistedFocusTimerState | null;
  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState;
  getHistory(limit?: number): HistoryDay[];
  getHistoryForYear(year: number): HistoryDay[];
  getHistoryDay(date: string): HistoryDay;
  getHistorySummary(limit?: number): HistorySummaryDay[];
  getHistorySummaryForYear(year: number): HistorySummaryDay[];
  getHistorySummaryForMonth(year: number, month: number): HistorySummaryDay[];
  getHistoryYears(): number[];
  getWeeklyReviewOverview(): WeeklyReviewOverview;
  getWeeklyReview(weekStart: string): WeeklyReview;
  getInsightsDashboard(): InsightsDashboard;
  getReminderRuntimeState(): ReminderRuntimeState;
  updateSettings(settings: AppSettings): AppSettings;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  getWindDownRuntimeState(): WindDownRuntimeState;
  saveWindDownRuntimeState(state: WindDownRuntimeState): void;
  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ): TodayState;
  renameHabit(habitId: number, name: string): TodayState;
  updateHabitCategory(habitId: number, category: HabitCategory): TodayState;
  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ): TodayState;
  updateHabitTargetCount(habitId: number, targetCount: number): TodayState;
  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState;
  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState;
  archiveFocusQuotaGoal(goalId: number): TodayState;
  unarchiveFocusQuotaGoal(goalId: number): TodayState;
  archiveHabit(habitId: number): TodayState;
  unarchiveHabit(habitId: number): TodayState;
  reorderHabits(habitIds: number[]): TodayState;
  createWindDownAction(name: string): TodayState;
  renameWindDownAction(actionId: number, name: string): TodayState;
  deleteWindDownAction(actionId: number): TodayState;
  toggleWindDownAction(actionId: number): TodayState;
}

function assertValidFocusSessionInput(input: CreateFocusSessionInput): void {
  const result = createFocusSessionInputSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Focus session input is invalid."
    );
  }
}

function assertValidPersistedFocusTimerState(
  state: PersistedFocusTimerState
): void {
  if (!persistedFocusTimerStateSchema.safeParse(state).success) {
    throw new Error("Focus timer state is invalid.");
  }
}

export class HabitsApplicationService implements HabitsService {
  private readonly repository: AppRepository;
  private readonly clock: Clock;
  private readonly todayReadModel: TodayReadModelService;
  private initialized = false;

  constructor(repository: AppRepository, clock: Clock) {
    this.repository = repository;
    this.clock = clock;
    this.todayReadModel = new TodayReadModelService(repository, clock);
  }

  private static buildFocusMinutesByDate(
    sessions: FocusSession[]
  ): Map<string, number> {
    const totalSecondsByDate = new Map<string, number>();

    for (const session of sessions) {
      totalSecondsByDate.set(
        session.completedDate,
        (totalSecondsByDate.get(session.completedDate) ?? 0) +
          session.durationSeconds
      );
    }

    return new Map(
      [...totalSecondsByDate.entries()].map(([date, totalSeconds]) => [
        date,
        toFocusMinutes(totalSeconds),
      ])
    );
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

  private withInitialized<A>(execute: () => A): A {
    this.initialize();
    return execute();
  }

  private inInitializedTransaction<A>(label: string, execute: () => A): A {
    return this.withInitialized(() =>
      this.repository.runInTransaction(label, execute)
    );
  }

  private withSyncedRead<A>(label: string, execute: () => A): A {
    return this.inInitializedTransaction(label, () => {
      this.syncRollingState();
      return execute();
    });
  }

  private buildCurrentTodayState(): TodayState {
    return this.todayReadModel.getTodayState();
  }

  private getTodayKey(): string {
    return this.clock.todayKey();
  }

  private getTimezone(): string {
    return this.clock.timezone();
  }

  private preserveTodayHabitProgress(
    today: string,
    habitId: number,
    previousProgress: number,
    targetCount: number
  ): void {
    this.repository.ensureStatusRow(today, habitId);
    this.repository.setHabitProgress(
      today,
      habitId,
      Math.min(previousProgress, targetCount)
    );
  }

  private rebuildCurrentTodayState(): TodayState {
    this.todayReadModel.invalidate();
    return this.buildCurrentTodayState();
  }

  execute(command: HabitCommand): HabitCommandResult {
    return executeHabitServiceCommand(this, command);
  }

  read(query: HabitQuery): HabitQueryResult {
    return readHabitServiceQuery(this, query);
  }

  private mutateTodayState(
    label: string,
    mutate: (today: string) => void,
    options: {
      ensureStatusRowsForToday?: boolean;
      syncRollingState?: boolean;
    } = {}
  ): TodayState {
    return this.inInitializedTransaction(label, () => {
      const today = this.getTodayKey();

      if (options.syncRollingState) {
        this.syncRollingState();
      }

      if (options.ensureStatusRowsForToday) {
        this.repository.ensureStatusRowsForDate(today);
      }

      mutate(today);

      return this.rebuildCurrentTodayState();
    });
  }

  private mutateHabitStatusPatch(
    label: string,
    habitId: number,
    mutate: (today: string) => void
  ): HabitStatusPatch {
    return this.inInitializedTransaction(label, () => {
      const today = this.getTodayKey();

      this.syncRollingState();
      this.repository.ensureStatusRowsForDate(today);
      mutate(today);

      return this.todayReadModel.getFreshHabitStatusPatch(habitId);
    });
  }

  getHabits(): Habit[] {
    return this.inInitializedTransaction("getHabits", () =>
      this.repository.getHabits()
    );
  }

  getTodayState(): TodayState {
    return this.withSyncedRead("getTodayState", () =>
      this.buildCurrentTodayState()
    );
  }

  setDayStatus(kind: DayStatusKind | null): TodayState {
    return this.mutateTodayState(
      "setDayStatus",
      (today) => {
        if (!kind) {
          const currentDayStatus = this.repository.getDayStatus(today);
          if (currentDayStatus?.kind === "rescheduled") {
            this.repository.clearHabitCarryoversFromSourceDate(today);
          }

          this.repository.clearDayStatus(today);
          return;
        }

        this.repository.setDayStatus(
          today,
          kind,
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  moveUnfinishedHabitsToTomorrow(): TodayState {
    return this.mutateTodayState(
      "moveUnfinishedHabitsToTomorrow",
      (today) => {
        this.repository.ensureStatusRowsForDate(today);
        const unfinishedDailyHabits = this.repository
          .getHabitsWithStatus(today)
          .filter((habit) => isDailyHabit(habit) && !habit.completed);

        if (unfinishedDailyHabits.length === 0) {
          return;
        }

        const nowIso = this.clock.now().toISOString();
        this.repository.createHabitCarryovers(today, addDays(today, 1), nowIso);
        this.repository.setDayStatus(today, "rescheduled", nowIso);
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState {
    return this.mutateTodayState(
      "toggleHabitCarryover",
      (today) => {
        this.repository.toggleHabitCarryover(
          today,
          sourceDate,
          habitId,
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleSickDay(): TodayState {
    return this.mutateTodayState(
      "toggleSickDay",
      (today) => {
        const currentDayStatus = this.repository.getDayStatus(today);
        if (currentDayStatus?.kind === "sick") {
          this.repository.clearDayStatus(today);
          return;
        }

        this.repository.setDayStatus(
          today,
          "sick",
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabit(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch("toggleHabit", habitId, (today) => {
      this.repository.toggleHabit(
        today,
        habitId,
        this.clock.now().toISOString()
      );
    });
  }

  incrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch(
      "incrementHabitProgress",
      habitId,
      (today) => {
        this.repository.adjustHabitProgress(
          today,
          habitId,
          1,
          this.clock.now().toISOString()
        );
      }
    );
  }

  decrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch(
      "decrementHabitProgress",
      habitId,
      (today) => {
        this.repository.adjustHabitProgress(
          today,
          habitId,
          -1,
          this.clock.now().toISOString()
        );
      }
    );
  }

  getFocusSessions(limit?: number): FocusSession[] {
    return this.inInitializedTransaction("getFocusSessions", () =>
      this.repository.getFocusSessions(limit)
    );
  }

  recordFocusSession(input: CreateFocusSessionInput): FocusSession {
    assertValidFocusSessionInput(input);

    return this.inInitializedTransaction("recordFocusSession", () => {
      const normalizedInput = {
        ...input,
        completedDate: toDateKeyInTimeZone(
          new Date(input.completedAt),
          this.getTimezone()
        ),
      };

      return this.repository.saveFocusSession(normalizedInput);
    });
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.inInitializedTransaction("getPersistedFocusTimerState", () =>
      this.repository.getPersistedFocusTimerState()
    );
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    assertValidPersistedFocusTimerState(state);

    return this.inInitializedTransaction("savePersistedFocusTimerState", () =>
      this.repository.savePersistedFocusTimerState(state)
    );
  }

  private buildTodayHistoryDay(
    todayState: TodayState,
    focusMinutesByDate: Map<string, number>
  ): HistoryDay {
    return buildHistoryDay(
      buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
      this.repository.getHabitsWithStatus(this.getTodayKey()),
      focusMinutesByDate.get(todayState.date) ?? 0,
      this.repository.getFocusQuotaGoalsWithStatusForDate(todayState.date)
    );
  }

  private buildSettledHistoryDay(
    summary: DailySummary,
    historicalHabitsByDate: Map<string, HabitWithStatus[]>,
    focusMinutesByDate: Map<string, number>
  ): HistoryDay {
    return buildHistoryDay(
      summary,
      historicalHabitsByDate.get(summary.date) ?? [],
      focusMinutesByDate.get(summary.date) ?? 0,
      this.repository.getHistoricalFocusQuotaGoalsWithStatus(summary.date)
    );
  }

  getHistory(limit?: number): HistoryDay[] {
    return this.withSyncedRead("getHistory", () => {
      const {
        focusMinutesByDate,
        historicalHabitsByDate,
        settledSummaries,
        todayState,
      } = this.buildHistoryListContext(limit);

      return [
        this.buildTodayHistoryDay(todayState, focusMinutesByDate),
        ...settledSummaries.map((summary) =>
          this.buildSettledHistoryDay(
            summary,
            historicalHabitsByDate,
            focusMinutesByDate
          )
        ),
      ];
    });
  }

  getHistoryYears(): number[] {
    return this.withSyncedRead("getHistoryYears", () =>
      [
        ...new Set([
          Number.parseInt(this.buildCurrentTodayState().date.slice(0, 4), 10),
          ...this.repository.getSettledHistoryYears(),
        ]),
      ].toSorted((left, right) => right - left)
    );
  }

  private buildHistoryRangeContext(
    rangeStart: string,
    rangeEnd: string
  ): HistoryRangeContext | null {
    const todayState = this.buildCurrentTodayState();
    const includeToday =
      todayState.date >= rangeStart && todayState.date <= rangeEnd;
    const settledSummaries = this.repository
      .getDailySummariesInRange(rangeStart, rangeEnd)
      .filter((summary) => summary.date !== todayState.date);

    if (!includeToday && settledSummaries.length === 0) {
      return null;
    }

    const oldestDate =
      settledSummaries[0]?.date ??
      (includeToday ? todayState.date : rangeStart);
    const newestDate = includeToday
      ? todayState.date
      : (settledSummaries.at(-1)?.date ?? rangeEnd);
    const focusMinutesByDate = HabitsApplicationService.buildFocusMinutesByDate(
      this.repository.getFocusSessionsInRange(oldestDate, newestDate)
    );
    const historicalHabitsByDate =
      settledSummaries.length > 0
        ? buildHistoricalHabitsByDate(
            settledSummaries,
            this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
              oldestDate,
              newestDate
            )
          )
        : new Map();

    return {
      focusMinutesByDate,
      historicalHabitsByDate,
      includeToday,
      settledSummaries,
      todayState,
    };
  }

  private buildTodayHistorySummary(
    todayState: TodayState,
    focusMinutesByDate: Map<string, number>
  ): HistorySummaryDay {
    return buildHistorySummaryDay({
      categoryProgress: getHabitCategoryProgress(
        this.repository
          .getHabitsWithStatus(this.getTodayKey())
          .filter(isDailyHabit)
      ),
      date: todayState.date,
      focusMinutes: focusMinutesByDate.get(todayState.date) ?? 0,
      summary: buildTodayPreviewSummary(
        todayState,
        this.clock.now().toISOString()
      ),
    });
  }

  private buildHistorySummariesFromRangeContext(
    context: HistoryRangeContext
  ): HistorySummaryDay[] {
    const todayHistory = context.includeToday
      ? [
          this.buildTodayHistorySummary(
            context.todayState,
            context.focusMinutesByDate
          ),
        ]
      : [];

    return [
      ...todayHistory,
      ...context.settledSummaries.toReversed().map((summary) =>
        buildHistorySummaryDay({
          categoryProgress: getHabitCategoryProgress(
            (context.historicalHabitsByDate.get(summary.date) ?? []).filter(
              isDailyHabit
            )
          ),
          date: summary.date,
          focusMinutes: context.focusMinutesByDate.get(summary.date) ?? 0,
          summary,
        })
      ),
    ];
  }

  getHistoryForYear(year: number): HistoryDay[] {
    return this.withSyncedRead("getHistoryForYear", () => {
      const context = this.buildHistoryRangeContext(
        `${year}-01-01`,
        `${year}-12-31`
      );

      if (!context) {
        return [];
      }

      const todayHistory = context.includeToday
        ? [
            this.buildTodayHistoryDay(
              context.todayState,
              context.focusMinutesByDate
            ),
          ]
        : [];

      return [
        ...todayHistory,
        ...context.settledSummaries
          .toReversed()
          .map((summary) =>
            this.buildSettledHistoryDay(
              summary,
              context.historicalHabitsByDate,
              context.focusMinutesByDate
            )
          ),
      ];
    });
  }

  getHistorySummaryForYear(year: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummaryForYear", () => {
      const context = this.buildHistoryRangeContext(
        `${year}-01-01`,
        `${year}-12-31`
      );

      if (!context) {
        return [];
      }

      return this.buildHistorySummariesFromRangeContext(context);
    });
  }

  getHistorySummaryForMonth(year: number, month: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummaryForMonth", () => {
      const rangeStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const rangeEndDate = new Date(year, month, 0);
      const rangeEnd = `${year}-${String(month).padStart(2, "0")}-${String(
        rangeEndDate.getDate()
      ).padStart(2, "0")}`;
      const context = this.buildHistoryRangeContext(rangeStart, rangeEnd);

      if (!context) {
        return [];
      }

      return this.buildHistorySummariesFromRangeContext(context);
    });
  }

  getHistoryDay(date: string): HistoryDay {
    return this.withSyncedRead("getHistoryDay", () => {
      const todayState = this.buildCurrentTodayState();

      if (date === todayState.date) {
        return buildHistoryDay(
          buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
          this.repository.getHabitsWithStatus(this.getTodayKey()),
          todayState.focusMinutes,
          this.repository.getFocusQuotaGoalsWithStatusForDate(todayState.date)
        );
      }

      const [summary] = this.repository.getDailySummariesInRange(date, date);

      if (!summary) {
        throw new Error(`History day ${date} was not found.`);
      }

      const focusMinutes =
        HabitsApplicationService.buildFocusMinutesByDate(
          this.repository.getFocusSessionsInRange(date, date)
        ).get(date) ?? 0;
      const habitsByDate = buildHistoricalHabitsByDate(
        [summary],
        this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
          date,
          date
        )
      );

      return buildHistoryDay(
        summary,
        habitsByDate.get(date) ?? [],
        focusMinutes,
        this.repository.getHistoricalFocusQuotaGoalsWithStatus(date)
      );
    });
  }

  getHistorySummary(limit?: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummary", () => {
      const {
        focusMinutesByDate,
        historicalHabitsByDate,
        settledSummaries,
        todayState,
      } = this.buildHistoryListContext(limit);

      return [
        this.buildTodayHistorySummary(todayState, focusMinutesByDate),
        ...settledSummaries.map((summary) =>
          buildHistorySummaryDay({
            categoryProgress: getHabitCategoryProgress(
              (historicalHabitsByDate.get(summary.date) ?? []).filter(
                isDailyHabit
              )
            ),
            date: summary.date,
            focusMinutes: focusMinutesByDate.get(summary.date) ?? 0,
            summary,
          })
        ),
      ];
    });
  }

  private buildHistoryListContext(limit?: number): HistoryListContext {
    const todayState = this.buildCurrentTodayState();
    const settledHistoryLimit =
      limit === undefined ? undefined : Math.max(limit - 1, 0);
    const settledHistoryOptions =
      limit === undefined ? { uncapped: true } : undefined;
    const settledSummaries = this.repository.getSettledHistory(
      settledHistoryLimit,
      settledHistoryOptions
    );
    const oldestDate = settledSummaries.at(-1)?.date ?? todayState.date;
    const focusMinutesByDate = HabitsApplicationService.buildFocusMinutesByDate(
      this.repository.getFocusSessionsInRange(oldestDate, todayState.date)
    );
    const historicalHabitsByDate =
      settledSummaries.length > 0
        ? buildHistoricalHabitsByDate(
            settledSummaries,
            this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
              oldestDate,
              settledSummaries[0]?.date ?? oldestDate
            )
          )
        : new Map();

    return {
      focusMinutesByDate,
      historicalHabitsByDate,
      settledSummaries,
      todayState,
    };
  }

  getWeeklyReviewOverview(): WeeklyReviewOverview {
    return this.withSyncedRead("getWeeklyReviewOverview", () => {
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
        this.getTodayKey()
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
        focusSessions: this.repository.getFocusSessionsInRange(
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
    return this.withSyncedRead("getWeeklyReview", () => {
      const normalizedWeekStart = startOfIsoWeek(weekStart);
      const weekEnd = endOfIsoWeek(normalizedWeekStart);

      return buildWeeklyReview({
        dailySummaries: this.repository.getDailySummariesInRange(
          normalizedWeekStart,
          weekEnd
        ),
        focusSessions: this.repository.getFocusSessionsInRange(
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

  getInsightsDashboard(): InsightsDashboard {
    return this.withSyncedRead("getInsightsDashboard", () => {
      const today = this.getTodayKey();
      const rangeStart = addDays(today, -179);

      return buildInsightsDashboard({
        dailySummaries: this.repository.getDailySummariesInRange(
          rangeStart,
          today
        ),
        focusSessions: this.repository.getFocusSessionsInRange(
          rangeStart,
          today
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          rangeStart,
          today
        ),
        nowDate: today,
        streak: this.repository.getPersistedStreakState(),
        timezone: this.getTimezone(),
      });
    });
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.withInitialized(() =>
      this.repository.getReminderRuntimeState()
    );
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.withInitialized(() => {
      const savedSettings = this.repository.saveSettings(
        settings,
        this.clock.timezone()
      );
      this.todayReadModel.invalidate();
      return savedSettings;
    });
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.withInitialized(() => {
      this.repository.saveReminderRuntimeState(state);
    });
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.withInitialized(() =>
      this.repository.getWindDownRuntimeState()
    );
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.withInitialized(() => {
      this.repository.saveWindDownRuntimeState(state);
    });
  }

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays: HabitWeekday[] | null = null,
    targetCount: number | null = null
  ): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.inInitializedTransaction("createHabit", () => {
      const today = this.getTodayKey();
      this.syncRollingState();
      const habitId = this.repository.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        normalizeHabitWeekdays(selectedWeekdays),
        normalizeHabitTargetCount(
          normalizeHabitFrequency(frequency),
          targetCount
        ),
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
      return this.rebuildCurrentTodayState();
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.withInitialized(() => {
      this.repository.renameHabit(habitId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    return this.withInitialized(() => {
      this.repository.updateHabitCategory(
        habitId,
        normalizeHabitCategory(category)
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null = null
  ): TodayState {
    return this.inInitializedTransaction("updateHabitFrequency", () => {
      const today = this.getTodayKey();
      const previousProgress = this.repository.getHabitProgress(today, habitId);
      const normalizedFrequency = normalizeHabitFrequency(frequency);
      const normalizedTargetCount = normalizeHabitTargetCount(
        normalizedFrequency,
        targetCount
      );

      this.repository.removeStatusRowsForDate(today, habitId);
      this.repository.updateHabitFrequency(
        habitId,
        normalizedFrequency,
        normalizedTargetCount
      );
      this.preserveTodayHabitProgress(
        today,
        habitId,
        previousProgress,
        normalizedTargetCount
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitTargetCount(habitId: number, targetCount: number): TodayState {
    return this.inInitializedTransaction("updateHabitTargetCount", () => {
      const today = this.getTodayKey();
      const habit = this.repository
        .getHabits()
        .find((candidate) => candidate.id === habitId);

      if (!habit) {
        return this.rebuildCurrentTodayState();
      }

      const previousProgress = this.repository.getHabitProgress(today, habitId);
      const normalizedTargetCount = normalizeHabitTargetCount(
        habit.frequency,
        targetCount
      );
      this.repository.updateHabitTargetCount(habitId, normalizedTargetCount);
      this.preserveTodayHabitProgress(
        today,
        habitId,
        previousProgress,
        normalizedTargetCount
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState {
    return this.inInitializedTransaction("updateHabitWeekdays", () => {
      this.repository.removeStatusRowsForDate(this.getTodayKey(), habitId);
      this.repository.updateHabitWeekdays(
        habitId,
        normalizeHabitWeekdays(selectedWeekdays)
      );
      this.repository.ensureStatusRow(this.getTodayKey(), habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState {
    return this.mutateTodayState(
      "upsertFocusQuotaGoal",
      () => {
        const normalizedFrequency = normalizeGoalFrequency(frequency);
        if (
          !isValidFocusQuotaTargetMinutes(normalizedFrequency, targetMinutes)
        ) {
          throw new RangeError(
            `Invalid ${normalizedFrequency} focus quota target minutes.`
          );
        }

        this.repository.upsertFocusQuotaGoal(
          normalizedFrequency,
          normalizeFocusQuotaTargetMinutes(normalizedFrequency, targetMinutes),
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveFocusQuotaGoal(goalId: number): TodayState {
    return this.mutateTodayState(
      "archiveFocusQuotaGoal",
      () => {
        this.repository.archiveFocusQuotaGoal(
          goalId,
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  unarchiveFocusQuotaGoal(goalId: number): TodayState {
    return this.mutateTodayState(
      "unarchiveFocusQuotaGoal",
      () => {
        this.repository.unarchiveFocusQuotaGoal(
          goalId,
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("archiveHabit", () => {
      this.repository.archiveHabit(habitId);
      this.repository.normalizeHabitOrder();
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  unarchiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("unarchiveHabit", () => {
      this.repository.unarchiveHabit(habitId);
      this.repository.reorderHabits([
        ...this.repository
          .getHabits()
          .filter((habit) => habit.id !== habitId)
          .map((habit) => habit.id),
        habitId,
      ]);
      this.repository.ensureStatusRow(this.getTodayKey(), habitId);
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.inInitializedTransaction("reorderHabits", () => {
      const activeHabits = this.repository.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return this.rebuildCurrentTodayState();
      }

      this.repository.reorderHabits(habitIds);
      return this.rebuildCurrentTodayState();
    });
  }

  createWindDownAction(name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.inInitializedTransaction("createWindDownAction", () => {
      this.repository.createWindDownAction(
        trimmedName,
        this.clock.now().toISOString()
      );
      return this.rebuildCurrentTodayState();
    });
  }

  renameWindDownAction(actionId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.withInitialized(() => {
      this.repository.renameWindDownAction(actionId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  deleteWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("deleteWindDownAction", () => {
      this.repository.deleteWindDownAction(actionId);
      return this.rebuildCurrentTodayState();
    });
  }

  toggleWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("toggleWindDownAction", () => {
      const today = this.getTodayKey();
      this.repository.ensureWindDownStatusRowsForDate(today);
      this.repository.toggleWindDownAction(
        today,
        actionId,
        this.clock.now().toISOString()
      );
      return this.rebuildCurrentTodayState();
    });
  }

  private syncRollingState(): void {
    syncRollingState(this.repository, this.clock);
  }
}
