"use client";

import { cn } from "@/renderer/shared/lib/class-names";

import { CircleProgress } from "./circle-progress";
import { DetailedActivityInfo } from "./detailed-activity-info";
import type { ActivityData } from "./types";

interface ActivityRingCardProps {
  activities: ActivityData[];
  className?: string;
  showDetails?: boolean;
}

export function ActivityRingCard({
  activities,
  className,
  showDetails = true,
}: ActivityRingCardProps) {
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
