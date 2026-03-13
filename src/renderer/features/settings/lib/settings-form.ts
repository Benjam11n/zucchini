import type { ZodIssue } from "zod";

import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import type { AppSettings } from "@/shared/domain/settings";

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
    left.focusDefaultDurationSeconds === right.focusDefaultDurationSeconds &&
    left.focusCyclesBeforeLongBreak === right.focusCyclesBeforeLongBreak &&
    left.focusLongBreakSeconds === right.focusLongBreakSeconds &&
    left.focusShortBreakSeconds === right.focusShortBreakSeconds &&
    left.launchAtLogin === right.launchAtLogin &&
    left.minimizeToTray === right.minimizeToTray &&
    left.reminderEnabled === right.reminderEnabled &&
    left.reminderSnoozeMinutes === right.reminderSnoozeMinutes &&
    left.reminderTime === right.reminderTime &&
    left.themeMode === right.themeMode &&
    left.timezone === right.timezone
  );
}

export function mapSettingsValidationErrors(
  issues: readonly ZodIssue[]
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
