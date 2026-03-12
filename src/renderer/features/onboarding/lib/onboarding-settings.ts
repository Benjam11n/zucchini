import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

import type {
  OnboardingReminderDraft,
  ReminderFieldErrors,
  ResolvedOnboardingSettings,
} from "../onboarding.types";

export function createReminderDraft(
  settings: AppSettings
): OnboardingReminderDraft {
  return {
    reminderEnabled: settings.reminderEnabled,
    reminderTime: settings.reminderTime,
    timezone: settings.timezone,
  };
}

export function resolveOnboardingSettings(
  baseSettings: AppSettings,
  reminderDraft: OnboardingReminderDraft
): ResolvedOnboardingSettings {
  const candidateSettings: AppSettings = {
    ...baseSettings,
    reminderEnabled: reminderDraft.reminderEnabled,
    reminderTime: reminderDraft.reminderTime,
    timezone: reminderDraft.timezone,
  };
  const validationResult = appSettingsSchema.safeParse(candidateSettings);

  if (validationResult.success) {
    return {
      fieldErrors: {},
      settings: validationResult.data,
    };
  }

  const fieldErrors: ReminderFieldErrors = {};
  for (const issue of validationResult.error.issues) {
    const [field] = issue.path;
    if (field !== "reminderTime" && field !== "timezone") {
      continue;
    }

    if (fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    fieldErrors,
    settings: null,
  };
}
