import { parseDateKey } from "@/shared/domain/date-key";

const formats = {
  fullDate: { day: "numeric", month: "short", year: "numeric" },
  fullDateWithDayLong: {
    day: "numeric",
    month: "short",
    weekday: "long",
    year: "numeric",
  },
  fullDateWithDayShort: {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  },
  mediumDateTime: { dateStyle: "medium", timeStyle: "short" },
  month: { month: "long" },
  monthYear: { month: "long", year: "numeric" },
  shortDate: { day: "numeric", month: "short" },
  shortDateWithDayLong: { day: "numeric", month: "short", weekday: "long" },
  shortDateWithDayShort: { day: "numeric", month: "short", weekday: "short" },
  shortTime: { hour: "numeric", minute: "2-digit" },
  shortWeekday: { weekday: "short" },
  weekdayHour24: { hour: "numeric", hourCycle: "h23", weekday: "short" },
  zonedDateTimeParts: {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    year: "numeric",
  },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

type DateFormat = keyof typeof formats;

function formatter(
  format: DateFormat,
  locale?: string,
  timeZone?: string
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    ...formats[format],
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDate(
  date: Date,
  format: DateFormat,
  locale?: string,
  timeZone?: string
): string {
  return formatter(format, locale, timeZone).format(date);
}

export function formatDateKey(
  dateKey: string,
  format: DateFormat,
  locale?: string
): string {
  return formatDate(parseDateKey(dateKey), format, locale);
}

export function formatIsoDateTime(
  value: string,
  format: DateFormat,
  locale?: string
): string {
  return formatDate(new Date(value), format, locale);
}

export function formatIsoTime(value: string, locale?: string): string {
  return formatIsoDateTime(value, "shortTime", locale);
}

export function formatDateParts(
  date: Date,
  format: DateFormat,
  locale?: string,
  timeZone?: string
): Intl.DateTimeFormatPart[] {
  return formatter(format, locale, timeZone).formatToParts(date);
}
