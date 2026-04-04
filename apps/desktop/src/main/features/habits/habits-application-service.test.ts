import type { Clock } from "@/main/app/clock";
import { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import type { WindDownRuntimeState } from "@/main/features/wind-down/runtime-state";
import type {
  AppRepository,
  SettledHistoryOptions,
} from "@/main/infra/persistence/app-repository";
import type { HabitPeriodStatusSnapshot } from "@/main/infra/persistence/types";
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
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import type {
  WindDownAction,
  WindDownActionWithStatus,
} from "@/shared/domain/wind-down";
import { parseDateKey } from "@/shared/utils/date";

const DEFAULT_SETTLED_HISTORY_LIMIT = 365;

class FakeClock implements Clock {
  private readonly today: string;
  private readonly nowIso: string;
  private readonly tz: string;

  constructor(today: string, nowIso: string, tz = "Asia/Singapore") {
    this.today = today;
    this.nowIso = nowIso;
    this.tz = tz;
  }

  now(): Date {
    return new Date(this.nowIso);
  }

  todayKey(): string {
    return this.today;
  }

  // oxlint-disable-next-line class-methods-use-this
  addDays(dateKey: string, amount: number): string {
    const next = parseDateKey(dateKey);
    next.setDate(next.getDate() + amount);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // oxlint-disable-next-line class-methods-use-this
  compareDateKeys(left: string, right: string): number {
    return left.localeCompare(right);
  }

  timezone(): string {
    return this.tz;
  }
}

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
  streak: StreakState = {
    availableFreezes: 1,
    bestStreak: 5,
    currentStreak: 3,
    lastEvaluatedDate: "2026-03-05",
  };
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

  // oxlint-disable-next-line class-methods-use-this
  initializeSchema(): void {}
  runInTransaction<A>(label: string, execute: () => A): A {
    if (this.failTransactionForLabel === label) {
      throw new Error(`transaction failed: ${label}`);
    }

    return execute();
  }
  // oxlint-disable-next-line class-methods-use-this
  seedDefaults(): void {}

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

  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.habits
      .filter((habit) =>
        [...this.statusByPeriod.values()].some(
          (entry) =>
            entry.end === date &&
            entry.frequency === habit.frequency &&
            entry.values.has(habit.id)
        )
      )
      .toSorted((left, right) => left.sortOrder - right.sortOrder)
      .map((habit) => ({
        ...habit,
        completed:
          ([...this.statusByPeriod.values()]
            .find(
              (entry) =>
                entry.end === date &&
                entry.frequency === habit.frequency &&
                entry.values.has(habit.id)
            )
            ?.values.get(habit.id) ?? 0) >= (habit.targetCount ?? 1),
        completedCount:
          [...this.statusByPeriod.values()]
            .find(
              (entry) =>
                entry.end === date &&
                entry.frequency === habit.frequency &&
                entry.values.has(habit.id)
            )
            ?.values.get(habit.id) ?? 0,
      }));
  }

  getHabitProgress(date: string, habitId: number): number {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit || !isHabitScheduledForDate(habit, date)) {
      return 0;
    }

    return this.getStatusValues(date, habit.frequency).get(habitId) ?? 0;
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

  toggleHabit(date: string, habitId: number): void {
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
      Math.max(0, Math.min(habit.targetCount ?? 1, Math.round(completedCount)))
    );
  }

  adjustHabitProgress(date: string, habitId: number, delta: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const values = this.getStatusValues(date, habit.frequency);
    const current = values.get(habitId) ?? 0;
    const targetCount = habit.targetCount ?? 1;
    values.set(habitId, Math.max(0, Math.min(targetCount, current + delta)));
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
      freezeUsed: true,
      streakCountAfterDay: 3,
    });

    expect(repository.dailySummaries.get("2026-03-07")).toStrictEqual({
      allCompleted: false,
      completedAt: null,
      date: "2026-03-07",
      freezeUsed: false,
      streakCountAfterDay: 0,
    });

    expect(todayState.streak).toStrictEqual({
      availableFreezes: 0,
      bestStreak: 5,
      currentStreak: 0,
      lastEvaluatedDate: "2026-03-07",
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
      freezeUsed: false,
      streakCountAfterDay: 2,
    });
    repository.dailySummaries.set("2026-01-15", {
      allCompleted: true,
      completedAt: "2026-01-15T21:00:00.000Z",
      date: "2026-01-15",
      freezeUsed: false,
      streakCountAfterDay: 6,
    });
    repository.dailySummaries.set("2025-04-01", {
      allCompleted: false,
      completedAt: null,
      date: "2025-04-01",
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
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.dailySummaries.set("2026-03-06", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-06",
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

  it("builds a weekly review overview for completed weeks", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-08";
    repository.dailySummaries.set("2026-03-02", {
      allCompleted: true,
      completedAt: "2026-03-02T21:00:00.000Z",
      date: "2026-03-02",
      freezeUsed: false,
      streakCountAfterDay: 4,
    });
    repository.dailySummaries.set("2026-03-03", {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-03",
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
