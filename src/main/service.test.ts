import type { Habit, HabitWithStatus } from "../shared/domain/habit";
import type { ReminderSettings } from "../shared/domain/settings";
import type { DailySummary, StreakState } from "../shared/domain/streak";
import type { Clock } from "./clock";
import type { HabitRepository } from "./repository";
import { HabitService } from "./service";

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

class FakeRepository implements HabitRepository {
  habits: Habit[] = [
    {
      createdAt: "2026-03-01T00:00:00.000Z",
      id: 1,
      isArchived: false,
      name: "Habit 1",
      sortOrder: 0,
    },
  ];

  statusByDate = new Map<string, Map<number, boolean>>();
  dailySummaries = new Map<string, DailySummary>();
  streak: StreakState = {
    availableFreezes: 1,
    bestStreak: 5,
    currentStreak: 3,
    lastEvaluatedDate: "2026-03-05",
  };
  settings: ReminderSettings = {
    reminderEnabled: true,
    reminderTime: "20:30",
    timezone: "Asia/Singapore",
  };

  initializeSchema(): void {}
  seedDefaults(): void {}

  getHabits(): Habit[] {
    return this.habits
      .filter((habit) => !habit.isArchived)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    const day = this.statusByDate.get(date) ?? new Map<number, boolean>();
    return this.getHabits().map((habit) => ({
      ...habit,
      completed: day.get(habit.id) ?? false,
    }));
  }

  ensureStatusRowsForDate(date: string): void {
    const day = this.statusByDate.get(date) ?? new Map<number, boolean>();
    this.getHabits().forEach((habit) => {
      if (!day.has(habit.id)) {
        day.set(habit.id, false);
      }
    });
    this.statusByDate.set(date, day);
  }

  ensureStatusRow(date: string, habitId: number): void {
    this.ensureStatusRowsForDate(date);
    this.statusByDate.get(date)?.set(habitId, false);
  }

  toggleHabit(date: string, habitId: number): void {
    this.ensureStatusRowsForDate(date);
    const current = this.statusByDate.get(date)?.get(habitId) ?? false;
    this.statusByDate.get(date)?.set(habitId, !current);
  }

  getSettledHistory(limit: number): DailySummary[] {
    return [...this.dailySummaries.values()]
      .toSorted((left, right) => right.date.localeCompare(left.date))
      .slice(0, limit);
  }

  getPersistedStreakState(): StreakState {
    return { ...this.streak };
  }

  savePersistedStreakState(state: StreakState): void {
    this.streak = { ...state };
  }

  getReminderSettings(): ReminderSettings {
    return { ...this.settings };
  }

  saveReminderSettings(settings: ReminderSettings): ReminderSettings {
    this.settings = { ...settings };
    return { ...this.settings };
  }

  getFirstTrackedDate(): string | null {
    const keys = new Set<string>([
      ...this.statusByDate.keys(),
      ...this.dailySummaries.keys(),
      this.streak.lastEvaluatedDate ?? "",
    ]);
    const values = [...keys].filter(Boolean).toSorted();
    return values[0] ?? null;
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

  insertHabit(name: string, sortOrder: number, createdAt: string): number {
    const id = this.habits.length + 1;
    this.habits.push({ createdAt, id, isArchived: false, name, sortOrder });
    return id;
  }

  renameHabit(habitId: number, name: string): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.name = name;
    }
  }

  archiveHabit(habitId: number): void {
    const habit = this.habits.find((item) => item.id === habitId);
    if (habit) {
      habit.isArchived = true;
    }
  }

  normalizeHabitOrder(): void {
    this.getHabits().forEach((habit, index) => {
      habit.sortOrder = index;
    });
  }

  reorderHabits(habitIds: number[]): void {
    habitIds.forEach((habitId, index) => {
      const habit = this.habits.find((item) => item.id === habitId);
      if (habit) {
        habit.sortOrder = index;
      }
    });
  }
}

describe("habitService rollover", () => {
  it("uses a freeze for the first missed closed day and resets on the next missed day", () => {
    const repository = new FakeRepository();
    repository.statusByDate.set("2026-03-06", new Map([[1, false]]));
    repository.statusByDate.set("2026-03-07", new Map([[1, false]]));

    const service = new HabitService(
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
