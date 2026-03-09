import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import {
  cloneStarterPackHabits,
  getStarterPackDefinition,
  STARTER_PACK_DEFINITIONS,
} from "@/shared/domain/onboarding";
import type {
  StarterPackHabitDraft,
  StarterPackId,
} from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";

import type {
  EditableStarterPackHabitDraft,
  OnboardingReminderDraft,
  ReminderFieldErrors,
  ResolvedOnboardingSettings,
  StarterPackSummaryOption,
} from "./types";

let nextStarterPackDraftId = 0;

export function createStarterPackDrafts(
  starterPackId: StarterPackId
): EditableStarterPackHabitDraft[] {
  return cloneStarterPackHabits(
    getStarterPackDefinition(starterPackId).habits
  ).map((habit) => {
    const draftId = `starter-pack-draft-${nextStarterPackDraftId}`;
    nextStarterPackDraftId += 1;

    return {
      ...habit,
      draftId,
    };
  });
}

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

export function updateStarterPackHabitDraft(
  drafts: readonly EditableStarterPackHabitDraft[],
  index: number,
  nextDraft: EditableStarterPackHabitDraft
): EditableStarterPackHabitDraft[] {
  return drafts.map((draft, draftIndex) =>
    draftIndex === index ? { ...nextDraft } : draft
  );
}

export function removeStarterPackHabitDraft(
  drafts: readonly EditableStarterPackHabitDraft[],
  index: number
): EditableStarterPackHabitDraft[] {
  return drafts.filter((_, draftIndex) => draftIndex !== index);
}

export function hasStarterPackHabits(
  drafts: readonly Pick<StarterPackHabitDraft, "name">[]
): boolean {
  return drafts.some((draft) => draft.name.trim().length > 0);
}

export function toStarterPackHabits(
  drafts: readonly EditableStarterPackHabitDraft[]
): StarterPackHabitDraft[] {
  return drafts.map(({ category, frequency, name }) => ({
    category,
    frequency,
    name,
  }));
}

export function getStarterPackSummaryOptions(
  showBlankOption = false
): StarterPackSummaryOption[] {
  const options: StarterPackSummaryOption[] = STARTER_PACK_DEFINITIONS.map(
    (starterPack) => ({
      description: starterPack.description,
      habitCount: starterPack.habits.length,
      id: starterPack.id,
      label: starterPack.label,
    })
  );

  if (!showBlankOption) {
    return options;
  }

  return [
    ...options,
    {
      description:
        "Start with an empty dashboard and build your system manually later.",
      habitCount: 0,
      id: "blank",
      label: "Start blank",
    },
  ];
}
