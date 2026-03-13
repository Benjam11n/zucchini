/**
 * Application settings domain and validation helpers.
 *
 * This file describes the persisted settings object and provides pure checks
 * for reminder times, snooze values, and time zone strings.
 */
export type ThemeMode = "system" | "light" | "dark";
export interface PomodoroTimerSettings {
  focusDefaultDurationSeconds: number;
  focusCyclesBeforeLongBreak: number;
  focusLongBreakMinutes: number;
  focusShortBreakMinutes: number;
}

const DEFAULT_REMINDER_TIME = "20:30";
export const DEFAULT_REMINDER_SNOOZE_MINUTES = 15;
export const DEFAULT_FOCUS_DURATION_SECONDS = 25 * 60;
export const DEFAULT_FOCUS_SHORT_BREAK_MINUTES = 5;
export const DEFAULT_FOCUS_LONG_BREAK_MINUTES = 15;
export const DEFAULT_FOCUS_CYCLES_BEFORE_LONG_BREAK = 4;
const MIN_REMINDER_SNOOZE_MINUTES = 1;
const MAX_REMINDER_SNOOZE_MINUTES = 240;
const MIN_FOCUS_DURATION_SECONDS = 1;
const MAX_FOCUS_DURATION_SECONDS = 60 * 60;
const MIN_FOCUS_BREAK_MINUTES = 1;
const MAX_FOCUS_BREAK_MINUTES = 60;
const MIN_FOCUS_CYCLES_BEFORE_LONG_BREAK = 1;
const MAX_FOCUS_CYCLES_BEFORE_LONG_BREAK = 12;

export interface AppSettings {
  focusDefaultDurationSeconds: PomodoroTimerSettings["focusDefaultDurationSeconds"];
  focusCyclesBeforeLongBreak: PomodoroTimerSettings["focusCyclesBeforeLongBreak"];
  focusLongBreakMinutes: PomodoroTimerSettings["focusLongBreakMinutes"];
  focusShortBreakMinutes: PomodoroTimerSettings["focusShortBreakMinutes"];
  launchAtLogin: boolean;
  minimizeToTray: boolean;
  reminderEnabled: boolean;
  reminderSnoozeMinutes: number;
  reminderTime: string;
  themeMode: ThemeMode;
  timezone: string;
}

export function createDefaultPomodoroTimerSettings(): PomodoroTimerSettings {
  return {
    focusCyclesBeforeLongBreak: DEFAULT_FOCUS_CYCLES_BEFORE_LONG_BREAK,
    focusDefaultDurationSeconds: DEFAULT_FOCUS_DURATION_SECONDS,
    focusLongBreakMinutes: DEFAULT_FOCUS_LONG_BREAK_MINUTES,
    focusShortBreakMinutes: DEFAULT_FOCUS_SHORT_BREAK_MINUTES,
  };
}

export function createDefaultAppSettings(timezone: string): AppSettings {
  return {
    ...createDefaultPomodoroTimerSettings(),
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: DEFAULT_REMINDER_SNOOZE_MINUTES,
    reminderTime: DEFAULT_REMINDER_TIME,
    themeMode: "system",
    timezone,
  };
}

export function getPomodoroTimerSettings(
  settings: Pick<
    AppSettings,
    | "focusDefaultDurationSeconds"
    | "focusCyclesBeforeLongBreak"
    | "focusLongBreakMinutes"
    | "focusShortBreakMinutes"
  >
): PomodoroTimerSettings {
  return {
    focusCyclesBeforeLongBreak: settings.focusCyclesBeforeLongBreak,
    focusDefaultDurationSeconds: settings.focusDefaultDurationSeconds,
    focusLongBreakMinutes: settings.focusLongBreakMinutes,
    focusShortBreakMinutes: settings.focusShortBreakMinutes,
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

export function isValidFocusDurationSeconds(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_FOCUS_DURATION_SECONDS &&
    value <= MAX_FOCUS_DURATION_SECONDS
  );
}

export function isValidFocusBreakMinutes(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_FOCUS_BREAK_MINUTES &&
    value <= MAX_FOCUS_BREAK_MINUTES
  );
}

export function isValidFocusCyclesBeforeLongBreak(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_FOCUS_CYCLES_BEFORE_LONG_BREAK &&
    value <= MAX_FOCUS_CYCLES_BEFORE_LONG_BREAK
  );
}

export function isValidPomodoroTimerSettings(
  settings: PomodoroTimerSettings
): boolean {
  return (
    isValidFocusDurationSeconds(settings.focusDefaultDurationSeconds) &&
    isValidFocusCyclesBeforeLongBreak(settings.focusCyclesBeforeLongBreak) &&
    isValidFocusBreakMinutes(settings.focusLongBreakMinutes) &&
    isValidFocusBreakMinutes(settings.focusShortBreakMinutes) &&
    settings.focusLongBreakMinutes >= settings.focusShortBreakMinutes
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
