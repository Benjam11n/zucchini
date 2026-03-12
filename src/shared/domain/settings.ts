/**
 * Application settings domain and validation helpers.
 *
 * This file describes the persisted settings object and provides pure checks
 * for reminder times, snooze values, and time zone strings.
 */
export type ThemeMode = "system" | "light" | "dark";

const DEFAULT_REMINDER_TIME = "20:30";
export const DEFAULT_REMINDER_SNOOZE_MINUTES = 15;
const MIN_REMINDER_SNOOZE_MINUTES = 1;
const MAX_REMINDER_SNOOZE_MINUTES = 240;

export interface AppSettings {
  launchAtLogin: boolean;
  minimizeToTray: boolean;
  reminderEnabled: boolean;
  reminderSnoozeMinutes: number;
  reminderTime: string;
  themeMode: ThemeMode;
  timezone: string;
}

export function createDefaultAppSettings(timezone: string): AppSettings {
  return {
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: DEFAULT_REMINDER_SNOOZE_MINUTES,
    reminderTime: DEFAULT_REMINDER_TIME,
    themeMode: "system",
    timezone,
  };
}

export function isThemeMode(value: string): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function isValidReminderTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
}

export function isValidReminderSnoozeMinutes(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_REMINDER_SNOOZE_MINUTES &&
    value <= MAX_REMINDER_SNOOZE_MINUTES
  );
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", {
      timeZone: value,
    }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
