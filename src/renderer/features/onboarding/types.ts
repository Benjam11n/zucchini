import type {
  StarterPackId,
  StarterPackHabitDraft,
} from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";

export type OnboardingStarterChoice = StarterPackId | "blank";

export interface OnboardingReminderDraft {
  reminderEnabled: boolean;
  reminderTime: string;
  timezone: string;
}

export interface EditableStarterPackHabitDraft extends StarterPackHabitDraft {
  draftId: string;
}

export interface StarterPackEditorProps {
  drafts: EditableStarterPackHabitDraft[];
  onChange: (drafts: EditableStarterPackHabitDraft[]) => void;
}

export interface StarterPackPickerProps {
  selectedChoice: OnboardingStarterChoice | null;
  onSelectChoice: (choice: OnboardingStarterChoice) => void;
  showBlankOption?: boolean;
}

export interface StarterPackSummaryOption {
  description: string;
  habitCount: number;
  id: OnboardingStarterChoice;
  label: string;
}

export interface ReminderFieldErrors {
  reminderTime?: string;
  timezone?: string;
}

export interface ResolvedOnboardingSettings {
  fieldErrors: ReminderFieldErrors;
  settings: AppSettings | null;
}
