import type { HabitReminderNotifier } from "@/main/features/reminders/ports";
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { TodayState } from "@/shared/contracts/today-state";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { createReminderScheduler } from "./reminder-scheduler";

const notificationState = vi.hoisted(() => ({
  catchUpReminderCount: 0,
  incompleteReminderCount: 0,
  midnightWarningCount: 0,
  missedReminderCount: 0,
  snoozedReminderCount: 0,
  snoozedReminderMinutes: [] as number[],
}));

const DEFAULT_SETTINGS: AppSettings = {
  ...createDefaultAppSettings("UTC"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  timezone: "UTC",
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

const DEFAULT_RUNTIME_STATE: ReminderRuntimeState = {
  lastMidnightWarningSentAt: null,
  lastMissedReminderSentAt: null,
  lastReminderSentAt: null,
  snoozedUntil: null,
};

function buildTodayState(
  habits: HabitWithStatus[],
  date = "2026-01-15"
): TodayState {
  return {
    date,
    dayStatus: null,
    focusMinutes: 0,
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

function buildHabit(
  completed: boolean,
  frequency: HabitFrequency = "daily"
): HabitWithStatus {
  return {
    category: "productivity",
    completed,
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency,
    id: 1,
    isArchived: false,
    name: "Habit 1",
    sortOrder: 0,
  };
}

function resetNotificationState(): void {
  notificationState.catchUpReminderCount = 0;
  notificationState.incompleteReminderCount = 0;
  notificationState.midnightWarningCount = 0;
  notificationState.missedReminderCount = 0;
  notificationState.snoozedReminderCount = 0;
  notificationState.snoozedReminderMinutes = [];
}

function createTestNotifier(): HabitReminderNotifier {
  return {
    showCatchUpReminder: () => {
      notificationState.catchUpReminderCount += 1;
    },
    showIncompleteReminder: () => {
      notificationState.incompleteReminderCount += 1;
    },
    showMidnightWarning: () => {
      notificationState.midnightWarningCount += 1;
    },
    showMissedReminderWarning: () => {
      notificationState.missedReminderCount += 1;
    },
    showSnoozedReminder: (minutes) => {
      notificationState.snoozedReminderCount += 1;
      notificationState.snoozedReminderMinutes.push(minutes);
    },
  };
}

function createTestReminderScheduler(
  options: Omit<Parameters<typeof createReminderScheduler>[0], "notifier">
) {
  return createReminderScheduler({
    ...options,
    notifier: createTestNotifier(),
  });
}

function withFakeTime(nowIso: string, run: () => void): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(nowIso));
  resetNotificationState();

  try {
    run();
  } finally {
    vi.useRealTimers();
  }
}

describe("reminder scheduler", () => {
  it("does not load persisted reminder state until the scheduler is used", () => {
    const loadState = vi.fn(() => ({ ...DEFAULT_RUNTIME_STATE }));

    createTestReminderScheduler({
      getTodayState: () => buildTodayState([buildHabit(false)]),
      loadState,
    });

    expect(loadState).not.toHaveBeenCalled();
  });

  it("fires the user reminder at the configured local time instead of system time", () => {
    withFakeTime("2026-01-15T13:30:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "09:00",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(notificationState.incompleteReminderCount).toBe(1);
      expect(runtimeState.lastReminderSentAt).not.toBeNull();
    });
  });

  it("shows a catch-up reminder when the app reopens after reminder time", () => {
    withFakeTime("2026-01-15T20:45:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(DEFAULT_SETTINGS);

      expect(notificationState.catchUpReminderCount).toBe(1);
      expect(notificationState.incompleteReminderCount).toBe(0);
      expect(runtimeState.lastReminderSentAt).not.toBeNull();
    });
  });

  it("shows the missed reminder warning after 23:00 when the scheduled reminder was missed", () => {
    withFakeTime("2026-01-15T23:05:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(DEFAULT_SETTINGS);

      expect(notificationState.missedReminderCount).toBe(1);
      expect(notificationState.midnightWarningCount).toBe(0);
      expect(runtimeState.lastMidnightWarningSentAt).not.toBeNull();
      expect(runtimeState.lastMissedReminderSentAt).not.toBeNull();
    });
  });

  it("keeps the nightly 23:00 warning active even when user reminders are disabled", () => {
    withFakeTime("2026-01-15T14:30:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

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

  it("persists snoozes across reschedules and fires after the snooze delay", () => {
    withFakeTime("2026-01-15T20:29:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const settings = {
        ...DEFAULT_SETTINGS,
        reminderSnoozeMinutes: 10,
      };

      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(settings);
      expect(scheduler.snooze(settings)).toBeTruthy();
      scheduler.schedule(settings);

      vi.advanceTimersByTime(60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);

      vi.advanceTimersByTime(9 * 60 * 1000);
      expect(notificationState.snoozedReminderCount).toBe(1);
      expect(notificationState.snoozedReminderMinutes).toStrictEqual([10]);
      expect(runtimeState.snoozedUntil).toBeNull();
    });
  });

  it("suppresses weekly reminders before the final day of the week", () => {
    withFakeTime("2026-01-15T20:29:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () =>
          buildTodayState([buildHabit(false, "weekly")], "2026-01-15"),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "20:30",
        timezone: "UTC",
      });

      vi.advanceTimersByTime(31 * 60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);
      expect(notificationState.catchUpReminderCount).toBe(0);
      expect(notificationState.midnightWarningCount).toBe(0);
    });
  });

  it("fires at the intended local wall-clock time across DST spring-forward", () => {
    withFakeTime("2026-03-08T06:29:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)], "2026-03-08"),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "03:30",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(60 * 60 * 1000 + 59 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(notificationState.incompleteReminderCount).toBe(1);
    });
  });

  it("does not deliver the same reminder twice across DST fall-back", () => {
    withFakeTime("2026-11-01T05:29:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)], "2026-11-01"),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "01:30",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(1);

      vi.advanceTimersByTime(61 * 60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(1);
    });
  });

  it("does not redeliver when schedule() runs again after a same-day reminder fired", () => {
    withFakeTime("2026-01-15T20:29:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const settings = {
        ...DEFAULT_SETTINGS,
        reminderTime: "20:30",
      };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(settings);

      vi.advanceTimersByTime(60 * 1000);
      expect(notificationState.incompleteReminderCount).toBe(1);

      scheduler.schedule(settings);
      expect(notificationState.incompleteReminderCount).toBe(1);
      expect(notificationState.catchUpReminderCount).toBe(0);
    });
  });

  it("clears an expired snooze when habits become complete before it fires", () => {
    withFakeTime("2026-01-15T20:00:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      let todayState = buildTodayState([buildHabit(false)]);
      const settings = {
        ...DEFAULT_SETTINGS,
        reminderSnoozeMinutes: 10,
      };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => todayState,
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(settings);
      expect(scheduler.snooze(settings)).toBeTruthy();

      todayState = buildTodayState([buildHabit(true)]);
      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(notificationState.snoozedReminderCount).toBe(0);
      expect(runtimeState.snoozedUntil).toBeNull();
    });
  });

  it("preserves snoozes across timezone and reminder-time changes", () => {
    withFakeTime("2026-01-15T20:00:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });
      const firstSettings = {
        ...DEFAULT_SETTINGS,
        reminderSnoozeMinutes: 10,
        reminderTime: "20:30",
        timezone: "UTC",
      };

      scheduler.schedule(firstSettings);
      expect(scheduler.snooze(firstSettings)).toBeTruthy();

      scheduler.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "23:59",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(9 * 60 * 1000);
      expect(notificationState.snoozedReminderCount).toBe(0);

      vi.advanceTimersByTime(60 * 1000);
      expect(notificationState.snoozedReminderCount).toBe(1);
      expect(runtimeState.snoozedUntil).toBeNull();
    });
  });

  it("deduplicates late-night warnings on repeated schedule() calls", () => {
    withFakeTime("2026-01-15T23:05:00.000Z", () => {
      let runtimeState = { ...DEFAULT_RUNTIME_STATE };
      const scheduler = createTestReminderScheduler({
        getTodayState: () => buildTodayState([buildHabit(false)]),
        loadState: () => runtimeState,
        saveState: (nextState) => {
          runtimeState = { ...nextState };
        },
      });

      scheduler.schedule(DEFAULT_SETTINGS);
      scheduler.schedule(DEFAULT_SETTINGS);

      expect(notificationState.missedReminderCount).toBe(1);
      expect(notificationState.midnightWarningCount).toBe(0);
    });
  });
});
