interface ZonedDateParts {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}

interface ZonedCalendarDate {
  day: number;
  month: number;
  year: number;
}

export function parseReminderClockTime(
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

function getRequiredDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: "day" | "hour" | "minute" | "month" | "second" | "year"
): number {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Missing date part: ${type}`);
  }

  return Number(value);
}

function getZonedDateTimeParts(date: Date, timezone: string): ZonedDateParts {
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
    day: getRequiredDateTimePart(parts, "day"),
    hour: getRequiredDateTimePart(parts, "hour"),
    minute: getRequiredDateTimePart(parts, "minute"),
    month: getRequiredDateTimePart(parts, "month"),
    second: getRequiredDateTimePart(parts, "second"),
    year: getRequiredDateTimePart(parts, "year"),
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
  date: ZonedCalendarDate,
  amount: number
): ZonedCalendarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day));
  next.setUTCDate(next.getUTCDate() + amount);

  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

function getZonedCalendarDate(date: Date, timezone: string): ZonedCalendarDate {
  const parts = getZonedDateTimeParts(date, timezone);

  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
  };
}

export function getDelayUntilNextZonedOccurrence(
  timezone: string,
  hours: number,
  minutes: number,
  now = new Date()
): number {
  const currentDate = getZonedCalendarDate(now, timezone);
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

export function isSameZonedCalendarDate(
  left: Date,
  right: Date,
  timezone: string
): boolean {
  const leftParts = getZonedCalendarDate(left, timezone);
  const rightParts = getZonedCalendarDate(right, timezone);

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
}

export function isAtOrPastZonedTime(
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
