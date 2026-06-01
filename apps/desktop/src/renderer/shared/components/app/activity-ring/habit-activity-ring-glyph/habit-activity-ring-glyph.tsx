"use client";

import { useHabitCategoryPreferences } from "@/renderer/shared/lib/habit-category-presentation";

import { ActivityRingGlyph } from "../activity-ring-glyph";
import { buildHabitActivityData } from "../lib/build-habit-activity-data";
import type { HabitActivityRingProps } from "../lib/types";

export function HabitActivityRingGlyph({
  categoryProgress,
  categoryPreferences,
  className,
  size = 56,
}: HabitActivityRingProps) {
  const contextCategoryPreferences = useHabitCategoryPreferences();

  return (
    <ActivityRingGlyph
      activities={buildHabitActivityData(
        categoryProgress,
        categoryPreferences ?? contextCategoryPreferences
      )}
      size={size}
      {...(className ? { className } : {})}
    />
  );
}
