import type { HabitWithStatus } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { TodayState } from "@/shared/types/ipc";

import type * as Notifications from "./notifications";
import { createReminderScheduler } from "./scheduler";

const notificationState = vi.hoisted(() => ({
  incompleteReminderCount: 0,
  midnightWarningCount: 0,
}));

vi.mock<typeof Notifications>(import("./notifications"), () => ({
  showIncompleteReminder: vi.fn(() => {
    notificationState.incompleteReminderCount += 1;
  }),
  showMidnightWarning: vi.fn(() => {
    notificationState.midnightWarningCount += 1;
  }),
}));

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: true,
  reminderTime: "20:30",
  themeMode: "system",
  timezone: "UTC",
};

function buildTodayState(habits: HabitWithStatus[]): TodayState {
  return {
    date: "2026-01-15",
    habits,
    settings: DEFAULT_SETTINGS,
    streak: {
      availableFreezes: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastEvaluatedDate: "2026-01-14",
    },
  };
}

function buildHabit(completed: boolean): HabitWithStatus {
  return {
    category: "productivity",
    completed,
    createdAt: "2026-01-01T00:00:00.000Z",
    id: 1,
    isArchived: false,
    name: "Habit 1",
    sortOrder: 0,
  };
}

function withFakeTime(nowIso: string, run: () => void): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(nowIso));
  notificationState.incompleteReminderCount = 0;
  notificationState.midnightWarningCount = 0;
  vi.clearAllMocks();

  try {
    run();
  } finally {
    vi.useRealTimers();
  }
}

describe("reminder scheduler", () => {
  it("fires the user reminder at the configured local time instead of system time", () => {
    withFakeTime("2026-01-15T13:30:00.000Z", () => {
      const scheduler = createReminderScheduler(() =>
        buildTodayState([buildHabit(false)])
      );

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "09:00",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(notificationState.incompleteReminderCount).toBe(1);
      expect(notificationState.midnightWarningCount).toBe(0);
    });
  });

  it("keeps the nightly 23:00 warning active even when user reminders are disabled", () => {
    withFakeTime("2026-01-15T14:30:00.000Z", () => {
      const scheduler = createReminderScheduler(() =>
        buildTodayState([buildHabit(false)])
      );

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderEnabled: false,
        timezone: "Asia/Singapore",
      });

      vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000);
      expect(notificationState.midnightWarningCount).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(notificationState.midnightWarningCount).toBe(1);
      expect(notificationState.incompleteReminderCount).toBe(0);
    });
  });

  it("reschedules the nightly warning and lets cancel stop the next run", () => {
    withFakeTime("2026-01-15T22:59:00.000Z", () => {
      const scheduler = createReminderScheduler(() =>
        buildTodayState([buildHabit(false)])
      );

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderEnabled: false,
        timezone: "UTC",
      });

      vi.advanceTimersByTime(60 * 1000);
      expect(notificationState.midnightWarningCount).toBe(1);

      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(notificationState.midnightWarningCount).toBe(2);

      scheduler.cancel();
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(notificationState.midnightWarningCount).toBe(2);
    });
  });

  it("suppresses both notifications when there are no incomplete habits", () => {
    withFakeTime("2026-01-15T22:58:00.000Z", () => {
      let today = buildTodayState([buildHabit(true)]);
      const scheduler = createReminderScheduler(() => today);

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "22:59",
        timezone: "UTC",
      });

      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);
      expect(notificationState.midnightWarningCount).toBe(0);

      today = buildTodayState([]);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);
      expect(notificationState.midnightWarningCount).toBe(0);
    });
  });
});
