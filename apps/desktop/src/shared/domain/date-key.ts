const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;

function readDateKey(dateKey: string): [number, number, number] {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function getIsoDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = readDateKey(dateKey);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, update: (date: Date) => void): string {
  const date = parseDateKey(dateKey);
  update(date);
  return toDateKey(date);
}

export function toDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  const { day, month, year } = valueByType;

  if (!day || !month || !year) {
    throw new Error(`Unable to format date key in timezone: ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getSystemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isValidDateKey(dateKey: string): boolean {
  try {
    return toDateKey(parseDateKey(dateKey)) === dateKey;
  } catch {
    return false;
  }
}

export function addDays(dateKey: string, days: number): string {
  return shiftDateKey(dateKey, (date) => date.setDate(date.getDate() + days));
}

export function addMonths(dateKey: string, months: number): string {
  return shiftDateKey(dateKey, (date) =>
    date.setMonth(date.getMonth() + months, 1)
  );
}

export function startOfMonth(dateKey: string): string {
  return shiftDateKey(dateKey, (date) => date.setDate(1));
}

export function endOfMonth(dateKey: string): string {
  return shiftDateKey(dateKey, (date) => date.setMonth(date.getMonth() + 1, 0));
}

export function getMonthRange(month: Date): {
  endDate: string;
  startDate: string;
} {
  const dateKey = toDateKey(month);
  return { endDate: endOfMonth(dateKey), startDate: startOfMonth(dateKey) };
}

export function getYearRange(year: number): {
  endDate: string;
  startDate: string;
} {
  return { endDate: `${year}-12-31`, startDate: `${year}-01-01` };
}

export function getMonthOffset(month: Date, offset: number): Date {
  return parseDateKey(addMonths(toDateKey(month), offset));
}

export function getDateKeyMonth(dateKey: string): number {
  return Number(dateKey.slice(5, 7));
}

export function startOfWeek(dateKey: string): string {
  return shiftDateKey(dateKey, (date) =>
    date.setDate(date.getDate() - date.getDay())
  );
}

export function endOfWeek(dateKey: string): string {
  return shiftDateKey(dateKey, (date) =>
    date.setDate(date.getDate() + 6 - date.getDay())
  );
}

export function startOfIsoWeek(dateKey: string): string {
  return shiftDateKey(dateKey, (date) =>
    date.setDate(date.getDate() - getIsoDayOfWeek(date))
  );
}

export function endOfIsoWeek(dateKey: string): string {
  return addDays(startOfIsoWeek(dateKey), 6);
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
