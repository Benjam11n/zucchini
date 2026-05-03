import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import type { WindDownRuntimeState } from "@/main/features/wind-down/runtime-state";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { TodayState } from "@/shared/contracts/today-state";
import type { HabitWithStatus } from "@/shared/domain/habit";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { createReminderCoordinator } from "./coordinator";
import type {
  HabitReminderNotifier,
  ReminderStateRepositoryPort,
  WindDownReminderNotifier,
} from "./ports";

const DEFAULT_SETTINGS: AppSettings = {
  ...createDefaultAppSettings("UTC"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  timezone: "UTC",
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

const DEFAULT_REMINDER_STATE: ReminderRuntimeState = {
  lastMidnightWarningSentAt: null,
  lastMissedReminderSentAt: null,
  lastReminderSentAt: null,
  snoozedUntil: null,
};

const DEFAULT_WIND_DOWN_STATE: WindDownRuntimeState = {
  lastReminderSentAt: null,
};

function buildHabit(completed: boolean): HabitWithStatus {
  return {
    category: "productivity",
    completed,
    completedCount: completed ? 1 : 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency: "daily",
    id: 1,
    isArchived: false,
    name: "Habit 1",
    selectedWeekdays: null,
    sortOrder: 0,
    targetCount: 1,
  };
}

function buildTodayState({
  date = "2026-01-15",
  habitCompleted = false,
  windDownComplete = true,
}: {
  date?: string;
  habitCompleted?: boolean;
  windDownComplete?: boolean;
} = {}): TodayState {
  return {
    date,
    dayStatus: null,
    focusMinutes: 0,
    habits: [buildHabit(habitCompleted)],
    settings: DEFAULT_SETTINGS,
    streak: {
      availableFreezes: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastEvaluatedDate: "2026-01-14",
    },
    windDown: {
      actions: [],
      completedCount: windDownComplete ? 1 : 0,
      date,
      isComplete: windDownComplete,
      totalCount: 1,
    },
  };
}

function createRepository(): ReminderStateRepositoryPort & {
  reminderState: ReminderRuntimeState;
  windDownState: WindDownRuntimeState;
} {
  return {
    getReminderRuntimeState() {
      return this.reminderState;
    },
    getWindDownRuntimeState() {
      return this.windDownState;
    },
    reminderState: { ...DEFAULT_REMINDER_STATE },
    saveReminderRuntimeState(state) {
      this.reminderState = { ...state };
    },
    saveWindDownRuntimeState(state) {
      this.windDownState = { ...state };
    },
    windDownState: { ...DEFAULT_WIND_DOWN_STATE },
  };
}

function createNotifierState() {
  return {
    catchUp: 0,
    incomplete: 0,
    midnight: 0,
    missed: 0,
    snoozed: [] as number[],
    windDown: 0,
  };
}

function createHabitNotifier(
  state: ReturnType<typeof createNotifierState>
): HabitReminderNotifier {
  return {
    showCatchUpReminder: () => {
      state.catchUp += 1;
    },
    showIncompleteReminder: () => {
      state.incomplete += 1;
    },
    showMidnightWarning: () => {
      state.midnight += 1;
    },
    showMissedReminderWarning: () => {
      state.missed += 1;
    },
    showSnoozedReminder: (minutes) => {
      state.snoozed.push(minutes);
    },
  };
}

function createWindDownNotifier(
  state: ReturnType<typeof createNotifierState>
): WindDownReminderNotifier {
  return {
    showWindDownReminder: (onClick) => {
      state.windDown += 1;
      onClick();
    },
  };
}

function withFakeTime(nowIso: string, run: () => void): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(nowIso));

  try {
    run();
  } finally {
    vi.useRealTimers();
  }
}

describe("reminder coordinator", () => {
  it("fires the scheduled habit reminder at the configured local time", () => {
    withFakeTime("2026-01-15T13:30:00.000Z", () => {
      const repository = createRepository();
      const notifierState = createNotifierState();
      const coordinator = createReminderCoordinator({
        habitNotifier: createHabitNotifier(notifierState),
        onOpenWindDown: vi.fn(),
        repository,
        today: {
          getTodayState: () => buildTodayState(),
        },
        windDownNotifier: createWindDownNotifier(notifierState),
      });

      coordinator.schedule({
        ...DEFAULT_SETTINGS,
        reminderTime: "09:00",
        timezone: "America/New_York",
      });

      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(notifierState.incomplete).toBe(1);
      expect(repository.reminderState.lastReminderSentAt).not.toBeNull();
    });
  });

  it("fires a catch-up reminder after the scheduled time was missed", () => {
    withFakeTime("2026-01-15T20:45:00.000Z", () => {
      const repository = createRepository();
      const notifierState = createNotifierState();
      const coordinator = createReminderCoordinator({
        habitNotifier: createHabitNotifier(notifierState),
        onOpenWindDown: vi.fn(),
        repository,
        today: {
          getTodayState: () => buildTodayState(),
        },
        windDownNotifier: createWindDownNotifier(notifierState),
      });

      coordinator.schedule(DEFAULT_SETTINGS);

      expect(notifierState.catchUp).toBe(1);
      expect(notifierState.incomplete).toBe(0);
      expect(repository.reminderState.lastReminderSentAt).not.toBeNull();
    });
  });

  it("persists snooze state across reschedule and fires snoozed reminder", () => {
    withFakeTime("2026-01-15T20:29:00.000Z", () => {
      const repository = createRepository();
      const notifierState = createNotifierState();
      const settings = {
        ...DEFAULT_SETTINGS,
        reminderSnoozeMinutes: 10,
      };
      const coordinator = createReminderCoordinator({
        habitNotifier: createHabitNotifier(notifierState),
        onOpenWindDown: vi.fn(),
        repository,
        today: {
          getTodayState: () => buildTodayState(),
        },
        windDownNotifier: createWindDownNotifier(notifierState),
      });

      expect(coordinator.snooze(settings)).toBe(true);
      coordinator.schedule(settings);
      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(notifierState.snoozed).toStrictEqual([10]);
      expect(repository.reminderState.snoozedUntil).toBeNull();
    });
  });

  it("deduplicates missed and midnight warnings on repeated schedules", () => {
    withFakeTime("2026-01-15T23:05:00.000Z", () => {
      const repository = createRepository();
      const notifierState = createNotifierState();
      const coordinator = createReminderCoordinator({
        habitNotifier: createHabitNotifier(notifierState),
        onOpenWindDown: vi.fn(),
        repository,
        today: {
          getTodayState: () => buildTodayState(),
        },
        windDownNotifier: createWindDownNotifier(notifierState),
      });

      coordinator.schedule(DEFAULT_SETTINGS);
      coordinator.schedule(DEFAULT_SETTINGS);

      expect(notifierState.missed).toBe(1);
      expect(notifierState.midnight).toBe(0);
    });
  });

  it("routes wind-down reminder clicks through the open-wind-down callback", () => {
    withFakeTime("2026-01-15T20:00:00.000Z", () => {
      const repository = createRepository();
      const notifierState = createNotifierState();
      const openWindDown = vi.fn();
      const coordinator = createReminderCoordinator({
        habitNotifier: createHabitNotifier(notifierState),
        onOpenWindDown: openWindDown,
        repository,
        today: {
          getTodayState: () => buildTodayState({ windDownComplete: false }),
        },
        windDownNotifier: createWindDownNotifier(notifierState),
      });

      coordinator.schedule({
        ...DEFAULT_SETTINGS,
        windDownTime: "20:00",
      });

      expect(notifierState.windDown).toBe(1);
      expect(openWindDown).toHaveBeenCalledTimes(1);
      expect(repository.windDownState.lastReminderSentAt).not.toBeNull();
    });
  });
});
