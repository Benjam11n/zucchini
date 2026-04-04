"use client";

import { memo, useMemo } from "react";

import { useHabitCategoryPreferences } from "@/renderer/shared/lib/habit-category-presentation";

import { AppleActivityCard } from "./apple-activity-card";
import { buildHabitActivityData } from "./build-habit-activity-data";
import type { HabitActivityRingProps } from "./types";

function HabitActivityCardComponent({
  categoryProgress,
  categoryPreferences,
  className,
  showDetails = true,
}: Omit<HabitActivityRingProps, "size">) {
  const contextCategoryPreferences = useHabitCategoryPreferences();
  const activities = useMemo(
    () =>
      buildHabitActivityData(
        categoryProgress,
        categoryPreferences ?? contextCategoryPreferences
      ),
    [categoryPreferences, categoryProgress, contextCategoryPreferences]
  );

  return (
    <AppleActivityCard
      activities={activities}
      showDetails={showDetails}
      {...(className ? { className } : {})}
    />
  );
}

export const HabitActivityCard = memo(HabitActivityCardComponent);
