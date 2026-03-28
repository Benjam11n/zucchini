import { Dumbbell, Utensils, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { HabitCategory } from "@/shared/domain/habit";

export const HABIT_CATEGORY_ICONS: Record<HabitCategory, LucideIcon> = {
  fitness: Dumbbell,
  nutrition: Utensils,
  productivity: Zap,
};
