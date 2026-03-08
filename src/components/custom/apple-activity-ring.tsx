"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { HabitCategoryProgress } from "@/shared/domain/habit";

interface ActivityData {
  label: string;
  value: number;
  color: string;
  /** Diameter of this ring's SVG in px */
  size: number;
  current: number;
  target: number;
  unit: string;
}

interface HabitActivityRingProps {
  categoryProgress: HabitCategoryProgress[];
  className?: string;
  showDetails?: boolean;
  size?: number;
}

const ACTIVITY_RING_SIZES = [280, 220, 160] as const;
const ACTIVITY_RING_ORDER = ["fitness", "nutrition", "productivity"] as const;

function buildHabitActivityData(
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

interface ActivityRingGlyphProps {
  activities: ActivityData[];
  className?: string;
  size?: number;
}

interface CircleProgressProps {
  data: ActivityData;
  index: number;
}

const CircleProgress = ({ data, index }: CircleProgressProps) => {
  const strokeWidth = 20;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          width={data.size}
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          className="transform -rotate-90"
          aria-label={`${data.label} Activity Progress - ${data.value}%`}
        >
          <title>{`${data.label} Activity Progress - ${data.value}%`}</title>

          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-200/40 dark:text-zinc-800/60"
          />

          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke={data.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{
              delay: index * 0.2,
              duration: 1.8,
              ease: "easeInOut",
            }}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${data.color}55)`,
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

const DetailedActivityInfo = ({
  activities,
}: {
  activities: ActivityData[];
}) => (
  <motion.div
    className="ml-10 flex flex-col gap-5"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    {activities.map((activity) => (
      <motion.div key={activity.label} className="flex flex-col gap-0.5">
        <span className="text-[0.65rem] tracking-[0.18em] uppercase text-zinc-500 dark:text-zinc-400 font-medium">
          {activity.label}
        </span>
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: activity.color }}
        >
          {activity.value}
          <span className="text-base font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">
            %
          </span>
        </span>
      </motion.div>
    ))}
  </motion.div>
);

function ActivityRingGlyph({
  activities,
  className,
  size = 56,
}: ActivityRingGlyphProps) {
  const containerSize = Math.max(
    ...activities.map((activity) => activity.size),
    1
  );
  const center = size / 2;
  const strokeWidth = Math.max(3, Math.round(size * 0.12));

  return (
    <div className={cn("relative shrink-0", className)}>
      <svg
        aria-hidden="true"
        className="-rotate-90"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        {activities.map((activity) => {
          const scaledSize = (activity.size / containerSize) * size;
          const radius = Math.max((scaledSize - strokeWidth) / 2, 1);
          const circumference = radius * 2 * Math.PI;
          const progress = ((100 - activity.value) / 100) * circumference;

          return (
            <g key={activity.label}>
              <circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-zinc-200/30 dark:text-zinc-800/70"
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
  className,
  size = 56,
}: HabitActivityRingProps) {
  return (
    <ActivityRingGlyph
      activities={buildHabitActivityData(categoryProgress)}
      className={className}
      size={size}
    />
  );
}

function AppleActivityCard({
  activities,
  className,
  showDetails = true,
}: {
  activities: ActivityData[];
  className?: string;
  showDetails?: boolean;
}) {
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

export function HabitActivityCard({
  categoryProgress,
  className,
  showDetails = true,
}: Omit<HabitActivityRingProps, "size">) {
  return (
    <AppleActivityCard
      activities={buildHabitActivityData(categoryProgress)}
      className={className}
      showDetails={showDetails}
    />
  );
}
