/**
 * Clock abstraction for time-dependent logic.
 *
 * Decouples business logic from `Date.now()` so tests can inject fixed
 * timestamps and timezones. The `systemClock` singleton is the production
 * implementation used at runtime.
 */
import { addDays, toDateKeyInTimeZone } from "@/shared/utils/date";

export interface Clock {
  now: () => Date;
  todayKey: () => string;
  addDays: (dateKey: string, amount: number) => string;
  compareDateKeys: (left: string, right: string) => number;
  timezone: () => string;
}

export const systemClock: Clock = {
  addDays: (dateKey, amount) => addDays(dateKey, amount),
  compareDateKeys: (left, right) => left.localeCompare(right),
  now: () => new Date(),
  timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  todayKey: () => toDateKeyInTimeZone(new Date(), systemClock.timezone()),
};
