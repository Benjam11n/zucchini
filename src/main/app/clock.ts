import { addDays, toDateKey } from "@/shared/utils/date";

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
  todayKey: () => toDateKey(new Date()),
};
