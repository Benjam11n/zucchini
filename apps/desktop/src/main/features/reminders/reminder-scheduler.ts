/**
 * Reminder scheduling engine.
 *
 * Manages the lifecycle of desktop habit reminders: scheduling daily
 * notifications at the configured time, handling snooze cycles, catch-up
 * reminders for missed days, and midnight warnings. Persists runtime state
 * (last reminder time, snooze expiration) across app restarts.
 */
import type { TodayState } from "@/shared/contracts/today-state";
import type { Clock } from "@/shared/domain/clock";
import { systemClock } from "@/shared/domain/clock";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import { DEFAULT_REMINDER_RUNTIME_STATE } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";

import { electronHabitReminderNotifier } from "./adapters";
import type {
  HabitReminderNotifier,
  ReminderRuntimeStateStore,
  ReminderTimerPort,
} from "./ports";
import { realReminderTimers } from "./ports";
import { hasIncompleteHabitsClosingToday } from "./reminder-policy";
import {
  isAtOrPastZonedTime,
  parseReminderClockTime,
} from "./reminder-timezone";
import {
  clearTimer,
  createRuntimeStateStore,
  scheduleDailyNotification,
  wasSentToday,
} from "./scheduler-utils";
import type { TimerHandle } from "./scheduler-utils";

const MIDNIGHT_WARNING_HOUR = 23;
const MIDNIGHT_WARNING_MINUTE = 0;

interface ReminderSchedulerOptions {
  clock?: Pick<Clock, "now">;
  getTodayState: () => TodayState;
  loadState?: () => ReminderRuntimeState;
  notifier?: HabitReminderNotifier;
  saveState?: (state: ReminderRuntimeState) => void;
  stateStore?: ReminderRuntimeStateStore<ReminderRuntimeState>;
  timers?: ReminderTimerPort;
}

interface ReminderScheduler {
  schedule: (settings: AppSettings) => void;
  cancel: () => void;
  snooze: (settings: AppSettings) => boolean;
}

interface ReminderSchedulerRuntimeOptions {
  clock: Pick<Clock, "now">;
  getTodayState: () => TodayState;
  notifier: HabitReminderNotifier;
  runtimeState: ReminderRuntimeStateStore<ReminderRuntimeState>;
  timers: ReminderTimerPort;
}

class ReminderSchedulerRuntime {
  private midnightWarningTimeout: TimerHandle | null = null;
  private readonly options: ReminderSchedulerRuntimeOptions;
  private reminderTimeout: TimerHandle | null = null;
  private snoozeTimeout: TimerHandle | null = null;

  constructor(options: ReminderSchedulerRuntimeOptions) {
    this.options = options;
  }

  schedule(settings: AppSettings): void {
    this.ensureStateLoaded();
    this.cancel();
    this.runCatchUpChecks(settings);
    this.scheduleMidnightWarning(settings);
    this.scheduleUserReminder(settings);
    this.scheduleSnoozedReminder(settings);
  }

  cancel(): void {
    const { timers } = this.options;
    this.reminderTimeout = clearTimer(this.reminderTimeout, timers);
    this.midnightWarningTimeout = clearTimer(
      this.midnightWarningTimeout,
      timers
    );
    this.snoozeTimeout = clearTimer(this.snoozeTimeout, timers);
  }

  snooze(settings: AppSettings): boolean {
    this.ensureStateLoaded();
    if (!settings.reminderEnabled) {
      return false;
    }

    if (!this.hasIncompleteHabitsForReminder()) {
      return false;
    }

    const snoozeMinutes = Math.max(settings.reminderSnoozeMinutes, 1);
    const dueAt = new Date(
      this.getCurrentNow().getTime() + snoozeMinutes * 60_000
    );

    this.updateState({
      snoozedUntil: dueAt.toISOString(),
    });
    this.scheduleSnoozedReminder(settings);
    return true;
  }

  private updateState(
    update:
      | Partial<ReminderRuntimeState>
      | ((current: ReminderRuntimeState) => ReminderRuntimeState)
  ): void {
    const state = this.getState();
    const nextState =
      typeof update === "function" ? update(state) : { ...state, ...update };
    this.options.runtimeState.set(nextState);
  }

  private getState(): ReminderRuntimeState {
    return this.options.runtimeState.get();
  }

  private ensureStateLoaded(): void {
    this.getState();
  }

  private getCurrentNow(): Date {
    return this.options.clock.now();
  }

  private hasActiveSnooze(now = this.getCurrentNow()): boolean {
    const state = this.getState();
    return state.snoozedUntil !== null && new Date(state.snoozedUntil) > now;
  }

  private clearSnooze(): void {
    const state = this.getState();
    if (state.snoozedUntil === null) {
      return;
    }

    this.updateState({ snoozedUntil: null });
  }

  private hasIncompleteHabitsForReminder(): boolean {
    const today = this.options.getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      this.clearSnooze();
      return false;
    }

    return true;
  }

  private showReminderNotification(showNotification: () => void): void {
    if (!this.hasIncompleteHabitsForReminder()) {
      return;
    }

    showNotification();
    this.updateState({
      lastReminderSentAt: this.getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
  }

  private maybeDeliverScheduledReminder(settings: AppSettings): void {
    const state = this.getState();
    if (this.hasActiveSnooze()) {
      return;
    }

    if (
      wasSentToday({
        clock: this.options.clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return;
    }

    this.showReminderNotification(this.options.notifier.showIncompleteReminder);
  }

  private maybeDeliverCatchUpReminder(settings: AppSettings): boolean {
    const state = this.getState();
    if (this.hasActiveSnooze()) {
      return false;
    }

    if (
      wasSentToday({
        clock: this.options.clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    if (!this.hasIncompleteHabitsForReminder()) {
      return false;
    }

    this.options.notifier.showCatchUpReminder();
    this.updateState({
      lastReminderSentAt: this.getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  private maybeDeliverSnoozedReminder(settings: AppSettings): boolean {
    const state = this.getState();
    if (!settings.reminderEnabled || state.snoozedUntil === null) {
      return false;
    }

    if (new Date(state.snoozedUntil) > this.getCurrentNow()) {
      return false;
    }

    if (!this.hasIncompleteHabitsForReminder()) {
      return false;
    }

    const snoozeMinutes = Math.max(settings.reminderSnoozeMinutes, 1);
    this.options.notifier.showSnoozedReminder(snoozeMinutes);
    this.updateState({
      lastReminderSentAt: this.getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  private maybeDeliverMidnightWarning(settings: AppSettings): boolean {
    const state = this.getState();
    if (
      wasSentToday({
        clock: this.options.clock,
        sentAt: state.lastMidnightWarningSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    if (!this.hasIncompleteHabitsForReminder()) {
      return false;
    }

    this.options.notifier.showMidnightWarning();
    this.updateState({
      lastMidnightWarningSentAt: this.getCurrentNow().toISOString(),
    });
    return true;
  }

  private maybeDeliverMissedReminderWarning(settings: AppSettings): boolean {
    const state = this.getState();
    if (!settings.reminderEnabled) {
      return false;
    }

    if (this.hasActiveSnooze()) {
      return false;
    }

    if (
      wasSentToday({
        clock: this.options.clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    if (
      wasSentToday({
        clock: this.options.clock,
        sentAt: state.lastMissedReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    const reminderTime = parseReminderClockTime(settings.reminderTime);
    if (!reminderTime) {
      return false;
    }

    if (
      !isAtOrPastZonedTime(
        this.getCurrentNow(),
        settings.timezone,
        reminderTime.hours,
        reminderTime.minutes
      )
    ) {
      return false;
    }

    if (!this.hasIncompleteHabitsForReminder()) {
      return false;
    }

    this.options.notifier.showMissedReminderWarning();
    const sentAt = this.getCurrentNow().toISOString();
    this.updateState({
      lastMidnightWarningSentAt: sentAt,
      lastMissedReminderSentAt: sentAt,
      lastReminderSentAt: sentAt,
      snoozedUntil: null,
    });
    return true;
  }

  private runCatchUpChecks(settings: AppSettings): void {
    if (this.maybeDeliverSnoozedReminder(settings)) {
      return;
    }

    if (
      isAtOrPastZonedTime(
        this.getCurrentNow(),
        settings.timezone,
        MIDNIGHT_WARNING_HOUR,
        MIDNIGHT_WARNING_MINUTE
      )
    ) {
      if (this.maybeDeliverMissedReminderWarning(settings)) {
        return;
      }

      this.maybeDeliverMidnightWarning(settings);
      return;
    }

    if (!settings.reminderEnabled) {
      this.clearSnooze();
      return;
    }

    const reminderTime = parseReminderClockTime(settings.reminderTime);
    if (!reminderTime) {
      this.clearSnooze();
      return;
    }

    if (
      isAtOrPastZonedTime(
        this.getCurrentNow(),
        settings.timezone,
        reminderTime.hours,
        reminderTime.minutes
      )
    ) {
      this.maybeDeliverCatchUpReminder(settings);
    }
  }

  private scheduleSnoozedReminder(settings: AppSettings): void {
    const { timers } = this.options;
    this.snoozeTimeout = clearTimer(this.snoozeTimeout, timers);

    const state = this.getState();
    if (!settings.reminderEnabled || state.snoozedUntil === null) {
      return;
    }

    const now = this.getCurrentNow();
    const dueAt = new Date(state.snoozedUntil);
    if (dueAt <= now) {
      return;
    }

    this.snoozeTimeout = timers.setTimeout(() => {
      this.maybeDeliverSnoozedReminder(settings);
      this.scheduleSnoozedReminder(settings);
    }, dueAt.getTime() - now.getTime());
  }

  private scheduleMidnightWarning(settings: AppSettings): void {
    scheduleDailyNotification({
      clock: this.options.clock,
      hours: MIDNIGHT_WARNING_HOUR,
      minutes: MIDNIGHT_WARNING_MINUTE,
      onFire: () => {
        this.maybeDeliverMidnightWarning(settings);
      },
      setTimer: (timer) => {
        this.midnightWarningTimeout = timer;
      },
      timers: this.options.timers,
      timezone: settings.timezone,
    });
  }

  private scheduleUserReminder(settings: AppSettings): void {
    if (!settings.reminderEnabled) {
      this.clearSnooze();
      return;
    }

    const reminderTime = parseReminderClockTime(settings.reminderTime);
    if (!reminderTime) {
      return;
    }

    scheduleDailyNotification({
      clock: this.options.clock,
      hours: reminderTime.hours,
      minutes: reminderTime.minutes,
      onFire: () => {
        this.maybeDeliverScheduledReminder(settings);
      },
      setTimer: (timer) => {
        this.reminderTimeout = timer;
      },
      timers: this.options.timers,
      timezone: settings.timezone,
    });
  }
}

export function createReminderScheduler({
  clock = systemClock,
  getTodayState,
  loadState = () => ({ ...DEFAULT_REMINDER_RUNTIME_STATE }),
  notifier = electronHabitReminderNotifier,
  saveState,
  stateStore,
  timers = realReminderTimers,
}: ReminderSchedulerOptions): ReminderScheduler {
  const runtimeState =
    stateStore ??
    createRuntimeStateStore({
      defaultState: { ...DEFAULT_REMINDER_RUNTIME_STATE },
      loadState,
      ...(saveState ? { saveState } : {}),
    });
  const scheduler = new ReminderSchedulerRuntime({
    clock,
    getTodayState,
    notifier,
    runtimeState,
    timers,
  });

  return {
    cancel: () => scheduler.cancel(),
    schedule: (settings) => scheduler.schedule(settings),
    snooze: (settings) => scheduler.snooze(settings),
  };
}
