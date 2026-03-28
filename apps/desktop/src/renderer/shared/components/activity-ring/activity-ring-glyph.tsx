"use client";

import { cn } from "@/renderer/shared/lib/class-names";
import { useHabitCategoryPreferences } from "@/renderer/shared/lib/habit-category-presentation";
import type { HabitCategoryProgress } from "@/shared/domain/habit";

import { buildHabitActivityData } from "./build-habit-activity-data";
import type { ActivityRingGlyphProps, HabitActivityRingProps } from "./types";

function ActivityRingGlyph({
  activities,
  className,
  size = 56,
}: ActivityRingGlyphProps) {
  const center = size / 2;
  const strokeWidth = Math.max(3, Math.round(size * 0.12));
  const ringGap = Math.max(1, Math.round(size * 0.035));
  const outerRadius = Math.max((size - strokeWidth) / 2, 1);

  return (
    <div className={cn("relative shrink-0", className)}>
      <svg
        aria-hidden="true"
        className="-rotate-90"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        {activities.map((activity, index) => {
          const radius = Math.max(
            outerRadius - index * (strokeWidth + ringGap),
            1
          );
          const circumference = radius * 2 * Math.PI;
          const progress = ((100 - activity.value) / 100) * circumference;

          return (
            <g key={activity.label}>
              <circle
                className="text-zinc-200/60 dark:text-zinc-800/70"
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke={activity.color}
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
                strokeWidth={strokeWidth}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
      className={className}
      size={size}
    />
  );
}

export type { HabitCategoryProgress };
