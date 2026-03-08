import {
  endOfWeek,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from "@/shared/utils/date";
import type { HabitFrequency } from "./habit";

export interface HabitPeriod {
  end: string;
  frequency: HabitFrequency;
  start: string;
}

function getMonthStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return toDateKey(date);
}

function getMonthEnd(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + 1, 0);
  return toDateKey(date);
}

export function getHabitPeriod(
  frequency: HabitFrequency,
  dateKey: string
): HabitPeriod {
  if (frequency === "weekly") {
    return {
      end: endOfWeek(dateKey),
      frequency,
      start: startOfWeek(dateKey),
    };
  }

  if (frequency === "monthly") {
    return {
      end: getMonthEnd(dateKey),
      frequency,
      start: getMonthStart(dateKey),
    };
  }

  return {
    end: dateKey,
    frequency,
    start: dateKey,
  };
}

export function isLastDayOfHabitPeriod(
  frequency: HabitFrequency,
  dateKey: string
): boolean {
  return getHabitPeriod(frequency, dateKey).end === dateKey;
}
