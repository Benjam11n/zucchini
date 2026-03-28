import type { Clock } from "@/main/app/clock";
import { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import type {
  AppRepository,
  SettledHistoryOptions,
} from "@/main/infra/persistence/app-repository";
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
import { isHabitScheduledForDate } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

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

  addDays(dateKey: string, amount: number): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const next = new Date(year, month - 1, day);
    next.setDate(next.getDate() + amount);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  compareDateKeys(left: string, right: string): number {
    return left.localeCompare(right);
  }

  timezone(): string {
    return this.tz;
  }
}

class FakeRepository implements AppRepository {
  failTransactionForLabel: string | null = null;
  initializeCalls = 0;
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
    },
  ];

  statusByPeriod = new Map<
    string,
    {
      end: string;
      frequency: HabitFrequency;
      start: string;
      values: Map<number, boolean>;
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
    focusCyclesBeforeLongBreak: 4,
    focusDefaultDurationSeconds: 1500,
    focusLongBreakSeconds: 15 * 60,
    focusShortBreakSeconds: 5 * 60,
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: 15,
    reminderTime: "20:30",
    themeMode: "system",
    timezone: "Asia/Singapore",
  };
  reminderRuntimeState: ReminderRuntimeState = {
    lastMidnightWarningSentAt: null,
    lastMissedReminderSentAt: null,
    lastReminderSentAt: null,
    snoozedUntil: null,
  };
  focusSessions: FocusSession[] = [];
  seedDefaultsCalls = 0;
  transactionLabels: string[] = [];

  initializeSchema(): void {
    this.initializeCalls += 1;
  }
  runInTransaction<A>(label: string, execute: () => A): A {
    this.transactionLabels.push(label);
    if (this.failTransactionForLabel === label) {
      throw new Error(`transaction failed: ${label}`);
    }

    return execute();
  }
  seedDefaults(): void {
    this.seedDefaultsCalls += 1;
  }

  getHabits(): Habit[] {
    return this.habits
      .filter((habit) => !habit.isArchived)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.getHabits()
      .filter((habit) => isHabitScheduledForDate(habit, date))
      .map((habit) => ({
        ...habit,
        completed:
          this.getStatusValues(date, habit.frequency).get(habit.id) ?? false,
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
          [...this.statusByPeriod.values()]
            .find(
              (entry) =>
                entry.end === date &&
                entry.frequency === habit.frequency &&
                entry.values.has(habit.id)
            )
            ?.values.get(habit.id) ?? false,
      }));
  }

  ensureStatusRowsForDate(date: string): void {
    const scheduledHabits = this.getHabits().filter((habit) =>
      isHabitScheduledForDate(habit, date)
    );

    for (const habit of scheduledHabits) {
      this.getStatusValues(date, habit.frequency).set(
        habit.id,
        this.getStatusValues(date, habit.frequency).get(habit.id) ?? false
      );
    }
  }

  ensureStatusRow(date: string, habitId: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (!habit || !isHabitScheduledForDate(habit, date)) {
      return;
    }

    this.getStatusValues(date, habit.frequency).set(habitId, false);
  }

  removeStatusRowsForDate(date: string, habitId: number): void {
    const dailyPeriod = getHabitPeriod("daily", date);
    const weeklyPeriod = getHabitPeriod("weekly", date);
    const monthlyPeriod = getHabitPeriod("monthly", date);
    const periodKeys = [
      this.getPeriodKey("daily", dailyPeriod.start),
      this.getPeriodKey("weekly", weeklyPeriod.start),
      this.getPeriodKey("monthly", monthlyPeriod.start),
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
    const current = values.get(habitId) ?? false;
    values.set(habitId, !current);
  }

  getFocusSessions(limit?: number): FocusSession[] {
    const sessions = [...this.focusSessions].toSorted((left, right) =>
      right.completedAt.localeCompare(left.completedAt)
    );

    return limit === undefined ? sessions : sessions.slice(0, limit);
  }

  saveFocusSession(input: CreateFocusSessionInput): FocusSession {
    const focusSession = {
      ...input,
      id: this.focusSessions.length + 1,
    };
    this.focusSessions.unshift(focusSession);
    return focusSession;
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

  getHabitPeriodStatusesEndingInRange(start: string, end: string) {
    return [...this.statusByPeriod.values()]
      .filter((entry) => entry.end >= start && entry.end <= end)
      .flatMap((entry) =>
        [...entry.values.entries()].map(([habitId, completed]) => {
          const habit = this.habits.find((item) => item.id === habitId);

          if (!habit) {
            throw new Error(`Unknown habit ${habitId}`);
          }

          return {
            category: habit.category,
            completed,
            frequency: entry.frequency,
            habitId,
            name: habit.name,
            periodEnd: entry.end,
            periodStart: entry.start,
            selectedWeekdays: habit.selectedWeekdays,
            sortOrder: habit.sortOrder,
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

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  saveSettings(settings: AppSettings): AppSettings {
    this.settings = { ...settings };
    return { ...this.settings };
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

  updateHabitFrequency(habitId: number, frequency: HabitFrequency): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.frequency = frequency;
      habit.selectedWeekdays = null;
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
    this.statusByPeriod.set(this.getPeriodKey(frequency, period.start), {
      end: period.end,
      frequency,
      start: period.start,
      values,
    });
  }

  private getStatusValues(
    date: string,
    frequency: HabitFrequency
  ): Map<number, boolean> {
    const period = getHabitPeriod(frequency, date);
    const key = this.getPeriodKey(frequency, period.start);
    const existing = this.statusByPeriod.get(key);

    if (existing) {
      return existing.values;
    }

    const values = new Map<number, boolean>();
    this.statusByPeriod.set(key, {
      end: period.end,
      frequency,
      start: period.start,
      values,
    });
    return values;
  }

  private getPeriodKey(frequency: HabitFrequency, periodStart: string): string {
    return `${frequency}:${periodStart}`;
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

  it("keeps the full history path uncapped when no limit is provided", () => {
    const repository = new FakeRepository();
    repository.streak.lastEvaluatedDate = "2026-03-08";

    for (let index = 0; index < 400; index += 1) {
      const date = new Date(Date.UTC(2025, 0, 1 + index))
        .toISOString()
        .slice(0, 10);
      const allCompleted = index % 2 === 0;

      repository.dailySummaries.set(date, {
        allCompleted,
        completedAt: [null, `${date}T21:00:00.000Z`][Number(allCompleted)],
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

  it("initializes storage only once across repeated reads", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.getTodayState();
    service.getHistory();

    expect(repository.initializeCalls).toBe(1);
    expect(repository.seedDefaultsCalls).toBe(1);
  });
});

describe("weekly review retrieval", () => {
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

  it("wraps weekly review overview reads in a repository transaction", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-10", "2026-03-10T09:00:00.000Z")
    );

    service.getWeeklyReviewOverview();

    expect(repository.transactionLabels).toContain("getWeeklyReviewOverview");
  });
});

describe("habitService transactions", () => {
  it("wraps getTodayState in a repository transaction", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.getTodayState();

    expect(repository.transactionLabels).toContain("getTodayState");
  });

  it("wraps createHabit in a repository transaction", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.createHabit("Read", "productivity", "daily");

    expect(repository.transactionLabels).toContain("createHabit");
  });

  it("wraps updateHabitFrequency in a repository transaction", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.updateHabitFrequency(1, "weekly");

    expect(repository.transactionLabels).toContain("updateHabitFrequency");
  });

  it("wraps archiveHabit in a repository transaction", () => {
    const repository = new FakeRepository();
    const service = new HabitsApplicationService(
      repository,
      new FakeClock("2026-03-08", "2026-03-08T09:00:00.000Z")
    );

    service.archiveHabit(1);

    expect(repository.transactionLabels).toContain("archiveHabit");
  });

  it("wraps unarchiveHabit in a repository transaction", () => {
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

    service.unarchiveHabit(2);

    expect(repository.transactionLabels).toContain("unarchiveHabit");
  });

  it("wraps reorderHabits in a repository transaction", () => {
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

    service.reorderHabits([2, 1]);

    expect(repository.transactionLabels).toContain("reorderHabits");
  });

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
    expect(repository.transactionLabels).toContain("recordFocusSession");
    expect(repository.transactionLabels).toContain("getFocusSessions");
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
