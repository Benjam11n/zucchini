"use client";

import { motion } from "framer-motion";

import type { CircleProgressProps } from "./types";

export function CircleProgress({ data, index }: CircleProgressProps) {
  const strokeWidth = 20;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          aria-label={`${data.label} Activity Progress - ${data.value}%`}
          className="transform -rotate-90"
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          width={data.size}
        >
          <title>{`${data.label} Activity Progress - ${data.value}%`}</title>

          <circle
            className="text-zinc-200/40 dark:text-zinc-800/60"
            cx={data.size / 2}
            cy={data.size / 2}
            fill="none"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />

          <motion.circle
            animate={{ strokeDashoffset: progress }}
            cx={data.size / 2}
            cy={data.size / 2}
            fill="none"
            initial={{ strokeDashoffset: circumference }}
            r={radius}
            stroke={data.color}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            style={{
              filter: `drop-shadow(0 0 6px ${data.color}55)`,
            }}
            transition={{
              delay: index * 0.2,
              duration: 1.8,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
