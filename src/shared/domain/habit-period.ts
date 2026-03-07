import type { HabitFrequency } from "./habit";

export interface HabitPeriod {
  end: string;
  frequency: HabitFrequency;
  start: string;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

function getWeekEnd(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + (6 - date.getDay()));
  return toDateKey(date);
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
      end: getWeekEnd(dateKey),
      frequency,
      start: getWeekStart(dateKey),
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
