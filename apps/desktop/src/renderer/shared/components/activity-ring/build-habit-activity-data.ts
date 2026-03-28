import {
  getHabitCategoryColor,
  getHabitCategoryLabel,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { HabitCategoryProgress } from "@/shared/domain/habit";
import type { HabitCategoryPreferences } from "@/shared/domain/settings";

import { ACTIVITY_RING_ORDER, ACTIVITY_RING_SIZES } from "./constants";
import type { ActivityData } from "./types";

export function buildHabitActivityData(
  categoryProgress: HabitCategoryProgress[],
  categoryPreferences: HabitCategoryPreferences
): ActivityData[] {
  const progressByCategory = new Map(
    categoryProgress.map((progress) => [progress.category, progress])
  );

  return ACTIVITY_RING_ORDER.map((category, index) => {
    const progress = progressByCategory.get(category);

    return {
      color: getHabitCategoryColor(category, categoryPreferences),
      current: progress?.completed ?? 0,
      label: getHabitCategoryLabel(category, categoryPreferences).toUpperCase(),
      size: ACTIVITY_RING_SIZES[index],
      target: progress?.total ?? 0,
      unit: "Habits",
      value: progress?.progress ?? 0,
    };
  });
}
