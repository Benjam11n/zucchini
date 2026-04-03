import type { Clock } from "@/main/app/clock";
import type { AppRepository } from "@/main/infra/persistence/app-repository";
import {
  buildHistoryDay,
  buildTodayPreviewSummary,
  buildTodayState,
  createRollingStreakState,
} from "@/main/features/today/state-builder";

function createRepository(overrides: {
  ensureStatusRowsForDate?: ReturnType<typeof vi.fn>;
  getFocusQuotaGoalsWithStatusForDate?: ReturnType<typeof vi.fn>;
  getFocusSessionsInRange?: ReturnType<typeof vi.fn>;
  getHabitsWithStatus?: ReturnType<typeof vi.fn>;
  getPersistedStreakState?: ReturnType<typeof vi.fn>;
  getSettings?: ReturnType<typeof vi.fn>;
} = {}): AppRepository {
  return {
    ensureStatusRowsForDate: overrides.ensureStatusRowsForDate ?? vi.fn(),
    getFocusQuotaGoalsWithStatusForDate:
      overrides.getFocusQuotaGoalsWithStatusForDate ?? vi.fn(() => []),
    getFocusSessionsInRange:
      overrides.getFocusSessionsInRange ?? vi.fn(() => []),
    getHabitsWithStatus: overrides.getHabitsWithStatus ?? vi.fn(() => []),
    getPersistedStreakState:
      overrides.getPersistedStreakState ??
      vi.fn(() => ({
        availableFreezes: 0,
        bestStreak: 0,
        currentStreak: 0,
        lastEvaluatedDate: "2026-03-07",
      })),
    getSettings:
      overrides.getSettings ??
      vi.fn(() => ({
        categoryPreferences: {
          fitness: { color: "#FF2D55", icon: "dumbbell", label: "Fitness" },
          nutrition: { color: "#A3F900", icon: "apple", label: "Nutrition" },
          productivity: {
            color: "#04C7DD",
            icon: "briefcase",
            label: "Productivity",
          },
        },
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 900,
        focusQuotaTargetMinutes: 120,
        focusShortBreakSeconds: 300,
        minimizeToTray: true,
        pomodoroBreaksEnabled: true,
        reminderSnoozeMinutes: 15,
        remindersEnabled: false,
        resetFocusTimerShortcut: "Command+Shift+R",
        themeMode: "system",
        timezone: "Asia/Singapore",
        toggleFocusTimerShortcut: "Command+Shift+T",
      })),
  } as never;
}

function createClock(
  todayKey = "2026-03-08",
  timezone = "Asia/Singapore"
): Clock {
  return {
    timezone: vi.fn(() => timezone),
    todayKey: vi.fn(() => todayKey),
  } as never;
}

describe("state builder", () => {
  describe("buildTodayState", () => {
    it("ensures status rows exist for today before reading", () => {
      const repository = createRepository();
      const clock = createClock("2026-03-08");

      buildTodayState(repository, clock);

      expect(repository.ensureStatusRowsForDate).toHaveBeenCalledWith(
        "2026-03-08"
      );
    });

    it("returns zero focus minutes when no sessions exist", () => {
      const repository = createRepository();
      const clock = createClock("2026-03-08");

      const todayState = buildTodayState(repository, clock);

      expect(todayState.focusMinutes).toBe(0);
      expect(todayState.date).toBe("2026-03-08");
    });

    it("calculates focus minutes from session durations", () => {
      const repository = createRepository({
        getFocusSessionsInRange: vi.fn(() => [
          { durationSeconds: 1500 },
          { durationSeconds: 900 },
        ]),
      });
      const clock = createClock("2026-03-08");

      const todayState = buildTodayState(repository, clock);

      expect(todayState.focusMinutes).toBe(40);
    });

    it("rounds up partial minutes to at least 1", () => {
      const repository = createRepository({
        getFocusSessionsInRange: vi.fn(() => [{ durationSeconds: 30 }]),
      });
      const clock = createClock("2026-03-08");

      const todayState = buildTodayState(repository, clock);

      expect(todayState.focusMinutes).toBe(1);
    });

    it("includes the streak preview from the persisted state", () => {
      const repository = createRepository({
        getPersistedStreakState: vi.fn(() => ({
          availableFreezes: 2,
          bestStreak: 14,
          currentStreak: 5,
          lastEvaluatedDate: "2026-03-07",
        })),
      });
      const clock = createClock("2026-03-08");

      const todayState = buildTodayState(repository, clock);

      expect(todayState.streak).toStrictEqual({
        availableFreezes: 2,
        bestStreak: 14,
        currentStreak: 5,
        lastEvaluatedDate: "2026-03-07",
      });
    });
  });

  describe("buildTodayPreviewSummary", () => {
    it("marks the day as complete when all daily habits are done", () => {
      const todayState = {
        date: "2026-03-08",
        focusMinutes: 30,
        focusQuotaGoals: [],
        habits: [
          {
            category: "fitness" as const,
            completed: true,
            completedCount: 1,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily" as const,
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
            targetCount: 1,
          },
        ],
        settings: {} as never,
        streak: {
          availableFreezes: 0,
          bestStreak: 5,
          currentStreak: 3,
          lastEvaluatedDate: "2026-03-07",
        },
      };

      const summary = buildTodayPreviewSummary(
        todayState,
        "2026-03-08T09:30:00.000Z"
      );

      expect(summary.allCompleted).toBe(true);
      expect(summary.completedAt).toBe("2026-03-08T09:30:00.000Z");
    });

    it("marks the day as incomplete when any daily habit is not done", () => {
      const todayState = {
        date: "2026-03-08",
        focusMinutes: 0,
        focusQuotaGoals: [],
        habits: [
          {
            category: "fitness" as const,
            completed: true,
            completedCount: 1,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily" as const,
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
            targetCount: 1,
          },
          {
            category: "nutrition" as const,
            completed: false,
            completedCount: 0,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily" as const,
            id: 2,
            isArchived: false,
            name: "Drink water",
            sortOrder: 1,
            targetCount: 1,
          },
        ],
        settings: {} as never,
        streak: {
          availableFreezes: 0,
          bestStreak: 5,
          currentStreak: 3,
          lastEvaluatedDate: "2026-03-07",
        },
      };

      const summary = buildTodayPreviewSummary(
        todayState,
        "2026-03-08T09:30:00.000Z"
      );

      expect(summary.allCompleted).toBe(false);
      expect(summary.completedAt).toBeNull();
    });

    it("ignores weekly habits when evaluating daily completion", () => {
      const todayState = {
        date: "2026-03-08",
        focusMinutes: 0,
        focusQuotaGoals: [],
        habits: [
          {
            category: "fitness" as const,
            completed: true,
            completedCount: 1,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "daily" as const,
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
            targetCount: 1,
          },
          {
            category: "fitness" as const,
            completed: false,
            completedCount: 0,
            createdAt: "2026-03-01T00:00:00.000Z",
            frequency: "weekly" as const,
            id: 2,
            isArchived: false,
            name: "Weekly review",
            sortOrder: 1,
            targetCount: 1,
          },
        ],
        settings: {} as never,
        streak: {
          availableFreezes: 0,
          bestStreak: 5,
          currentStreak: 3,
          lastEvaluatedDate: "2026-03-07",
        },
      };

      const summary = buildTodayPreviewSummary(
        todayState,
        "2026-03-08T09:30:00.000Z"
      );

      expect(summary.allCompleted).toBe(true);
    });
  });

  describe("buildHistoryDay", () => {
    it("builds a history day with category progress from daily habits", () => {
      const summary = {
        allCompleted: true,
        completedAt: "2026-03-08T09:30:00.000Z",
        date: "2026-03-08",
        freezeUsed: false,
        streakCountAfterDay: 3,
      };
      const habits = [
        {
          category: "fitness" as const,
          completed: true,
          completedCount: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "daily" as const,
          id: 1,
          isArchived: false,
          name: "Run",
          sortOrder: 0,
          targetCount: 1,
        },
      ];

      const historyDay = buildHistoryDay(summary, habits, 30, []);

      expect(historyDay.date).toBe("2026-03-08");
      expect(historyDay.focusMinutes).toBe(30);
      expect(historyDay.categoryProgress).toHaveLength(3);
      const fitness = historyDay.categoryProgress.find(
        (p) => p.category === "fitness"
      );
      expect(fitness).toMatchObject({
        completed: 1,
        progress: 100,
        total: 1,
      });
    });

    it("includes focusQuotaGoals when provided", () => {
      const summary = {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-08",
        freezeUsed: false,
        streakCountAfterDay: 0,
      };
      const habits: never[] = [];
      const focusQuotaGoals = [
        {
          archivedAt: null,
          completed: false,
          completedMinutes: 30,
          createdAt: "2026-03-01T00:00:00.000Z",
          frequency: "weekly" as const,
          id: 1,
          isArchived: false,
          kind: "focus-quota" as const,
          periodEnd: "2026-03-08",
          periodStart: "2026-03-02",
          targetMinutes: 120,
        },
      ];

      const historyDay = buildHistoryDay(
        summary,
        habits,
        30,
        focusQuotaGoals
      );

      expect(historyDay.focusQuotaGoals).toStrictEqual(focusQuotaGoals);
    });

    it("includes empty focusQuotaGoals array when provided", () => {
      const summary = {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-08",
        freezeUsed: false,
        streakCountAfterDay: 0,
      };
      const habits: never[] = [];

      const historyDay = buildHistoryDay(summary, habits, 0, []);

      expect(historyDay.focusQuotaGoals).toStrictEqual([]);
    });

    it("omits focusQuotaGoals when undefined", () => {
      const summary = {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-08",
        freezeUsed: false,
        streakCountAfterDay: 0,
      };
      const habits: never[] = [];

      const historyDay = buildHistoryDay(summary, habits, 0, undefined as never);

      expect("focusQuotaGoals" in historyDay).toBe(false);
    });
  });

  describe("createRollingStreakState", () => {
    it("returns a plain object copy of the streak state", () => {
      const streak = {
        availableFreezes: 1,
        bestStreak: 10,
        currentStreak: 3,
        lastEvaluatedDate: "2026-03-07",
      };

      const result = createRollingStreakState(streak);

      expect(result).toStrictEqual(streak);
      expect(result).not.toBe(streak);
    });
  });
});
