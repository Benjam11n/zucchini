/**
 * Common date utilities dealing with 'YYYY-MM-DD' date keys
 */

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object.
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a local Date object into a 'YYYY-MM-DD' string representation.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Adds a number of days to a 'YYYY-MM-DD' key, returning the new key.
 */
export function addDays(dateKey: string, days: number): string {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

/**
 * Gets the date key for the start of the week (Sunday) containing the given date key.
 */
export function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

/**
 * Gets the date key for the end of the week (Saturday) containing the given date key.
 */
export function endOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + (6 - date.getDay()));
  return toDateKey(date);
}

/**
 * Formats a given date key using the Intl API options
 */
export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  return new Intl.DateTimeFormat(locale, options).format(parseDateKey(dateKey));
}
