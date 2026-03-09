import { normalizeHabitCategory, normalizeHabitFrequency } from "./habit";
import type { HabitCategory, HabitFrequency } from "./habit";
import type { AppSettings } from "./settings";

export const STARTER_PACK_IDS = [
  "morning-routine",
  "fitness-reset",
  "focus-system",
] as const;

export type StarterPackId = (typeof STARTER_PACK_IDS)[number];

export interface StarterPackHabitDraft {
  category: HabitCategory;
  frequency: HabitFrequency;
  name: string;
}

export interface StarterPackDefinition {
  description: string;
  habits: StarterPackHabitDraft[];
  id: StarterPackId;
  label: string;
}

export interface OnboardingStatus {
  completedAt: string | null;
  isComplete: boolean;
}

export interface CompleteOnboardingInput {
  habits: StarterPackHabitDraft[];
  settings: AppSettings;
}

export const STARTER_PACK_DEFINITIONS: StarterPackDefinition[] = [
  {
    description:
      "Build a calm default morning with quick wins across planning, food, and movement.",
    habits: [
      {
        category: "productivity",
        frequency: "daily",
        name: "Make bed",
      },
      {
        category: "nutrition",
        frequency: "daily",
        name: "Drink water after waking",
      },
      {
        category: "fitness",
        frequency: "daily",
        name: "Stretch for 5 minutes",
      },
      {
        category: "productivity",
        frequency: "daily",
        name: "Plan top 3 tasks",
      },
    ],
    id: "morning-routine",
    label: "Morning routine",
  },
  {
    description:
      "Reset your baseline with walking, training, food, and sleep habits that survive busy weeks.",
    habits: [
      {
        category: "fitness",
        frequency: "daily",
        name: "20-minute walk",
      },
      {
        category: "fitness",
        frequency: "weekly",
        name: "Workout session",
      },
      {
        category: "nutrition",
        frequency: "daily",
        name: "Protein-forward meal",
      },
      {
        category: "fitness",
        frequency: "daily",
        name: "Sleep before midnight",
      },
    ],
    id: "fitness-reset",
    label: "Fitness reset",
  },
  {
    description:
      "Set up a lightweight operating system for focused work and weekly follow-through.",
    habits: [
      {
        category: "productivity",
        frequency: "daily",
        name: "No-phone first work block",
      },
      {
        category: "productivity",
        frequency: "daily",
        name: "Ship one meaningful task",
      },
      {
        category: "productivity",
        frequency: "weekly",
        name: "Inbox zero sweep",
      },
      {
        category: "productivity",
        frequency: "weekly",
        name: "Review upcoming week",
      },
    ],
    id: "focus-system",
    label: "Focus system",
  },
];

export function cloneStarterPackHabits(
  habits: readonly StarterPackHabitDraft[]
): StarterPackHabitDraft[] {
  return habits.map((habit) => ({
    category: normalizeHabitCategory(habit.category),
    frequency: normalizeHabitFrequency(habit.frequency),
    name: habit.name.trim(),
  }));
}

export function getStarterPackDefinition(
  starterPackId: StarterPackId
): StarterPackDefinition {
  const definition = STARTER_PACK_DEFINITIONS.find(
    (starterPack) => starterPack.id === starterPackId
  );

  if (!definition) {
    throw new Error(`Unknown starter pack: ${starterPackId}`);
  }

  return definition;
}
