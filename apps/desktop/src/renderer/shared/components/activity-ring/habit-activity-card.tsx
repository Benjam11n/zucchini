"use client";

import { memo, useMemo } from "react";

import { cn } from "@/renderer/shared/lib/class-names";
import { useHabitCategoryPreferences } from "@/renderer/shared/lib/habit-category-presentation";

import { buildHabitActivityData } from "./build-habit-activity-data";
import { CircleProgress } from "./circle-progress";
import { DetailedActivityInfo } from "./detailed-activity-info";
import type { ActivityData, HabitActivityRingProps } from "./types";

interface AppleActivityCardProps {
  activities: ActivityData[];
  className?: string;
  showDetails?: boolean;
}

function AppleActivityCard({
  activities,
  className,
  showDetails = true,
}: AppleActivityCardProps) {
  const containerSize = activities[0]?.size ?? 280;

  return (
    <div
      className={cn(
        "relative mx-auto w-full",
        "text-zinc-900 dark:text-white",
        className
      )}
    >
      <div className="flex items-center justify-center">
        <div
          className="relative shrink-0"
          style={{ height: containerSize, width: containerSize }}
        >
          {activities.map((activity, index) => (
            <CircleProgress
              key={activity.label}
              data={activity}
              index={index}
            />
          ))}
        </div>
        {showDetails ? <DetailedActivityInfo activities={activities} /> : null}
      </div>
    </div>
  );
}

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
      className={className}
      showDetails={showDetails}
    />
  );
}

export const HabitActivityCard = memo(HabitActivityCardComponent);
