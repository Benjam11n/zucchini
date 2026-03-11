"use client";

import type { ActivityData } from "./types";

interface DetailedActivityInfoProps {
  activities: ActivityData[];
}

export function DetailedActivityInfo({
  activities,
}: DetailedActivityInfoProps) {
  return (
    <div className="ml-10 flex animate-in flex-col gap-5 fade-in-0 slide-in-from-right-2 duration-300">
      {activities.map((activity) => (
        <div key={activity.label} className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] uppercase text-zinc-500 dark:text-zinc-400">
            {activity.label}
          </span>
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: activity.color }}
          >
            {activity.value}
            <span className="ml-0.5 text-base font-normal text-zinc-500 dark:text-zinc-400">
              %
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
