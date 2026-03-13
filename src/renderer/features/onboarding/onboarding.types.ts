import type { AppSettings } from "@/shared/domain/settings";

export type OnboardingStep = "edit" | "pick" | "reminders";

export interface OnboardingReminderDraft {
  reminderEnabled: boolean;
  reminderTime: string;
  timezone: string;
}

export interface ReminderFieldErrors {
  reminderTime?: string;
  timezone?: string;
}

export interface ResolvedOnboardingSettings {
  fieldErrors: ReminderFieldErrors;
  settings: AppSettings | null;
}
