import type { TodayState } from "@/shared/contracts/habits-ipc";
import { isLastDayOfHabitPeriod } from "@/shared/domain/habit-period";
import type { AppSettings } from "@/shared/domain/settings";

import { showIncompleteReminder, showMidnightWarning } from "./notifications";

const MIDNIGHT_WARNING_HOUR = 23;
const MIDNIGHT_WARNING_MINUTE = 0;

type TimerHandle = ReturnType<typeof setTimeout>;

interface ReminderScheduler {
  schedule: (settings: AppSettings) => void;
  cancel: () => void;
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

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
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

  const utcTimestamp = Date.UTC(
    getPartValue(parts, "year"),
    getPartValue(parts, "month") - 1,
    getPartValue(parts, "day"),
    getPartValue(parts, "hour"),
    getPartValue(parts, "minute"),
    getPartValue(parts, "second")
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
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: getPartValue(parts, "day"),
    month: getPartValue(parts, "month"),
    year: getPartValue(parts, "year"),
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

function scheduleDailyNotification(
  timezone: string,
  hours: number,
  minutes: number,
  setTimer: (timer: TimerHandle) => void,
  onFire: () => void
): void {
  const delay = getDelayUntilNextOccurrence(timezone, hours, minutes);

  const timer = setTimeout(() => {
    onFire();
    scheduleDailyNotification(timezone, hours, minutes, setTimer, onFire);
  }, delay);

  setTimer(timer);
}

export function createReminderScheduler(
  getTodayState: () => TodayState
): ReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  let midnightWarningTimeout: TimerHandle | null = null;

  function cancel(): void {
    reminderTimeout = clearTimer(reminderTimeout);
    midnightWarningTimeout = clearTimer(midnightWarningTimeout);
  }

  function schedule(settings: AppSettings): void {
    cancel();

    scheduleDailyNotification(
      settings.timezone,
      MIDNIGHT_WARNING_HOUR,
      MIDNIGHT_WARNING_MINUTE,
      (timer) => {
        midnightWarningTimeout = timer;
      },
      () => {
        if (hasIncompleteHabitsClosingToday(getTodayState())) {
          showMidnightWarning();
        }
      }
    );

    if (!settings.reminderEnabled) {
      return;
    }

    const reminderTime = parseClockTime(settings.reminderTime);
    if (!reminderTime) {
      return;
    }

    scheduleDailyNotification(
      settings.timezone,
      reminderTime.hours,
      reminderTime.minutes,
      (timer) => {
        reminderTimeout = timer;
      },
      () => {
        if (hasIncompleteHabitsClosingToday(getTodayState())) {
          showIncompleteReminder();
        }
      }
    );
  }

  return { cancel, schedule };
}
