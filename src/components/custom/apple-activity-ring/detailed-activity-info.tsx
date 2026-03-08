"use client";

import { motion } from "framer-motion";

import type { ActivityData } from "./types";

interface DetailedActivityInfoProps {
  activities: ActivityData[];
}

export function DetailedActivityInfo({
  activities,
}: DetailedActivityInfoProps) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="ml-10 flex flex-col gap-5"
      initial={{ opacity: 0, x: 20 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {activities.map((activity) => (
        <motion.div key={activity.label} className="flex flex-col gap-0.5">
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
        </motion.div>
      ))}
    </motion.div>
  );
}
