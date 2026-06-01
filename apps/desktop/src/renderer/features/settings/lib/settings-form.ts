import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import type { HabitCategory } from "@/shared/domain/habit";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import { FOCUS_TIMER_SHORTCUT_REFERENCE } from "@/shared/domain/keyboard-shortcuts";
import type { AppSettings } from "@/shared/domain/settings";
import {
  HABIT_CATEGORY_ICON_VALUES,
  isThemeMode,
  isValidFocusBreakDurationSeconds,
  isValidFocusCyclesBeforeLongBreak,
  isValidFocusDurationSeconds,
  isValidGlobalShortcutAccelerator,
  isValidHabitCategoryColor,
  isValidHabitCategoryIcon,
  isValidHabitCategoryLabel,
  isValidReminderSnoozeMinutes,
  isValidReminderTime,
  isValidTimeZone,
  normalizeGlobalShortcutAccelerator,
} from "@/shared/domain/settings";

interface SettingsValidationIssue {
  message: string;
  path: readonly (string | number)[];
}

export function areAppSettingsEqual(
  left: AppSettings | null,
  right: AppSettings | null
): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    JSON.stringify(left.categoryPreferences) ===
      JSON.stringify(right.categoryPreferences) &&
    left.autoBackupCadence === right.autoBackupCadence &&
    left.focusDefaultDurationSeconds === right.focusDefaultDurationSeconds &&
    left.focusCyclesBeforeLongBreak === right.focusCyclesBeforeLongBreak &&
    left.focusLongBreakSeconds === right.focusLongBreakSeconds &&
    left.focusShortBreakSeconds === right.focusShortBreakSeconds &&
    left.launchAtLogin === right.launchAtLogin &&
    left.minimizeToTray === right.minimizeToTray &&
    left.reminderEnabled === right.reminderEnabled &&
    left.reminderSnoozeMinutes === right.reminderSnoozeMinutes &&
    left.reminderTime === right.reminderTime &&
    left.resetFocusTimerShortcut === right.resetFocusTimerShortcut &&
    left.themeMode === right.themeMode &&
    left.toggleFocusTimerShortcut === right.toggleFocusTimerShortcut &&
    left.windDownTime === right.windDownTime &&
    left.timezone === right.timezone
  );
}

export function mapSettingsValidationErrors(
  issues: readonly SettingsValidationIssue[]
): SettingsFieldErrors {
  const fieldErrors: SettingsFieldErrors = {};

  for (const issue of issues) {
    const [field] = issue.path;
    if (typeof field !== "string" || field in fieldErrors) {
      continue;
    }

    fieldErrors[field as keyof AppSettings] = issue.message;
  }

  return fieldErrors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestampOrNull(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value)))
  );
}

function isAutoBackupCadence(
  value: unknown
): value is AppSettings["autoBackupCadence"] {
  return value === "off" || value === "daily" || value === "weekly";
}

function addIssue(
  issues: SettingsValidationIssue[],
  field: keyof AppSettings,
  message: string
) {
  issues.push({ message, path: [field] });
}

function validateCategoryPreferences(
  value: unknown,
  issues: SettingsValidationIssue[]
) {
  if (!isRecord(value)) {
    addIssue(
      issues,
      "categoryPreferences",
      "Category preferences are invalid."
    );
    return;
  }

  for (const { value: category } of HABIT_CATEGORY_SLOTS) {
    const metadata = value[category];
    if (!isRecord(metadata)) {
      addIssue(
        issues,
        "categoryPreferences",
        "Category preferences are invalid."
      );
      continue;
    }

    if (!isValidHabitCategoryColor(String(metadata["color"] ?? ""))) {
      addIssue(
        issues,
        "categoryPreferences",
        "Category colors must use #RRGGBB format."
      );
    }

    if (
      typeof metadata["icon"] !== "string" ||
      !isValidHabitCategoryIcon(metadata["icon"])
    ) {
      addIssue(
        issues,
        "categoryPreferences",
        `Category icons must use one of: ${HABIT_CATEGORY_ICON_VALUES.join(", ")}.`
      );
    }

    if (!isValidHabitCategoryLabel(String(metadata["label"] ?? ""))) {
      addIssue(
        issues,
        "categoryPreferences",
        "Category labels must be between 1 and 24 characters."
      );
    }
  }

  const allowedCategories = new Set<HabitCategory>(
    HABIT_CATEGORY_SLOTS.map((slot) => slot.value)
  );
  if (
    Object.keys(value).some(
      (category) => !allowedCategories.has(category as HabitCategory)
    )
  ) {
    addIssue(
      issues,
      "categoryPreferences",
      "Category preferences contain an unknown category."
    );
  }
}

export function validateAppSettings(settings: AppSettings): {
  data: AppSettings;
  issues: SettingsValidationIssue[];
  success: boolean;
} {
  const issues: SettingsValidationIssue[] = [];

  if (!isAutoBackupCadence(settings.autoBackupCadence)) {
    addIssue(issues, "autoBackupCadence", "Auto backup cadence is invalid.");
  }

  if (!isIsoTimestampOrNull(settings.autoBackupLastRunAt)) {
    addIssue(
      issues,
      "autoBackupLastRunAt",
      "Auto backup timestamp must be a valid ISO timestamp."
    );
  }

  validateCategoryPreferences(settings.categoryPreferences, issues);

  if (!isValidFocusCyclesBeforeLongBreak(settings.focusCyclesBeforeLongBreak)) {
    addIssue(
      issues,
      "focusCyclesBeforeLongBreak",
      "Cycles before a long break must be between 1 and 12."
    );
  }

  if (!isValidFocusDurationSeconds(settings.focusDefaultDurationSeconds)) {
    addIssue(
      issues,
      "focusDefaultDurationSeconds",
      "Focus duration must be between 1 second and 60 minutes."
    );
  }

  if (!isValidFocusBreakDurationSeconds(settings.focusLongBreakSeconds)) {
    addIssue(
      issues,
      "focusLongBreakSeconds",
      "Long break duration must be between 1 second and 60 minutes."
    );
  }

  if (!isValidFocusBreakDurationSeconds(settings.focusShortBreakSeconds)) {
    addIssue(
      issues,
      "focusShortBreakSeconds",
      "Short break duration must be between 1 second and 60 minutes."
    );
  }

  if (typeof settings.launchAtLogin !== "boolean") {
    addIssue(issues, "launchAtLogin", "Launch at login must be on or off.");
  }

  if (typeof settings.minimizeToTray !== "boolean") {
    addIssue(issues, "minimizeToTray", "Minimize to tray must be on or off.");
  }

  if (typeof settings.reminderEnabled !== "boolean") {
    addIssue(issues, "reminderEnabled", "Reminder enabled must be on or off.");
  }

  if (!isValidReminderSnoozeMinutes(settings.reminderSnoozeMinutes)) {
    addIssue(
      issues,
      "reminderSnoozeMinutes",
      "Reminder snooze minutes must be between 1 and 240."
    );
  }

  if (!isValidReminderTime(settings.reminderTime)) {
    addIssue(
      issues,
      "reminderTime",
      "Reminder time must use HH:MM 24-hour format."
    );
  }

  if (!isValidGlobalShortcutAccelerator(settings.resetFocusTimerShortcut)) {
    addIssue(
      issues,
      "resetFocusTimerShortcut",
      `Global shortcuts must use a supported accelerator like ${FOCUS_TIMER_SHORTCUT_REFERENCE.toggle}.`
    );
  }

  if (!isThemeMode(settings.themeMode)) {
    addIssue(issues, "themeMode", "Theme mode is invalid.");
  }

  if (!isValidTimeZone(settings.timezone)) {
    addIssue(issues, "timezone", "Timezone must be a valid IANA timezone.");
  }

  if (!isValidGlobalShortcutAccelerator(settings.toggleFocusTimerShortcut)) {
    addIssue(
      issues,
      "toggleFocusTimerShortcut",
      `Global shortcuts must use a supported accelerator like ${FOCUS_TIMER_SHORTCUT_REFERENCE.toggle}.`
    );
  }

  if (!isValidReminderTime(settings.windDownTime)) {
    addIssue(
      issues,
      "windDownTime",
      "Wind down time must use HH:MM 24-hour format."
    );
  }

  if (settings.focusLongBreakSeconds < settings.focusShortBreakSeconds) {
    addIssue(
      issues,
      "focusLongBreakSeconds",
      "Long break duration must be greater than or equal to short break duration."
    );
  }

  if (
    normalizeGlobalShortcutAccelerator(settings.toggleFocusTimerShortcut) ===
    normalizeGlobalShortcutAccelerator(settings.resetFocusTimerShortcut)
  ) {
    addIssue(
      issues,
      "toggleFocusTimerShortcut",
      "Global start/pause/resume shortcut must be different from the reset shortcut."
    );
    addIssue(
      issues,
      "resetFocusTimerShortcut",
      "Global reset shortcut must be different from the start/pause/resume shortcut."
    );
  }

  return {
    data: settings,
    issues,
    success: issues.length === 0,
  };
}
