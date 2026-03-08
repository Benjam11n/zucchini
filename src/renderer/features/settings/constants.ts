import { Monitor, MoonStar, SunMedium } from "lucide-react";
import type { ElementType } from "react";

import { RING_COLORS } from "@/renderer/lib/ring-colors";
import type { HabitCategory } from "@/shared/domain/habit";
import type { ThemeMode } from "@/shared/domain/settings";

export const THEME_OPTIONS: {
  icon: ElementType;
  label: string;
  value: ThemeMode;
}[] = [
  {
    icon: SunMedium,
    label: "Light",
    value: "light",
  },
  {
    icon: MoonStar,
    label: "Dark",
    value: "dark",
  },
  {
    icon: Monitor,
    label: "System",
    value: "system",
  },
];

export const SETTINGS_CATEGORY_COLORS: Record<HabitCategory, string> = {
  fitness: RING_COLORS.fitness.base,
  nutrition: RING_COLORS.nutrition.base,
  productivity: RING_COLORS.productivity.base,
};

export const SETTINGS_CATEGORY_TEXT_ON_SELECTED: Record<HabitCategory, string> =
  {
    fitness: "#fff",
    nutrition: "#1a2e00",
    productivity: "#fff",
  };
