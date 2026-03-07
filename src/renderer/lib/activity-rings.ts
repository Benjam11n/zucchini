import type { HabitCategoryProgress } from "../../shared/domain/habit";
import type { ActivityData } from "@/components/ui/apple-activity-ring";
import { HABIT_CATEGORY_UI } from "./habit-categories";

const ACTIVITY_RING_SIZES = [280, 220, 160] as const;
const ACTIVITY_RING_ORDER = [
  "fitness",
  "nutrition",
  "productivity",
] as const;

export function mapCategoryProgressToActivities(
  categoryProgress: HabitCategoryProgress[]
): ActivityData[] {
  return ACTIVITY_RING_ORDER.map((category, index) => {
    const progress = categoryProgress.find((item) => item.category === category);

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
