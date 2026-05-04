/**
 * Reminder scheduling engine.
 *
 * Manages the lifecycle of desktop habit reminders: scheduling daily
 * notifications at the configured time, handling snooze cycles, catch-up
 * reminders for missed days, and midnight warnings. Persists runtime state
 * (last reminder time, snooze expiration) across app restarts.
 */
import type { Clock } from "@/main/app/clock";
import { systemClock } from "@/main/app/clock";
import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import { DEFAULT_REMINDER_RUNTIME_STATE } from "@/main/features/reminders/runtime-state";
import type { TodayState } from "@/shared/contracts/today-state";
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

export function createReminderScheduler({
  clock = systemClock,
  getTodayState,
  loadState = () => ({ ...DEFAULT_REMINDER_RUNTIME_STATE }),
  notifier = electronHabitReminderNotifier,
  saveState,
  stateStore,
  timers = realReminderTimers,
}: ReminderSchedulerOptions): ReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  let midnightWarningTimeout: TimerHandle | null = null;
  let snoozeTimeout: TimerHandle | null = null;
  const runtimeState =
    stateStore ??
    createRuntimeStateStore({
      defaultState: { ...DEFAULT_REMINDER_RUNTIME_STATE },
      loadState,
      ...(saveState ? { saveState } : {}),
    });

  function persistState(nextState: ReminderRuntimeState): void {
    runtimeState.set(nextState);
  }

  function updateState(
    update:
      | Partial<ReminderRuntimeState>
      | ((current: ReminderRuntimeState) => ReminderRuntimeState)
  ): void {
    const state = runtimeState.get();
    const nextState =
      typeof update === "function" ? update(state) : { ...state, ...update };
    persistState(nextState);
  }

  function getState(): ReminderRuntimeState {
    return runtimeState.get();
  }

  function ensureStateLoaded(): void {
    getState();
  }

  function getCurrentNow(): Date {
    return clock.now();
  }

  function hasActiveSnooze(now = getCurrentNow()): boolean {
    const state = getState();
    return state.snoozedUntil !== null && new Date(state.snoozedUntil) > now;
  }

  function clearSnooze(): void {
    const state = getState();
    if (state.snoozedUntil === null) {
      return;
    }

    updateState({ snoozedUntil: null });
  }

  function showReminderNotification(showNotification: () => void): void {
    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return;
    }

    showNotification();
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
  }

  function maybeDeliverScheduledReminder(settings: AppSettings): void {
    const state = getState();
    if (hasActiveSnooze()) {
      return;
    }

    if (
      wasSentToday({
        clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return;
    }

    showReminderNotification(notifier.showIncompleteReminder);
  }

  function maybeDeliverCatchUpReminder(settings: AppSettings): boolean {
    const state = getState();
    if (hasActiveSnooze()) {
      return false;
    }

    if (
      wasSentToday({
        clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    notifier.showCatchUpReminder();
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  function maybeDeliverSnoozedReminder(settings: AppSettings): boolean {
    const state = getState();
    if (!settings.reminderEnabled || state.snoozedUntil === null) {
      return false;
    }

    if (new Date(state.snoozedUntil) > getCurrentNow()) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    const snoozeMinutes = Math.max(settings.reminderSnoozeMinutes, 1);
    notifier.showSnoozedReminder(snoozeMinutes);
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  function maybeDeliverMidnightWarning(settings: AppSettings): boolean {
    const state = getState();
    if (
      wasSentToday({
        clock,
        sentAt: state.lastMidnightWarningSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    notifier.showMidnightWarning();
    updateState({
      lastMidnightWarningSentAt: getCurrentNow().toISOString(),
    });
    return true;
  }

  function maybeDeliverMissedReminderWarning(settings: AppSettings): boolean {
    const state = getState();
    if (!settings.reminderEnabled) {
      return false;
    }

    if (hasActiveSnooze()) {
      return false;
    }

    if (
      wasSentToday({
        clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    ) {
      return false;
    }

    if (
      wasSentToday({
        clock,
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
        getCurrentNow(),
        settings.timezone,
        reminderTime.hours,
        reminderTime.minutes
      )
    ) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    notifier.showMissedReminderWarning();
    const sentAt = getCurrentNow().toISOString();
    updateState({
      lastMidnightWarningSentAt: sentAt,
      lastMissedReminderSentAt: sentAt,
      lastReminderSentAt: sentAt,
      snoozedUntil: null,
    });
    return true;
  }

  function runCatchUpChecks(settings: AppSettings): void {
    if (maybeDeliverSnoozedReminder(settings)) {
      return;
    }

    if (
      isAtOrPastZonedTime(
        getCurrentNow(),
        settings.timezone,
        MIDNIGHT_WARNING_HOUR,
        MIDNIGHT_WARNING_MINUTE
      )
    ) {
      if (maybeDeliverMissedReminderWarning(settings)) {
        return;
      }

      maybeDeliverMidnightWarning(settings);
      return;
    }

    if (!settings.reminderEnabled) {
      clearSnooze();
      return;
    }

    const reminderTime = parseReminderClockTime(settings.reminderTime);
    if (!reminderTime) {
      clearSnooze();
      return;
    }

    if (
      isAtOrPastZonedTime(
        getCurrentNow(),
        settings.timezone,
        reminderTime.hours,
        reminderTime.minutes
      )
    ) {
      maybeDeliverCatchUpReminder(settings);
    }
  }

  function scheduleSnoozedReminder(settings: AppSettings): void {
    snoozeTimeout = clearTimer(snoozeTimeout, timers);

    const state = getState();
    if (!settings.reminderEnabled || state.snoozedUntil === null) {
      return;
    }

    const now = getCurrentNow();
    const dueAt = new Date(state.snoozedUntil);
    if (dueAt <= now) {
      return;
    }

    snoozeTimeout = timers.setTimeout(() => {
      maybeDeliverSnoozedReminder(settings);
      scheduleSnoozedReminder(settings);
    }, dueAt.getTime() - now.getTime());
  }

  function cancel(): void {
    reminderTimeout = clearTimer(reminderTimeout, timers);
    midnightWarningTimeout = clearTimer(midnightWarningTimeout, timers);
    snoozeTimeout = clearTimer(snoozeTimeout, timers);
  }

  function schedule(settings: AppSettings): void {
    ensureStateLoaded();
    cancel();
    runCatchUpChecks(settings);

    scheduleDailyNotification({
      clock,
      hours: MIDNIGHT_WARNING_HOUR,
      minutes: MIDNIGHT_WARNING_MINUTE,
      onFire: () => {
        maybeDeliverMidnightWarning(settings);
      },
      setTimer: (timer) => {
        midnightWarningTimeout = timer;
      },
      timers,
      timezone: settings.timezone,
    });

    if (settings.reminderEnabled) {
      const reminderTime = parseReminderClockTime(settings.reminderTime);

      if (reminderTime) {
        scheduleDailyNotification({
          clock,
          hours: reminderTime.hours,
          minutes: reminderTime.minutes,
          onFire: () => {
            maybeDeliverScheduledReminder(settings);
          },
          setTimer: (timer) => {
            reminderTimeout = timer;
          },
          timers,
          timezone: settings.timezone,
        });
      }
    } else {
      clearSnooze();
    }

    scheduleSnoozedReminder(settings);
  }

  function snooze(settings: AppSettings): boolean {
    ensureStateLoaded();
    if (!settings.reminderEnabled) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    const snoozeMinutes = Math.max(settings.reminderSnoozeMinutes, 1);
    const dueAt = new Date(getCurrentNow().getTime() + snoozeMinutes * 60_000);

    updateState({
      snoozedUntil: dueAt.toISOString(),
    });
    scheduleSnoozedReminder(settings);
    return true;
  }

  return { cancel, schedule, snooze };
}
