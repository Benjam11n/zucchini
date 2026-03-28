import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import type { HabitCategory } from "@/shared/domain/habit";

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
