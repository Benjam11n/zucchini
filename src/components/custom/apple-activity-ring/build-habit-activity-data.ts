import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { HabitCategoryProgress } from "@/shared/domain/habit";

import { ACTIVITY_RING_ORDER, ACTIVITY_RING_SIZES } from "./constants";
import type { ActivityData } from "./types";

export function buildHabitActivityData(
  categoryProgress: HabitCategoryProgress[]
): ActivityData[] {
  return ACTIVITY_RING_ORDER.map((category, index) => {
    const progress = categoryProgress.find(
      (item) => item.category === category
    );

    return {
      color: HABIT_CATEGORY_UI[category].ringColor,
      current: progress?.completed ?? 0,
      label: category.toUpperCase(),
      size: ACTIVITY_RING_SIZES[index],
      target: progress?.total ?? 0,
      unit: "HABITS",
      value: progress?.progress ?? 0,
    };
  });
}
