import {
  cloneStarterPackHabits,
  getStarterPackDefinition,
  STARTER_PACK_DEFINITIONS,
} from "@/shared/domain/starter-pack";
import type {
  StarterPackHabitDraft,
  StarterPackId,
} from "@/shared/domain/starter-pack";

import type {
  EditableStarterPackHabitDraft,
  StarterPackSummaryOption,
} from "../starter-packs.types";

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
