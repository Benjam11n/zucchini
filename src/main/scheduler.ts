import type { Clock } from "@/main/clock";
import { systemClock } from "@/main/clock";
import type { ReminderRuntimeState } from "@/main/reminder-runtime-state";
import { DEFAULT_REMINDER_RUNTIME_STATE } from "@/main/reminder-runtime-state";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { isLastDayOfHabitPeriod } from "@/shared/domain/habit-period";
import type { AppSettings } from "@/shared/domain/settings";

import {
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
} from "./notifications";

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

function hasIncompleteHabitsClosingToday(today: TodayState): boolean {
  return (
    today.habits.length > 0 &&
    today.habits.some(
      (habit) =>
        !habit.completed && isLastDayOfHabitPeriod(habit.frequency, today.date)
    )
  );
}

function parseClockTime(
  value: string
): { hours: number; minutes: number } | null {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function clearTimer(timer: TimerHandle | null): null {
  if (timer) {
    clearTimeout(timer);
  }

  return null;
}

function getPartValue(
  parts: Intl.DateTimeFormatPart[],
  type: "day" | "hour" | "minute" | "month" | "second" | "year"
): number {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Missing date part: ${type}`);
  }

  return Number(value);
}

function getZonedDateTimeParts(
  date: Date,
  timezone: string
): {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: getPartValue(parts, "day"),
    hour: getPartValue(parts, "hour"),
    minute: getPartValue(parts, "minute"),
    month: getPartValue(parts, "month"),
    second: getPartValue(parts, "second"),
    year: getPartValue(parts, "year"),
  };
}

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = getZonedDateTimeParts(date, timezone);
  const utcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcTimestamp - date.getTime();
}

function zonedTimeToUtcDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  const guess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const firstPass = guess - getTimeZoneOffsetMs(new Date(guess), timezone);
  const secondPass = guess - getTimeZoneOffsetMs(new Date(firstPass), timezone);
  return new Date(secondPass);
}

function addUtcCalendarDays(
  date: { year: number; month: number; day: number },
  amount: number
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day));
  next.setUTCDate(next.getUTCDate() + amount);

  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

function getZonedDateParts(
  date: Date,
  timezone: string
): { year: number; month: number; day: number } {
  const parts = getZonedDateTimeParts(date, timezone);

  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
  };
}

function getDelayUntilNextOccurrence(
  timezone: string,
  hours: number,
  minutes: number,
  now = new Date()
): number {
  const currentDate = getZonedDateParts(now, timezone);
  let nextRun = zonedTimeToUtcDate(
    currentDate.year,
    currentDate.month,
    currentDate.day,
    hours,
    minutes,
    timezone
  );

  if (nextRun.getTime() <= now.getTime()) {
    const nextDay = addUtcCalendarDays(currentDate, 1);
    nextRun = zonedTimeToUtcDate(
      nextDay.year,
      nextDay.month,
      nextDay.day,
      hours,
      minutes,
      timezone
    );
  }

  return Math.max(nextRun.getTime() - now.getTime(), 0);
}

function isSameZonedDate(left: Date, right: Date, timezone: string): boolean {
  const leftParts = getZonedDateParts(left, timezone);
  const rightParts = getZonedDateParts(right, timezone);

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
}

function isAtOrPastTime(
  date: Date,
  timezone: string,
  hours: number,
  minutes: number
): boolean {
  const parts = getZonedDateTimeParts(date, timezone);

  if (parts.hour > hours) {
    return true;
  }

  if (parts.hour < hours) {
    return false;
  }

  return parts.minute >= minutes;
}

function scheduleDailyNotification(
  timezone: string,
  hours: number,
  minutes: number,
  setTimer: (timer: TimerHandle) => void,
  onFire: () => void,
  clock: Pick<Clock, "now">
): void {
  const delay = getDelayUntilNextOccurrence(
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
  saveState = () => {},
}: ReminderSchedulerOptions): ReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  let midnightWarningTimeout: TimerHandle | null = null;
  let snoozeTimeout: TimerHandle | null = null;
  let state = loadState();

  function persistState(nextState: ReminderRuntimeState): void {
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

    return isSameZonedDate(new Date(sentAt), getCurrentNow(), timezone);
  }

  function hasActiveSnooze(now = getCurrentNow()): boolean {
    return state.snoozedUntil !== null && new Date(state.snoozedUntil) > now;
  }

  function clearSnooze(): void {
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

    const reminderTime = parseClockTime(settings.reminderTime);
    if (!reminderTime) {
      return false;
    }

    if (
      !isAtOrPastTime(
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
      isAtOrPastTime(
        getCurrentNow(),
        settings.timezone,
        MIDNIGHT_WARNING_HOUR,
        MIDNIGHT_WARNING_MINUTE
      )
    ) {
      if (maybeDeliverMissedReminderWarning(settings)) {
        return;
      }

      void maybeDeliverMidnightWarning(settings);
      return;
    }

    if (!settings.reminderEnabled) {
      clearSnooze();
      return;
    }

    const reminderTime = parseClockTime(settings.reminderTime);
    if (!reminderTime) {
      clearSnooze();
      return;
    }

    if (
      isAtOrPastTime(
        getCurrentNow(),
        settings.timezone,
        reminderTime.hours,
        reminderTime.minutes
      )
    ) {
      void maybeDeliverCatchUpReminder(settings);
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
      void maybeDeliverSnoozedReminder(settings);
      scheduleSnoozedReminder(settings);
    }, dueAt.getTime() - now.getTime());
  }

  function cancel(): void {
    reminderTimeout = clearTimer(reminderTimeout);
    midnightWarningTimeout = clearTimer(midnightWarningTimeout);
    snoozeTimeout = clearTimer(snoozeTimeout);
  }

  function schedule(settings: AppSettings): void {
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
        void maybeDeliverMidnightWarning(settings);
      },
      clock
    );

    if (settings.reminderEnabled) {
      const reminderTime = parseClockTime(settings.reminderTime);

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
