/**
 * Common date utilities dealing with 'YYYY-MM-DD' date keys
 */

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

const DATE_FORMAT_PRESETS = {
  fullDate: {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
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
  mediumDateTime: {
    dateStyle: "medium",
    timeStyle: "short",
  },
  month: {
    month: "long",
  },
  monthYear: {
    month: "long",
    year: "numeric",
  },
  shortDate: {
    day: "numeric",
    month: "short",
  },
  shortDateWithDayLong: {
    day: "numeric",
    month: "short",
    weekday: "long",
  },
  shortDateWithDayShort: {
    day: "numeric",
    month: "short",
    weekday: "short",
  },
  shortTime: {
    hour: "numeric",
    minute: "2-digit",
  },
  shortWeekday: {
    weekday: "short",
  },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

type DateFormatPreset = keyof typeof DATE_FORMAT_PRESETS;
type DateFormatOptions = DateFormatPreset | Intl.DateTimeFormatOptions;
const dateKeyTimeZoneFormatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function getDateKeyTimeZoneFormatter(timezone: string): Intl.DateTimeFormat {
  const cachedFormatter = dateKeyTimeZoneFormatters.get(timezone);
  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  });
  dateKeyTimeZoneFormatters.set(timezone, formatter);
  return formatter;
}

function resolveDateFormatOptions(
  options: DateFormatOptions
): Intl.DateTimeFormatOptions {
  if (typeof options === "string") {
    return DATE_FORMAT_PRESETS[options];
  }

  return options;
}

export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  const [yearPart, monthPart, dayPart] = parts;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toDateKeyInTimeZone(date: Date, timezone: string): string {
  const parts = getDateKeyTimeZoneFormatter(timezone).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const year = valueByType.get("year");
  const month = valueByType.get("month");
  const day = valueByType.get("day");

  if (!year || !month || !day) {
    throw new Error(`Unable to format date key in timezone: ${timezone}`);
  }

  return `${year}-${month}-${day}`;
}

export function isValidDateKey(dateKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return false;
  }

  const [yearPart, monthPart, dayPart] = dateKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if ([year, month, day].some((value) => !Number.isInteger(value))) {
    return false;
  }

  const parsedDate = new Date(year, month - 1, day);
  return toDateKey(parsedDate) === dateKey;
}

export function addDays(dateKey: string, days: number): string {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

function addMonths(dateKey: string, months: number): string {
  const next = parseDateKey(dateKey);
  next.setMonth(next.getMonth() + months, 1);
  return toDateKey(next);
}

export function startOfMonth(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return toDateKey(date);
}

export function endOfMonth(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + 1, 0);
  return toDateKey(date);
}

export function getMonthRange(month: Date): {
  endDate: string;
  startDate: string;
} {
  return {
    endDate: endOfMonth(toDateKey(month)),
    startDate: startOfMonth(toDateKey(month)),
  };
}

export function getYearRange(year: number): {
  endDate: string;
  startDate: string;
} {
  return {
    endDate: `${year}-12-31`,
    startDate: `${year}-01-01`,
  };
}

export function getMonthOffset(month: Date, offset: number): Date {
  return parseDateKey(addMonths(toDateKey(month), offset));
}

export function getDateKeyMonth(dateKey: string): number {
  return Number.parseInt(dateKey.slice(5, 7), 10);
}

export function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

export function endOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + (6 - date.getDay()));
  return toDateKey(date);
}

function getIsoDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfIsoWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - getIsoDayOfWeek(date));
  return toDateKey(date);
}

export function endOfIsoWeek(dateKey: string): string {
  const date = parseDateKey(startOfIsoWeek(dateKey));
  date.setDate(date.getDate() + 6);
  return toDateKey(date);
}

export function isMonday(dateKey: string): boolean {
  return getIsoDayOfWeek(parseDateKey(dateKey)) === 0;
}

export function getPreviousCompletedIsoWeek(todayKey: string): {
  weekEnd: string;
  weekStart: string;
} {
  const previousDay = addDays(startOfIsoWeek(todayKey), -1);

  return {
    weekEnd: endOfIsoWeek(previousDay),
    weekStart: startOfIsoWeek(previousDay),
  };
}

export function formatDate(
  date: Date,
  options: DateFormatOptions,
  locale?: string
): string {
  const resolvedOptions = resolveDateFormatOptions(options);
  const cacheKey = JSON.stringify([locale ?? "", resolvedOptions]);
  const cachedFormatter = dateFormatters.get(cacheKey);
  if (cachedFormatter) {
    return cachedFormatter.format(date);
  }

  const formatter = new Intl.DateTimeFormat(locale, resolvedOptions);
  dateFormatters.set(cacheKey, formatter);
  return formatter.format(date);
}

export function formatDateKey(
  dateKey: string,
  options: DateFormatOptions,
  locale?: string
): string {
  return formatDate(parseDateKey(dateKey), options, locale);
}

export function formatIsoDateTime(
  value: string,
  options: DateFormatOptions,
  locale?: string
): string {
  return formatDate(new Date(value), options, locale);
}

export function formatIsoTime(value: string, locale?: string): string {
  return formatIsoDateTime(value, "shortTime", locale);
}
