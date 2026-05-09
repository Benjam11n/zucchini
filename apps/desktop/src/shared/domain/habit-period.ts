/**
 * Habit period boundary calculations.
 *
 * Determines the start and end dates for a habit's current period
 * (daily, weekly, monthly) so the reminder scheduler and streak engine
 * can check whether habits are closing or already settled.
 */
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@/shared/utils/date";

import type { HabitFrequency } from "./habit";

interface HabitPeriod {
  end: string;
  frequency: HabitFrequency;
  start: string;
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
      end: endOfMonth(dateKey),
      frequency,
      start: startOfMonth(dateKey),
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
