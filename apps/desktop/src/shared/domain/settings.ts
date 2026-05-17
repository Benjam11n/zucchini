import { APP_CONFIG } from "@/shared/config/app-config";
import type { HabitCategory } from "@/shared/domain/habit";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";

/**
 * Application settings domain and validation helpers.
 *
 * This file describes the persisted settings object and provides pure checks
 * for reminder times, snooze values, and time zone strings.
 */
export type ThemeMode = "system" | "light" | "dark";
export type AutoBackupCadence = "off" | "daily" | "weekly";
export interface PomodoroTimerSettings {
  focusDefaultDurationSeconds: number;
  focusCyclesBeforeLongBreak: number;
  focusLongBreakSeconds: number;
  focusShortBreakSeconds: number;
}

interface FocusTimerShortcutSettings {
  resetFocusTimerShortcut: string;
  toggleFocusTimerShortcut: string;
}

export const HABIT_CATEGORY_ICON_VALUES = [
  "utensils",
  "apple",
  "zap",
  "brain",
  "dumbbell",
  "heartPulse",
  "book",
  "code",
  "music",
  "palette",
  "camera",
  "penTool",
  "moon",
  "coffee",
  "droplet",
  "flame",
  "leaf",
  "wallet",
  "gamepad",
  "briefcase",
  "heart",
  "sun",
] as const;

export type HabitCategoryIcon = (typeof HABIT_CATEGORY_ICON_VALUES)[number];

interface HabitCategoryMetadata {
  color: string;
  icon: HabitCategoryIcon;
  label: string;
}

export type HabitCategoryPreferences = Record<
  HabitCategory,
  HabitCategoryMetadata
>;

export const DEFAULT_REMINDER_SNOOZE_MINUTES =
  APP_CONFIG.reminders.defaultSnoozeMinutes;
const MAX_GLOBAL_SHORTCUT_LENGTH = 100;
const GLOBAL_SHORTCUT_MODIFIERS = new Set([
  "alt",
  "cmd",
  "cmdorctrl",
  "command",
  "commandorcontrol",
  "control",
  "ctrl",
  "meta",
  "option",
  "shift",
  "super",
]);
const GLOBAL_SHORTCUT_KEYS = new Set([
  "backspace",
  "delete",
  "down",
  "end",
  "enter",
  "esc",
  "escape",
  "home",
  "insert",
  "left",
  "pagedown",
  "pageup",
  "return",
  "right",
  "space",
  "tab",
  "up",
]);
const GLOBAL_SHORTCUT_UNSUPPORTED_TOKENS = new Set(["fn", "globe"]);
const HABIT_CATEGORY_LABEL_MAX_LENGTH = 24;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const DEFAULT_HABIT_CATEGORY_COLORS: Record<HabitCategory, string> = {
  fitness: "#FF2D55",
  nutrition: "#78C500",
  productivity: "#04C7DD",
};

const DEFAULT_HABIT_CATEGORY_ICONS: Record<HabitCategory, HabitCategoryIcon> = {
  fitness: "dumbbell",
  nutrition: "utensils",
  productivity: "zap",
};

export interface AppSettings {
  autoBackupCadence: AutoBackupCadence;
  autoBackupLastRunAt: string | null;
  categoryPreferences: HabitCategoryPreferences;
  focusDefaultDurationSeconds: PomodoroTimerSettings["focusDefaultDurationSeconds"];
  focusCyclesBeforeLongBreak: PomodoroTimerSettings["focusCyclesBeforeLongBreak"];
  focusLongBreakSeconds: PomodoroTimerSettings["focusLongBreakSeconds"];
  focusShortBreakSeconds: PomodoroTimerSettings["focusShortBreakSeconds"];
  launchAtLogin: boolean;
  minimizeToTray: boolean;
  reminderEnabled: boolean;
  reminderSnoozeMinutes: number;
  reminderTime: string;
  resetFocusTimerShortcut: FocusTimerShortcutSettings["resetFocusTimerShortcut"];
  themeMode: ThemeMode;
  toggleFocusTimerShortcut: FocusTimerShortcutSettings["toggleFocusTimerShortcut"];
  windDownTime: string;
  timezone: string;
}

function isMacLikePlatform(platform: string): boolean {
  return platform === "darwin";
}

function getRuntimePlatform(): string {
  if (typeof process !== "undefined" && typeof process.platform === "string") {
    return process.platform;
  }

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.platform === "string" &&
    navigator.platform.toLowerCase().includes("mac")
  ) {
    return "darwin";
  }

  return "unknown";
}

export function createDefaultFocusTimerShortcutSettings(
  platform = getRuntimePlatform()
): FocusTimerShortcutSettings {
  return {
    resetFocusTimerShortcut: isMacLikePlatform(platform)
      ? FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset
      : FOCUS_TIMER_SHORTCUT_DEFAULTS.other.reset,
    toggleFocusTimerShortcut: isMacLikePlatform(platform)
      ? FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle
      : FOCUS_TIMER_SHORTCUT_DEFAULTS.other.toggle,
  };
}

export function createDefaultPomodoroTimerSettings(): PomodoroTimerSettings {
  return {
    focusCyclesBeforeLongBreak: APP_CONFIG.focus.defaultCyclesBeforeLongBreak,
    focusDefaultDurationSeconds: APP_CONFIG.focus.defaultDurations.focusSeconds,
    focusLongBreakSeconds: APP_CONFIG.focus.defaultDurations.longBreakSeconds,
    focusShortBreakSeconds: APP_CONFIG.focus.defaultDurations.shortBreakSeconds,
  };
}

export function createDefaultHabitCategoryPreferences(): HabitCategoryPreferences {
  return Object.fromEntries(
    HABIT_CATEGORY_SLOTS.map(({ defaultLabel, value }) => [
      value,
      {
        color: DEFAULT_HABIT_CATEGORY_COLORS[value],
        icon: DEFAULT_HABIT_CATEGORY_ICONS[value],
        label: defaultLabel,
      },
    ])
  ) as HabitCategoryPreferences;
}

export function createDefaultAppSettings(timezone: string): AppSettings {
  return {
    autoBackupCadence: "off",
    autoBackupLastRunAt: null,
    categoryPreferences: createDefaultHabitCategoryPreferences(),
    ...createDefaultPomodoroTimerSettings(),
    ...createDefaultFocusTimerShortcutSettings(),
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: APP_CONFIG.reminders.defaultSnoozeMinutes,
    reminderTime: APP_CONFIG.reminders.defaultTime,
    themeMode: "system",
    timezone,
    windDownTime: APP_CONFIG.windDown.defaultTime,
  };
}

export function getPomodoroTimerSettings(
  settings: Pick<
    AppSettings,
    | "focusDefaultDurationSeconds"
    | "focusCyclesBeforeLongBreak"
    | "focusLongBreakSeconds"
    | "focusShortBreakSeconds"
  >
): PomodoroTimerSettings {
  return {
    focusCyclesBeforeLongBreak: settings.focusCyclesBeforeLongBreak,
    focusDefaultDurationSeconds: settings.focusDefaultDurationSeconds,
    focusLongBreakSeconds: settings.focusLongBreakSeconds,
    focusShortBreakSeconds: settings.focusShortBreakSeconds,
  };
}

function isSupportedGlobalShortcutKey(token: string): boolean {
  return (
    GLOBAL_SHORTCUT_KEYS.has(token) ||
    /^[a-z0-9]$/i.test(token) ||
    /^f([1-9]|1\d|2[0-4])$/i.test(token)
  );
}

function parseGlobalShortcutAccelerator(
  value: string
): { key: string; modifiers: string[] } | null {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > MAX_GLOBAL_SHORTCUT_LENGTH) {
    return null;
  }

  const tokens = trimmed
    .split("+")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length < 2) {
    return null;
  }

  const modifiers: string[] = [];
  let key: string | null = null;

  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();

    if (GLOBAL_SHORTCUT_UNSUPPORTED_TOKENS.has(normalizedToken)) {
      return null;
    }

    if (GLOBAL_SHORTCUT_MODIFIERS.has(normalizedToken)) {
      modifiers.push(normalizedToken);
      continue;
    }

    if (key !== null || !isSupportedGlobalShortcutKey(normalizedToken)) {
      return null;
    }

    key = normalizedToken;
  }

  if (key === null || modifiers.length === 0) {
    return null;
  }

  const uniqueModifiers = [...new Set(modifiers)].toSorted();

  return { key, modifiers: uniqueModifiers };
}

export function isValidGlobalShortcutAccelerator(value: string): boolean {
  return parseGlobalShortcutAccelerator(value) !== null;
}

export function isValidHabitCategoryLabel(value: string): boolean {
  const trimmed = value.trim();

  return (
    trimmed.length >= 1 && trimmed.length <= HABIT_CATEGORY_LABEL_MAX_LENGTH
  );
}

export function isValidHabitCategoryColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function isValidHabitCategoryIcon(
  value: string
): value is HabitCategoryIcon {
  return HABIT_CATEGORY_ICON_VALUES.includes(value as HabitCategoryIcon);
}

export function normalizeGlobalShortcutAccelerator(
  value: string
): string | null {
  const parsedAccelerator = parseGlobalShortcutAccelerator(value);

  if (!parsedAccelerator) {
    return null;
  }

  return [...parsedAccelerator.modifiers, parsedAccelerator.key].join("+");
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
    value >= APP_CONFIG.reminders.snoozeRange.min &&
    value <= APP_CONFIG.reminders.snoozeRange.max
  );
}

export function isValidFocusDurationSeconds(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= APP_CONFIG.focus.durationRanges.focusSeconds.min &&
    value <= APP_CONFIG.focus.durationRanges.focusSeconds.max
  );
}

export function isValidFocusBreakDurationSeconds(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= APP_CONFIG.focus.durationRanges.breakSeconds.min &&
    value <= APP_CONFIG.focus.durationRanges.breakSeconds.max
  );
}

export function isValidFocusCyclesBeforeLongBreak(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= APP_CONFIG.focus.cyclesRange.min &&
    value <= APP_CONFIG.focus.cyclesRange.max
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
