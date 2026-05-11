import { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
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
import {
  getFocusQuotaGoalPeriod,
  isFocusQuotaGoalComplete,
} from "@/shared/domain/goal";
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
import { isHabitScheduledForDate } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import type {
  WindDownAction,
  WindDownActionWithStatus,
} from "@/shared/domain/wind-down";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";
import { FakeClock } from "@/test/fixtures/fake-clock";

const DEFAULT_SETTLED_HISTORY_LIMIT = 365;

class FakeRepository implements AppRepository {
  failTransactionForLabel: string | null = null;
  habits: Habit[] = [
    {
      category: "productivity",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 1,
      isArchived: false,
      name: "Habit 1",
      selectedWeekdays: null,
      sortOrder: 0,
      targetCount: 1,
    },
  ];

  statusByPeriod = new Map<
    string,
    {
      end: string;
      frequency: HabitFrequency;
      start: string;
      values: Map<number, number>;
    }
  >();
  dailySummaries = new Map<string, DailySummary>();
  dayStatuses = new Map<string, DayStatus>();
  habitCarryovers = new Map<
    string,
    {
      completed: boolean;
      habitId: number;
      sourceDate: string;
      targetDate: string;
    }
  >();
  streak: StreakState = {
    availableFreezes: 1,
    bestStreak: 5,
    currentStreak: 3,
    lastEvaluatedDate: "2026-03-05",
  };
  habitStreakStates = new Map<number, PersistedHabitStreakState>();
  categoryStreakStates = new Map<string, PersistedCategoryStreakState>();
  settings: AppSettings = {
    ...createDefaultAppSettings("Asia/Singapore"),
    launchAtLogin: false,
    minimizeToTray: false,
    resetFocusTimerShortcut: "Command+Shift+Backspace",
    toggleFocusTimerShortcut: "Command+Shift+Space",
  };
  reminderRuntimeState: ReminderRuntimeState = {
    lastMidnightWarningSentAt: null,
    lastMissedReminderSentAt: null,
    lastReminderSentAt: null,
    snoozedUntil: null,
  };
  windDownRuntimeState: WindDownRuntimeState = {
    lastReminderSentAt: null,
  };
  windDownActions: WindDownAction[] = [];
  windDownCompletedActionIdsByDate = new Map<string, Set<number>>();
  focusSessions: FocusSession[] = [];
  focusQuotaGoals: FocusQuotaGoal[] = [];
  focusTimerState: PersistedFocusTimerState | null = null;

  initializeSchema = (): void => {
    void this.habits;
  };
  runInTransaction<A>(label: string, execute: () => A): A {
    if (this.failTransactionForLabel === label) {
      throw new Error(`transaction failed: ${label}`);
    }

    return execute();
  }
  seedDefaults = (): void => {
    void this.habits;
  };

  getHabits(): Habit[] {
    return this.habits
      .filter((habit) => !habit.isArchived)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
  }

  getFocusQuotaGoals(includeArchived = false): FocusQuotaGoal[] {
    return this.focusQuotaGoals
      .filter((goal) => includeArchived || !goal.isArchived)
      .toSorted((left, right) => left.frequency.localeCompare(right.frequency));
  }

  getFocusQuotaGoalsWithStatusForDate(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.buildFocusQuotaGoalsWithStatus(date);
  }

  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.buildFocusQuotaGoalsWithStatus(date);
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.getHabits()
      .filter((habit) => isHabitScheduledForDate(habit, date))
      .map((habit) => ({
        ...habit,
        completed:
          (this.getStatusValues(date, habit.frequency).get(habit.id) ?? 0) >=
          (habit.targetCount ?? 1),
        completedCount:
          this.getStatusValues(date, habit.frequency).get(habit.id) ?? 0,
      }));
  }

  getHabitWithStatus(date: string, habitId: number): HabitWithStatus | null {
    return (
      this.getHabitsWithStatus(date).find((habit) => habit.id === habitId) ??
      null
    );
  }

  getHistoricalHabitPeriodStatusesOverlappingRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return [...this.statusByPeriod.values()]
      .filter((entry) => entry.start <= end && entry.end >= start)
      .flatMap((entry) =>
        [...entry.values.entries()].map(([habitId, completedCount]) => {
          const habit = this.habits.find((item) => item.id === habitId);

          if (!habit) {
            throw new Error(`Unknown habit ${habitId}`);
          }

          return {
            category: habit.category,
            completed: completedCount >= (habit.targetCount ?? 1),
            completedCount,
            createdAt: habit.createdAt,
            frequency: entry.frequency,
            habitId,
            name: habit.name,
            periodEnd: entry.end,
            periodStart: entry.start,
            selectedWeekdays: habit.selectedWeekdays ?? null,
            sortOrder: habit.sortOrder,
            targetCount: habit.targetCount ?? 1,
          };
        })
      );
  }

  getHabitProgress(date: string, habitId: number): number {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit || !isHabitScheduledForDate(habit, date)) {
      return 0;
    }

    return this.getStatusValues(date, habit.frequency).get(habitId) ?? 0;
  }

  getDayStatus(date: string): DayStatus | null {
    return this.dayStatuses.get(date) ?? null;
  }

  getHabitCarryoversForDate(targetDate: string) {
    return [...this.habitCarryovers.values()]
      .filter((carryover) => carryover.targetDate === targetDate)
      .map((carryover) => {
        const habit = this.habits.find((item) => item.id === carryover.habitId);
        if (!habit) {
          return null;
        }

        return {
          ...habit,
          completed: carryover.completed,
          completedCount: carryover.completed ? (habit.targetCount ?? 1) : 0,
          sourceDate: carryover.sourceDate,
          targetDate: carryover.targetDate,
        };
      })
      .filter((carryover) => carryover !== null);
  }

  ensureStatusRowsForDate(date: string): void {
    const scheduledHabits = this.getHabits().filter((habit) =>
      isHabitScheduledForDate(habit, date)
    );

    for (const habit of scheduledHabits) {
      this.getStatusValues(date, habit.frequency).set(
        habit.id,
        this.getStatusValues(date, habit.frequency).get(habit.id) ?? 0
      );
    }
  }

  ensureStatusRow(date: string, habitId: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit || !isHabitScheduledForDate(habit, date)) {
      return;
    }

    this.getStatusValues(date, habit.frequency).set(habitId, 0);
  }

  removeStatusRowsForDate(date: string, habitId: number): void {
    const dailyPeriod = getHabitPeriod("daily", date);
    const weeklyPeriod = getHabitPeriod("weekly", date);
    const monthlyPeriod = getHabitPeriod("monthly", date);
    const periodKeys = [
      FakeRepository.getPeriodKey("daily", dailyPeriod.start),
      FakeRepository.getPeriodKey("weekly", weeklyPeriod.start),
      FakeRepository.getPeriodKey("monthly", monthlyPeriod.start),
    ];

    for (const key of periodKeys) {
      const entry = this.statusByPeriod.get(key);
      if (!entry) {
        continue;
      }

      entry.values.delete(habitId);
      if (entry.values.size === 0) {
        this.statusByPeriod.delete(key);
      }
    }
  }

  toggleHabit(date: string, habitId: number, _completedAt?: string): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const values = this.getStatusValues(date, habit.frequency);
    const current = values.get(habitId) ?? 0;
    values.set(habitId, current > 0 ? 0 : (habit.targetCount ?? 1));
  }

  setHabitProgress(
    date: string,
    habitId: number,
    completedCount: number
  ): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit || !isHabitScheduledForDate(habit, date)) {
      return;
    }

    this.getStatusValues(date, habit.frequency).set(
      habitId,
      Math.max(0, Math.round(completedCount))
    );
  }

  adjustHabitProgress(
    date: string,
    habitId: number,
    delta: number,
    _completedAt?: string
  ): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const values = this.getStatusValues(date, habit.frequency);
    const current = values.get(habitId) ?? 0;
    values.set(habitId, Math.max(0, current + delta));
  }

  getFocusSessions(limit?: number): FocusSession[] {
    const sessions = [...this.focusSessions].toSorted((left, right) =>
      right.completedAt.localeCompare(left.completedAt)
    );

    return limit === undefined ? sessions : sessions.slice(0, limit);
  }

  getFocusSessionsInRange(start: string, end: string): FocusSession[] {
    return this.focusSessions
      .filter(
        (session) =>
          session.completedDate >= start && session.completedDate <= end
      )
      .toSorted((left, right) =>
        left.completedAt.localeCompare(right.completedAt)
      );
  }

  saveFocusSession(input: CreateFocusSessionInput): FocusSession {
    const focusSession = {
      ...input,
      id: this.focusSessions.length + 1,
    };
    this.focusSessions.unshift(focusSession);
    return focusSession;
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.focusTimerState;
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    this.focusTimerState = state;
    return state;
  }

  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[] {
    const history = [...this.dailySummaries.values()].toSorted((left, right) =>
      right.date.localeCompare(left.date)
    );
    const effectiveLimit =
      options?.uncapped === true
        ? undefined
        : (limit ?? DEFAULT_SETTLED_HISTORY_LIMIT);

    return effectiveLimit === undefined
      ? history
      : history.slice(0, effectiveLimit);
  }

  getSettledHistoryYears(): number[] {
    return [
      ...new Set(
        [...this.dailySummaries.values()].map((summary) =>
          Number(summary.date.slice(0, 4))
        )
      ),
    ].toSorted((left, right) => right - left);
  }

  getDailySummariesInRange(start: string, end: string): DailySummary[] {
    return [...this.dailySummaries.values()]
      .filter((summary) => summary.date >= start && summary.date <= end)
      .toSorted((left, right) => left.date.localeCompare(right.date));
  }

  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return [...this.statusByPeriod.values()]
      .filter((entry) => entry.end >= start && entry.end <= end)
      .flatMap((entry) =>
        [...entry.values.entries()].map(([habitId, completedCount]) => {
          const habit = this.habits.find((item) => item.id === habitId);

          if (!habit) {
            throw new Error(`Unknown habit ${habitId}`);
          }

          return {
            category: habit.category,
            completed: completedCount >= (habit.targetCount ?? 1),
            completedCount,
            frequency: entry.frequency,
            habitId,
            name: habit.name,
            periodEnd: entry.end,
            periodStart: entry.start,
            selectedWeekdays: habit.selectedWeekdays ?? null,
            sortOrder: habit.sortOrder,
            targetCount: habit.targetCount ?? 1,
          };
        })
      )
      .toSorted((left, right) => {
        if (left.periodEnd !== right.periodEnd) {
          return left.periodEnd.localeCompare(right.periodEnd);
        }

        return left.sortOrder - right.sortOrder;
      });
  }

  getPersistedStreakState(): StreakState {
    return { ...this.streak };
  }

  savePersistedStreakState(state: StreakState): void {
    this.streak = { ...state };
  }

  getPersistedHabitStreakStates(
    habitIds: readonly number[]
  ): PersistedHabitStreakState[] {
    return habitIds.flatMap((habitId) => {
      const state = this.habitStreakStates.get(habitId);
      return state ? [{ ...state }] : [];
    });
  }

  savePersistedHabitStreakStates(
    states: readonly PersistedHabitStreakState[]
  ): void {
    for (const state of states) {
      this.habitStreakStates.set(state.habitId, { ...state });
    }
  }

  getPersistedCategoryStreakStates(): PersistedCategoryStreakState[] {
    return [...this.categoryStreakStates.values()].map((state) => ({
      ...state,
    }));
  }

  savePersistedCategoryStreakStates(
    states: readonly PersistedCategoryStreakState[]
  ): void {
    for (const state of states) {
      this.categoryStreakStates.set(state.category, { ...state });
    }
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return { ...this.reminderRuntimeState };
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.reminderRuntimeState = { ...state };
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return { ...this.windDownRuntimeState };
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.windDownRuntimeState = { ...state };
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  saveSettings(settings: AppSettings): AppSettings {
    this.settings = { ...settings };
    return { ...this.settings };
  }

  getWindDownActions(): WindDownAction[] {
    return this.windDownActions.toSorted((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id - right.id;
    });
  }

  getWindDownActionsWithStatus(date: string): WindDownActionWithStatus[] {
    const completedActionIds =
      this.windDownCompletedActionIdsByDate.get(date) ?? new Set<number>();

    return this.getWindDownActions().map((action) => ({
      ...action,
      completed: completedActionIds.has(action.id),
      completedAt: completedActionIds.has(action.id)
        ? `${date}T21:00:00.000Z`
        : null,
    }));
  }

  ensureWindDownStatusRowsForDate(date: string): void {
    if (!this.windDownCompletedActionIdsByDate.has(date)) {
      this.windDownCompletedActionIdsByDate.set(date, new Set());
    }
  }

  createWindDownAction(name: string, createdAt: string): number {
    const id = this.windDownActions.length + 1;
    this.windDownActions.push({
      createdAt,
      id,
      name,
      sortOrder: this.windDownActions.length,
    });
    return id;
  }

  renameWindDownAction(actionId: number, name: string): void {
    const action = this.windDownActions.find((item) => item.id === actionId);
    if (action) {
      action.name = name;
    }
  }

  deleteWindDownAction(actionId: number): void {
    this.windDownActions = this.windDownActions
      .filter((action) => action.id !== actionId)
      .map((action, index) => ({
        ...action,
        sortOrder: index,
      }));

    for (const completedActionIds of this.windDownCompletedActionIdsByDate.values()) {
      completedActionIds.delete(actionId);
    }
  }

  toggleWindDownAction(date: string, actionId: number): void {
    const completedActionIds =
      this.windDownCompletedActionIdsByDate.get(date) ?? new Set<number>();

    if (completedActionIds.has(actionId)) {
      completedActionIds.delete(actionId);
    } else {
      completedActionIds.add(actionId);
    }

    this.windDownCompletedActionIdsByDate.set(date, completedActionIds);
  }

  getFirstTrackedDate(): string | null {
    const keys = new Set<string>([
      ...[...this.statusByPeriod.values()].map((entry) => entry.start),
      ...this.dailySummaries.keys(),
      this.streak.lastEvaluatedDate ?? "",
    ]);
    const values = [...keys].filter(Boolean).toSorted();
    return values[0] ?? null;
  }

  getLatestTrackedDate(): string | null {
    const keys = new Set<string>([
      ...[...this.statusByPeriod.values()].map((entry) => entry.end),
      ...this.dailySummaries.keys(),
      this.streak.lastEvaluatedDate ?? "",
    ]);
    const values = [...keys].filter(Boolean).toSorted();
    return values.at(-1) ?? null;
  }

  getExistingCompletedAt(date: string): string | null {
    return this.dailySummaries.get(date)?.completedAt ?? null;
  }

  setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void {
    this.dayStatuses.set(date, {
      createdAt,
      date,
      kind,
    });
  }

  createHabitCarryovers(sourceDate: string, targetDate: string): void {
    const unfinishedDailyHabits = this.getHabitsWithStatus(sourceDate).filter(
      (habit) => habit.frequency === "daily" && !habit.completed
    );

    for (const habit of unfinishedDailyHabits) {
      this.habitCarryovers.set(`${sourceDate}:${targetDate}:${habit.id}`, {
        completed: false,
        habitId: habit.id,
        sourceDate,
        targetDate,
      });
    }
  }

  toggleHabitCarryover(
    targetDate: string,
    sourceDate: string,
    habitId: number
  ): void {
    const key = `${sourceDate}:${targetDate}:${habitId}`;
    const carryover = this.habitCarryovers.get(key);
    if (carryover) {
      carryover.completed = !carryover.completed;
    }
  }

  clearHabitCarryoversFromSourceDate(sourceDate: string): void {
    for (const key of this.habitCarryovers.keys()) {
      if (key.startsWith(`${sourceDate}:`)) {
        this.habitCarryovers.delete(key);
      }
    }
  }

  clearDayStatus(date: string): void {
    this.dayStatuses.delete(date);
  }

  saveDailySummary(summary: DailySummary): void {
    this.dailySummaries.set(summary.date, summary);
  }

  getMaxSortOrder(): number {
    return Math.max(...this.getHabits().map((habit) => habit.sortOrder), -1);
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
    const id = this.habits.length + 1;
    this.habits.push({
      category,
      createdAt,
      frequency,
      id,
      isArchived: false,
      name,
      selectedWeekdays,
      sortOrder,
      targetCount,
    });
    return id;
  }

  renameHabit(habitId: number, name: string): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.name = name;
    }
  }

  updateHabitCategory(habitId: number, category: HabitCategory): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.category = category;
    }
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number
  ): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.frequency = frequency;
      habit.selectedWeekdays = null;
      habit.targetCount = targetCount;
    }
  }

  updateHabitTargetCount(habitId: number, targetCount: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.targetCount = targetCount;
    }
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.selectedWeekdays = selectedWeekdays;
    }
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void {
    const existing = this.focusQuotaGoals.find(
      (goal) => goal.frequency === frequency && !goal.isArchived
    );

    if (existing) {
      if (existing.targetMinutes === targetMinutes) {
        return;
      }

      existing.archivedAt = createdAt;
      existing.isArchived = true;
    }

    this.focusQuotaGoals.push({
      archivedAt: null,
      createdAt,
      frequency,
      id: this.focusQuotaGoals.length + 1,
      isArchived: false,
      targetMinutes,
    });
  }

  archiveFocusQuotaGoal(goalId: number, archivedAt: string): void {
    const goal = this.focusQuotaGoals.find((item) => item.id === goalId);
    if (goal) {
      goal.archivedAt = archivedAt;
      goal.isArchived = true;
    }
  }

  unarchiveFocusQuotaGoal(goalId: number, restoredAt: string): void {
    const goal = this.focusQuotaGoals.find((item) => item.id === goalId);
    if (!goal) {
      return;
    }

    for (const candidate of this.focusQuotaGoals) {
      if (candidate.frequency === goal.frequency && !candidate.isArchived) {
        candidate.archivedAt = restoredAt;
        candidate.isArchived = true;
      }
    }

    goal.archivedAt = null;
    goal.isArchived = false;
  }

  archiveHabit(habitId: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.isArchived = true;
    }
  }

  unarchiveHabit(habitId: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.isArchived = false;
    }
  }

  normalizeHabitOrder(): void {
    for (const [index, habit] of this.getHabits().entries()) {
      habit.sortOrder = index;
    }
  }

  reorderHabits(habitIds: number[]): void {
    for (const [index, habitId] of habitIds.entries()) {
      const habit = this.habits.find((item) => item.id === habitId);
      if (habit) {
        habit.sortOrder = index;
      }
    }
  }

  setStatusForDate(
    date: string,
    values: Map<number, boolean>,
    frequency: HabitFrequency = "daily"
  ): void {
    const period = getHabitPeriod(frequency, date);
    this.statusByPeriod.set(
      FakeRepository.getPeriodKey(frequency, period.start),
      {
        end: period.end,
        frequency,
        start: period.start,
        values: new Map(
          [...values.entries()].map(([habitId, completed]) => [
            habitId,
            completed ? 1 : 0,
          ])
        ),
      }
    );
  }

  private getStatusValues(
    date: string,
    frequency: HabitFrequency
  ): Map<number, number> {
    const period = getHabitPeriod(frequency, date);
    const key = FakeRepository.getPeriodKey(frequency, period.start);
    const existing = this.statusByPeriod.get(key);

    if (existing) {
      return existing.values;
    }

    const values = new Map<number, number>();
    this.statusByPeriod.set(key, {
      end: period.end,
      frequency,
      start: period.start,
      values,
    });
    return values;
  }

  private static getPeriodKey(
    frequency: HabitFrequency,
    periodStart: string
  ): string {
    return `${frequency}:${periodStart}`;
  }

  private buildFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.focusQuotaGoals
      .filter((goal) => {
        const createdOn = goal.createdAt.slice(0, 10);
        const archivedOn = goal.archivedAt?.slice(0, 10) ?? null;
        return createdOn <= date && (archivedOn === null || archivedOn > date);
      })
      .toSorted((left, right) => left.frequency.localeCompare(right.frequency))
      .map((goal) => {
        const period = getFocusQuotaGoalPeriod(goal.frequency, date);
        const completedMinutes = this.getFocusSessionsInRange(
          period.start,
          period.end
        ).reduce(
          (total, session) =>
            total + Math.max(1, Math.round(session.durationSeconds / 60)),
          0
        );

        return {
          ...goal,
          completed: isFocusQuotaGoalComplete(goal, completedMinutes),
          completedMinutes,
          kind: "focus-quota",
          periodEnd: period.end,
          periodStart: period.start,
        };
      });
  }
}

describe("habitService rollover", () => {
  it("uses a freeze for the first missed closed day and resets on the next missed day", () => {
    const repository = new FakeRepository();
    repository.habitStreakStates.set(1, {
      bestStreak: 5,
      currentStreak: 3,
      habitId: 1,
      lastEvaluatedDate: "2026-03-05",
    });
    repository.setStatusForDate("2026-03-06", new Map([[1, false]]));
    repository.setStatusForDate("2026-03-07", new Map([[1, false]]));

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.getTodayState();

    expect(repository.dailySummaries.get("2026-03-06")).toStrictEqual({
      allCompleted: false,
      completedAt: null,
      date: "2026-03-06",
      dayStatus: null,
      freezeUsed: true,
      streakCountAfterDay: 3,
    });

    expect(repository.dailySummaries.get("2026-03-07")).toStrictEqual({
      allCompleted: false,
      completedAt: null,
      date: "2026-03-07",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 0,
    });

    expect(todayState.streak).toStrictEqual({
      availableFreezes: 0,
      bestStreak: 5,
      currentStreak: 0,
      lastEvaluatedDate: "2026-03-07",
    });
    expect(repository.habitStreakStates.get(1)).toStrictEqual({
      bestStreak: 5,
      currentStreak: 0,
      habitId: 1,
      lastEvaluatedDate: "2026-03-07",
    });
  });

  it("increments category streaks only when all daily habits in the category complete", () => {
    const repository = new FakeRepository();
    repository.streak = {
      availableFreezes: 0,
      bestStreak: 3,
      currentStreak: 1,
      lastEvaluatedDate: "2026-03-05",
    };
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: false,
      name: "Run",
      selectedWeekdays: null,
      sortOrder: 1,
      targetCount: 1,
    });
    repository.categoryStreakStates.set("productivity", {
      bestStreak: 3,
      category: "productivity",
      currentStreak: 1,
      lastEvaluatedDate: "2026-03-05",
    });
    repository.categoryStreakStates.set("fitness", {
      bestStreak: 2,
      category: "fitness",
      currentStreak: 2,
      lastEvaluatedDate: "2026-03-05",
    });
    repository.setStatusForDate(
      "2026-03-06",
      new Map([
        [1, true],
        [2, true],
      ])
    );
    repository.setStatusForDate(
      "2026-03-07",
      new Map([
        [1, false],
        [2, true],
      ])
    );

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.getTodayState();

    expect(repository.categoryStreakStates.get("productivity")).toStrictEqual({
      bestStreak: 3,
      category: "productivity",
      currentStreak: 0,
      lastEvaluatedDate: "2026-03-07",
    });
    expect(repository.categoryStreakStates.get("fitness")).toStrictEqual({
      bestStreak: 4,
      category: "fitness",
      currentStreak: 4,
      lastEvaluatedDate: "2026-03-07",
    });
  });

  it("keeps category streaks neutral for empty and frozen category days", () => {
    const repository = new FakeRepository();
    repository.streak = {
      availableFreezes: 1,
      bestStreak: 3,
      currentStreak: 3,
      lastEvaluatedDate: "2026-03-05",
    };
    repository.categoryStreakStates.set("fitness", {
      bestStreak: 4,
      category: "fitness",
      currentStreak: 4,
      lastEvaluatedDate: "2026-03-05",
    });
    repository.setStatusForDate("2026-03-06", new Map([[1, false]]));
    const [habit] = repository.habits;
    if (!habit) {
      throw new Error("Expected default habit.");
    }
    repository.habits[0] = { ...habit, category: "productivity" };

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-07", "2026-03-07T09:00:00.000Z")
    );

    service.getTodayState();

    expect(repository.dailySummaries.get("2026-03-06")?.freezeUsed).toBe(true);
    expect(repository.categoryStreakStates.get("fitness")).toStrictEqual({
      bestStreak: 4,
      category: "fitness",
      currentStreak: 4,
      lastEvaluatedDate: "2026-03-06",
    });
  });
});

describe("habit categories", () => {
  it("creates habits with the selected category", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.createHabit("Drink water", "nutrition", "daily");

    expect(todayState.habits[0]).toMatchObject({
      category: "nutrition",
      name: "Drink water",
      sortOrder: 0,
    });
    expect(todayState.habits[1]).toMatchObject({
      name: "Habit 1",
      sortOrder: 1,
    });
  });

  it("creates daily habits that are only due on selected weekdays", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const todayState = service.createHabit(
      "Gym session",
      "fitness",
      "daily",
      [1, 3, 5]
    );

    expect(todayState.habits.map((habit) => habit.name)).toStrictEqual([
      "Habit 1",
    ]);
    expect(
      repository.habits.find((habit) => habit.name === "Gym session")
    ).toMatchObject({
      frequency: "daily",
      selectedWeekdays: [1, 3, 5],
    });
  });

  it("updates a habit category and returns refreshed state", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitCategory(1, "fitness");

    expect(todayState.habits[0]?.category).toBe("fitness");
  });

  it("updates a habit frequency and returns refreshed state", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitFrequency(1, "weekly");

    expect(todayState.habits[0]?.frequency).toBe("weekly");
  });

  it.each(["weekly", "monthly"] as const)(
    "allows %s habit progress to exceed the target count",
    (frequency) => {
      const repository = new FakeRepository();
      const [existingHabit] = repository.habits;
      if (!existingHabit) {
        throw new Error("Expected a seeded habit.");
      }

      repository.habits[0] = {
        ...existingHabit,
        frequency,
        targetCount: 2,
      };
      repository.setHabitProgress("2026-03-08", 1, 2);

      const service = new HabitsApplicationService(
        repository,
        new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
      );

      const patch = service.incrementHabitProgress(1);

      expect(patch.habit).toMatchObject({
        completed: true,
        completedCount: 3,
        frequency,
        targetCount: 2,
      });
    }
  );

  it("preserves current progress when updating a habit target count", () => {
    const repository = new FakeRepository();
    const [existingHabit] = repository.habits;
    if (!existingHabit) {
      throw new Error("Expected a seeded habit.");
    }

    repository.habits[0] = {
      ...existingHabit,
      frequency: "weekly",
      targetCount: 3,
    };
    repository.setStatusForDate("2026-03-08", new Map([[1, true]]), "weekly");
    repository.adjustHabitProgress("2026-03-08", 1, 1);

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitTargetCount(1, 4);

    expect(todayState.habits[0]).toMatchObject({
      completed: false,
      completedCount: 2,
      frequency: "weekly",
      targetCount: 4,
    });
  });

  it("carries forward current progress when changing a habit frequency", () => {
    const repository = new FakeRepository();
    const [existingHabit] = repository.habits;
    if (!existingHabit) {
      throw new Error("Expected a seeded habit.");
    }

    repository.habits[0] = {
      ...existingHabit,
      frequency: "weekly",
      targetCount: 3,
    };
    repository.setStatusForDate("2026-03-08", new Map([[1, true]]), "weekly");
    repository.adjustHabitProgress("2026-03-08", 1, 1);

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitFrequency(1, "monthly", 5);

    expect(todayState.habits[0]).toMatchObject({
      completed: false,
      completedCount: 2,
      frequency: "monthly",
      targetCount: 5,
    });
  });

  it("caps progress to the new target when downgrading from daily to weekly with a lower target", () => {
    const repository = new FakeRepository();
    const [existingHabit] = repository.habits;
    if (!existingHabit) {
      throw new Error("Expected a seeded habit.");
    }

    repository.habits[0] = {
      ...existingHabit,
      frequency: "daily",
      targetCount: 1,
    };
    repository.setStatusForDate("2026-03-08", new Map([[1, true]]));

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitFrequency(1, "weekly", 1);

    expect(todayState.habits[0]).toMatchObject({
      completed: true,
      completedCount: 1,
      frequency: "weekly",
      targetCount: 1,
    });
  });

  it("clears progress when switching from daily to weekly on a non-week-start day", () => {
    const repository = new FakeRepository();
    const [existingHabit] = repository.habits;
    if (!existingHabit) {
      throw new Error("Expected a seeded habit.");
    }

    repository.habits[0] = {
      ...existingHabit,
      frequency: "daily",
      targetCount: 1,
    };
    repository.setStatusForDate("2026-03-10", new Map([[1, true]]));

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const todayState = service.updateHabitFrequency(1, "weekly");

    expect(todayState.habits[0]).toMatchObject({
      frequency: "weekly",
    });
  });

  it("uses the default target count when none is provided for the new frequency", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.updateHabitFrequency(1, "weekly");

    expect(todayState.habits[0]).toMatchObject({
      frequency: "weekly",
      targetCount: 1,
    });
  });

  it("removes a daily habit from today when its weekday schedule no longer includes today", () => {
    const repository = new FakeRepository();
    repository.setStatusForDate("2026-03-10", new Map([[1, false]]));
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const todayState = service.updateHabitWeekdays(1, [1, 3, 5]);

    expect(todayState.habits).toStrictEqual([]);
    expect(repository.habits[0]?.selectedWeekdays).toStrictEqual([1, 3, 5]);
    expect(
      repository.getHabitPeriodStatusesEndingInRange("2026-03-10", "2026-03-10")
    ).toStrictEqual([]);
  });

  it("ignores reorder payloads that do not match the active habit ids", () => {
    const repository = new FakeRepository();
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: false,
      name: "Habit 2",
      sortOrder: 1,
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.reorderHabits([1, 999]);

    expect(todayState.habits.map((habit) => habit.id)).toStrictEqual([1, 2]);
  });

  it("restores an archived habit to the end of the active list", () => {
    const repository = new FakeRepository();
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: true,
      name: "Habit 2",
      sortOrder: 1,
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const todayState = service.unarchiveHabit(2);

    expect(todayState.habits.map((habit) => habit.id)).toStrictEqual([1, 2]);
    expect(repository.habits.find((habit) => habit.id === 2)).toMatchObject({
      isArchived: false,
      sortOrder: 1,
    });
  });
});

describe("habit carryovers", () => {
  it("moves unfinished daily habits to tomorrow and preserves today", () => {
    const repository = new FakeRepository();
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: false,
      name: "Walk",
      selectedWeekdays: null,
      sortOrder: 1,
      targetCount: 1,
    });
    repository.setStatusForDate(
      "2026-03-08",
      new Map([
        [1, true],
        [2, false],
      ])
    );
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const today = service.moveUnfinishedHabitsToTomorrow();

    expect(today.dayStatus).toBe("rescheduled");
    expect(repository.getHabitCarryoversForDate("2026-03-09")).toMatchObject([
      {
        completed: false,
        id: 2,
        name: "Walk",
        sourceDate: "2026-03-08",
        targetDate: "2026-03-09",
      },
    ]);
  });

  it("toggles carried-over habits without changing source-day progress", () => {
    const repository = new FakeRepository();
    repository.setStatusForDate("2026-03-08", new Map([[1, false]]));
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );
    service.moveUnfinishedHabitsToTomorrow();

    const tomorrowService = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-09", "2026-03-09T09:00:00.000Z")
    );
    const tomorrow = tomorrowService.toggleHabitCarryover("2026-03-08", 1);

    expect(tomorrow.habitCarryovers).toMatchObject([
      {
        completed: true,
        id: 1,
        sourceDate: "2026-03-08",
      },
    ]);
    expect(repository.getHabitProgress("2026-03-08", 1)).toBe(0);
  });

  it("clears carryovers when undoing a rescheduled day", () => {
    const repository = new FakeRepository();
    repository.setStatusForDate("2026-03-08", new Map([[1, false]]));
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );
    service.moveUnfinishedHabitsToTomorrow();

    const today = service.setDayStatus(null);

    expect(today.dayStatus).toBeNull();
    expect(repository.getHabitCarryoversForDate("2026-03-09")).toHaveLength(0);
  });
});

describe("history retrieval", () => {
  it("returns the full settled history plus the current day preview", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-07";
    repository.setStatusForDate(
      "2026-03-07",
      new Map([
        [1, true],
        [2, false],
      ])
    );
    repository.setStatusForDate(
      "2026-01-15",
      new Map([
        [1, true],
        [2, true],
      ])
    );
    repository.dailySummaries.set("2026-03-07", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-07",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 2,
    });
    repository.dailySummaries.set("2026-01-15", {
      allCompleted: true,
      completedAt: "2026-01-15T21:00:00.000Z",
      date: "2026-01-15",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 6,
    });
    repository.dailySummaries.set("2025-04-01", {
      allCompleted: false,
      completedAt: null,
      date: "2025-04-01",
      dayStatus: null,
      freezeUsed: true,
      streakCountAfterDay: 3,
    });
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-01-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: true,
      name: "Archived habit",
      sortOrder: 1,
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const history = service.getHistory();

    expect(history.map((day) => day.date)).toStrictEqual([
      "2026-03-08",
      "2026-03-07",
      "2026-01-15",
      "2025-04-01",
    ]);
    expect(history[1]?.habits.map((habit) => habit.name)).toStrictEqual([
      "Habit 1",
      "Archived habit",
    ]);
    expect(history[1]?.summary.freezeUsed).toBeFalsy();
    expect(history[0]?.categoryProgress).toHaveLength(3);
  });

  it("limits history responses without dropping today's preview", () => {
    const repository = new FakeRepository();
    repository.dailySummaries.set("2026-03-07", {
      allCompleted: true,
      completedAt: "2026-03-07T21:00:00.000Z",
      date: "2026-03-07",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.dailySummaries.set("2026-03-06", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-06",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 3,
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const history = service.getHistory(2);

    expect(history.map((day) => day.date)).toStrictEqual([
      "2026-03-08",
      "2026-03-07",
    ]);
  });

  it("keeps historical focus quota targets after later updates", () => {
    const repository = new FakeRepository();
    repository.dailySummaries.set("2026-03-07", {
      allCompleted: true,
      completedAt: "2026-03-07T21:00:00.000Z",
      date: "2026-03-07",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.focusSessions.push({
      completedAt: "2026-03-07T09:30:00.000Z",
      completedDate: "2026-03-07",
      durationSeconds: 120 * 60,
      entryKind: "completed",
      id: 1,
      startedAt: "2026-03-07T07:30:00.000Z",
      timerSessionId: "quota-history-1",
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-07", "2026-03-07T09:00:00.000Z")
    );
    service.upsertFocusQuotaGoal("weekly", 300);

    const nextDayService = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );
    nextDayService.upsertFocusQuotaGoal("weekly", 480);

    const history = nextDayService.getHistory();
    const march7 = history.find((day) => day.date === "2026-03-07");
    const march8 = history.find((day) => day.date === "2026-03-08");

    expect(march7?.focusQuotaGoals?.[0]).toMatchObject({
      completedMinutes: 120,
      targetMinutes: 300,
    });
    expect(march8?.focusQuotaGoals?.[0]).toMatchObject({
      targetMinutes: 480,
    });
  });

  it("rejects invalid focus quota targets instead of silently clamping them", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    expect(() => service.upsertFocusQuotaGoal("weekly", 20_000)).toThrow(
      RangeError
    );
    expect(repository.getFocusQuotaGoals()).toHaveLength(0);
  });

  it("keeps the full history path uncapped when no limit is provided", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-08";

    for (let index = 0; index < 400; index += 1) {
      const date = new Date(Date.UTC(2025, 0, 1 + index))
        .toISOString()
        .slice(0, 10);
      const allCompleted = index % 2 === 0;
      const completedAt = allCompleted ? `${date}T21:00:00.000Z` : null;

      repository.dailySummaries.set(date, {
        allCompleted,
        completedAt,
        date,
        dayStatus: null,
        freezeUsed: index % 5 === 0,
        streakCountAfterDay: index + 1,
      });
    }

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const history = service.getHistory();

    expect(history).toHaveLength(401);
    expect(history[1]?.date).toBe("2026-02-04");
    expect(history.at(-1)?.date).toBe("2025-01-01");
  });

  it("builds year summaries with today preview and no duplicate today row", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-09";
    repository.dailySummaries.set("2026-03-10", {
      allCompleted: true,
      completedAt: "2026-03-10T21:00:00.000Z",
      date: "2026-03-10",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 8,
    });
    repository.dailySummaries.set("2026-03-09", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-09",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 7,
    });
    repository.dailySummaries.set("2025-12-31", {
      allCompleted: true,
      completedAt: "2025-12-31T21:00:00.000Z",
      date: "2025-12-31",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.setStatusForDate("2026-03-09", new Map([[1, true]]));
    repository.focusSessions.push({
      completedAt: "2026-03-09T09:30:00.000Z",
      completedDate: "2026-03-09",
      durationSeconds: 25 * 60,
      entryKind: "completed",
      id: 1,
      startedAt: "2026-03-09T09:05:00.000Z",
      timerSessionId: "summary-year-focus",
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const summary = service.getHistorySummaryForYear(2026);

    expect(summary.map((day) => day.date)).toStrictEqual([
      "2026-03-10",
      "2026-03-09",
    ]);
    expect(summary[1]?.focusMinutes).toBe(25);
    expect(summary[1]?.categoryProgress).toContainEqual({
      category: "productivity",
      completed: 1,
      progress: 100,
      total: 1,
    });
    expect(service.getHistorySummaryForYear(2024)).toStrictEqual([]);
  });

  it("builds a weekly review overview for completed weeks", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-08";
    repository.dailySummaries.set("2026-03-02", {
      allCompleted: true,
      completedAt: "2026-03-02T21:00:00.000Z",
      date: "2026-03-02",
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.dailySummaries.set("2026-03-03", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-03",
      dayStatus: null,
      freezeUsed: true,
      streakCountAfterDay: 4,
    });
    repository.setStatusForDate("2026-03-02", new Map([[1, true]]));
    repository.setStatusForDate(
      "2026-03-07",
      new Map([
        [1, true],
        [2, false],
      ]),
      "weekly"
    );
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "weekly",
      id: 2,
      isArchived: false,
      name: "Weekly stretch",
      sortOrder: 1,
    });

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const overview = service.getWeeklyReviewOverview();

    expect(overview.latestReview).not.toBeNull();
    expect(overview.latestReview?.weekStart).toBe("2026-03-02");
    expect(
      overview.latestReview?.habitMetrics.map((metric) => metric.name)
    ).toContain("Weekly stretch");
  });

  it("excludes archived habits from insights through the service path", () => {
    const repository = new FakeRepository();
    repository.habits.push({
      category: "fitness",
      createdAt: "2026-03-01T00:00:00.000Z",
      frequency: "daily",
      id: 2,
      isArchived: true,
      name: "Archived habit",
      selectedWeekdays: null,
      sortOrder: 0,
      targetCount: 1,
    });
    repository.setStatusForDate(
      "2026-03-10",
      new Map([
        [1, true],
        [2, true],
      ])
    );

    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    const dashboard = service.getInsightsDashboard();

    expect(dashboard.summary.completed.value).toBe("1");
    expect(dashboard.habitLeaderboard.map((habit) => habit.name)).toStrictEqual(
      ["Habit 1"]
    );
  });
});

describe("focus sessions", () => {
  it("records a completed focus session", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    const focusSession = service.recordFocusSession({
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    });

    expect(focusSession).toMatchObject({
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      id: 1,
    });
    expect(service.getFocusSessions()).toHaveLength(1);
  });

  it("records focus session dates in the OS timezone", () => {
    const repository = new FakeRepository();
    repository.settings = {
      ...repository.settings,
      timezone: "UTC",
    };
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-09", "2026-03-08T09:00:00.000Z", "Asia/Singapore")
    );

    const focusSession = service.recordFocusSession({
      completedAt: "2026-03-08T23:30:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T23:05:00.000Z",
      timerSessionId: "timer-session-timezone",
    });

    expect(focusSession.completedDate).toBe("2026-03-09");
  });

  it("rejects invalid focus session payloads", () => {
    const service = new HabitsApplicationService(
      new FakeRepository(),
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    expect(() =>
      service.recordFocusSession({
        completedAt: "bad-timestamp",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        entryKind: "completed",
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-invalid",
      } as CreateFocusSessionInput)
    ).toThrow("ISO 8601");
  });
});

describe("transaction error handling", () => {
  it("propagates transaction failures", () => {
    const repository = new FakeRepository();
    repository.failTransactionForLabel = "createHabit";
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    expect(() => service.createHabit("Read", "productivity", "daily")).toThrow(
      "transaction failed: createHabit"
    );
  });
});
