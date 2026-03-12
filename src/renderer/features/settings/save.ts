import type { ZodIssue } from "zod";

import type { SettingsFieldErrors } from "@/renderer/features/app/types";
import type { AppSettings } from "@/shared/domain/settings";

// Check: why is this file called save.ts? is it utils? can we have a better name?
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
