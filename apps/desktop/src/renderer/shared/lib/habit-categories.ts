import {
  Apple,
  Brain,
  Dumbbell,
  HeartPulse,
  Utensils,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { HABIT_CATEGORY_ICON_VALUES } from "@/shared/domain/settings";
import type { HabitCategoryIcon } from "@/shared/domain/settings";

export const HABIT_CATEGORY_ICONS: Record<HabitCategoryIcon, LucideIcon> = {
  apple: Apple,
  brain: Brain,
  dumbbell: Dumbbell,
  heartPulse: HeartPulse,
  utensils: Utensils,
  zap: Zap,
};

export const HABIT_CATEGORY_ICON_OPTIONS = HABIT_CATEGORY_ICON_VALUES.map(
  (value) => ({
    icon: HABIT_CATEGORY_ICONS[value],
    label:
      value === "heartPulse"
        ? "Heart Pulse"
        : `${value.charAt(0).toUpperCase()}${value.slice(1)}`,
    value,
  })
);
