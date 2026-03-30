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
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

import {
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
} from "./notifications";
import { hasIncompleteHabitsClosingToday } from "./reminder-policy";
import {
  getDelayUntilNextZonedOccurrence,
  isAtOrPastZonedTime,
  isSameZonedCalendarDate,
  parseReminderClockTime,
} from "./reminder-timezone";

const MIDNIGHT_WARNING_HOUR = 23;
const MIDNIGHT_WARNING_MINUTE = 0;

type TimerHandle = ReturnType<typeof setTimeout>;

interface ReminderSchedulerOptions {
  clock?: Pick<Clock, "now">;
  getTodayState: () => TodayState;
  loadState?: () => ReminderRuntimeState;
  saveState?: (state: ReminderRuntimeState) => void;
}

interface ReminderScheduler {
  schedule: (settings: AppSettings) => void;
  cancel: () => void;
  snooze: (settings: AppSettings) => boolean;
}

function noopSaveState(_state: ReminderRuntimeState): void {
  // Tests can omit persistence when they only need scheduling behavior.
}

function clearTimer(timer: TimerHandle | null): null {
  if (timer) {
    clearTimeout(timer);
  }

  return null;
}

function scheduleDailyNotification(
  timezone: string,
  hours: number,
  minutes: number,
  setTimer: (timer: TimerHandle) => void,
  onFire: () => void,
  clock: Pick<Clock, "now">
): void {
  const delay = getDelayUntilNextZonedOccurrence(
    timezone,
    hours,
    minutes,
    clock.now()
  );

  const timer = setTimeout(() => {
    onFire();
    scheduleDailyNotification(
      timezone,
      hours,
      minutes,
      setTimer,
      onFire,
      clock
    );
  }, delay);

  setTimer(timer);
}

export function createReminderScheduler({
  clock = systemClock,
  getTodayState,
  loadState = () => ({ ...DEFAULT_REMINDER_RUNTIME_STATE }),
  saveState = noopSaveState,
}: ReminderSchedulerOptions): ReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  let midnightWarningTimeout: TimerHandle | null = null;
  let snoozeTimeout: TimerHandle | null = null;
  let state = { ...DEFAULT_REMINDER_RUNTIME_STATE };
  let stateLoaded = false;

  function ensureStateLoaded(): void {
    if (stateLoaded) {
      return;
    }

    state = loadState();
    stateLoaded = true;
  }

  function persistState(nextState: ReminderRuntimeState): void {
    ensureStateLoaded();
    state = nextState;
    saveState(state);
  }

  function updateState(
    update:
      | Partial<ReminderRuntimeState>
      | ((current: ReminderRuntimeState) => ReminderRuntimeState)
  ): void {
    const nextState =
      typeof update === "function" ? update(state) : { ...state, ...update };
    persistState(nextState);
  }

  function getCurrentNow(): Date {
    return clock.now();
  }

  function wasSentToday(sentAt: string | null, timezone: string): boolean {
    if (!sentAt) {
      return false;
    }

    return isSameZonedCalendarDate(new Date(sentAt), getCurrentNow(), timezone);
  }

  function hasActiveSnooze(now = getCurrentNow()): boolean {
    ensureStateLoaded();
    return state.snoozedUntil !== null && new Date(state.snoozedUntil) > now;
  }

  function clearSnooze(): void {
    ensureStateLoaded();
    if (state.snoozedUntil === null) {
      return;
    }

    updateState({ snoozedUntil: null });
  }

  function showReminderNotification(notifier: () => void): void {
    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return;
    }

    notifier();
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
  }

  function maybeDeliverScheduledReminder(settings: AppSettings): void {
    if (hasActiveSnooze()) {
      return;
    }

    if (wasSentToday(state.lastReminderSentAt, settings.timezone)) {
      return;
    }

    showReminderNotification(showIncompleteReminder);
  }

  function maybeDeliverCatchUpReminder(settings: AppSettings): boolean {
    if (hasActiveSnooze()) {
      return false;
    }

    if (wasSentToday(state.lastReminderSentAt, settings.timezone)) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    showCatchUpReminder();
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  function maybeDeliverSnoozedReminder(settings: AppSettings): boolean {
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
    showSnoozedReminder(snoozeMinutes);
    updateState({
      lastReminderSentAt: getCurrentNow().toISOString(),
      snoozedUntil: null,
    });
    return true;
  }

  function maybeDeliverMidnightWarning(settings: AppSettings): boolean {
    if (wasSentToday(state.lastMidnightWarningSentAt, settings.timezone)) {
      return false;
    }

    const today = getTodayState();
    if (!hasIncompleteHabitsClosingToday(today)) {
      clearSnooze();
      return false;
    }

    showMidnightWarning();
    updateState({
      lastMidnightWarningSentAt: getCurrentNow().toISOString(),
    });
    return true;
  }

  function maybeDeliverMissedReminderWarning(settings: AppSettings): boolean {
    if (!settings.reminderEnabled) {
      return false;
    }

    if (hasActiveSnooze()) {
      return false;
    }

    if (wasSentToday(state.lastReminderSentAt, settings.timezone)) {
      return false;
    }

    if (wasSentToday(state.lastMissedReminderSentAt, settings.timezone)) {
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

    showMissedReminderWarning();
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
    snoozeTimeout = clearTimer(snoozeTimeout);

    if (!settings.reminderEnabled || state.snoozedUntil === null) {
      return;
    }

    const now = getCurrentNow();
    const dueAt = new Date(state.snoozedUntil);
    if (dueAt <= now) {
      return;
    }

    snoozeTimeout = setTimeout(() => {
      maybeDeliverSnoozedReminder(settings);
      scheduleSnoozedReminder(settings);
    }, dueAt.getTime() - now.getTime());
  }

  function cancel(): void {
    reminderTimeout = clearTimer(reminderTimeout);
    midnightWarningTimeout = clearTimer(midnightWarningTimeout);
    snoozeTimeout = clearTimer(snoozeTimeout);
  }

  function schedule(settings: AppSettings): void {
    ensureStateLoaded();
    cancel();
    runCatchUpChecks(settings);

    scheduleDailyNotification(
      settings.timezone,
      MIDNIGHT_WARNING_HOUR,
      MIDNIGHT_WARNING_MINUTE,
      (timer) => {
        midnightWarningTimeout = timer;
      },
      () => {
        maybeDeliverMidnightWarning(settings);
      },
      clock
    );

    if (settings.reminderEnabled) {
      const reminderTime = parseReminderClockTime(settings.reminderTime);

      if (reminderTime) {
        scheduleDailyNotification(
          settings.timezone,
          reminderTime.hours,
          reminderTime.minutes,
          (timer) => {
            reminderTimeout = timer;
          },
          () => {
            maybeDeliverScheduledReminder(settings);
          },
          clock
        );
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
