import { motion } from "framer-motion";
import { CalendarRange } from "lucide-react";

import { staggerItemVariants } from "@/renderer/lib/motion";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod, parseDateKey } from "@/shared/domain/habit-period";

import { HabitListCard, HabitListItem } from "./ui/habit-list";

interface LongerHabitChecklistProps {
  dateKey: string;
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
}

const PERIOD_SECTIONS: {
  description: string;
  title: string;
  value: HabitFrequency;
}[] = [
  {
    description: "Complete any time before the week closes.",
    title: "This Week",
    value: "weekly",
  },
  {
    description: "Complete any time before the month closes.",
    title: "This Month",
    value: "monthly",
  },
];

function formatResetLabel(periodEnd: string): string {
  return `Resets ${parseDateKey(periodEnd).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  })}`;
}

export function LongerHabitChecklist({
  dateKey,
  habits,
  onToggleHabit,
}: LongerHabitChecklistProps) {
  let totalHabitsCount = 0;
  let totalCompletedCount = 0;

  const sections = PERIOD_SECTIONS.map((section) => {
    const sectionHabits = habits.filter(
      (habit) => habit.frequency === section.value
    );
    const period = getHabitPeriod(section.value, dateKey);

    totalHabitsCount += sectionHabits.length;
    totalCompletedCount += sectionHabits.filter((h) => h.completed).length;

    return {
      ...section,
      habits: sectionHabits,
      resetLabel: formatResetLabel(period.end),
    };
  }).filter((section) => section.habits.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <HabitListCard
      title="Longer Cycles"
      icon={CalendarRange}
      description="Weekly and monthly habits stay out of the rings and daily streak."
      progressLabel={
        totalHabitsCount > 0
          ? `${totalCompletedCount}/${totalHabitsCount}`
          : undefined
      }
      progressValue={
        totalHabitsCount > 0
          ? Math.round((totalCompletedCount / totalHabitsCount) * 100)
          : undefined
      }
    >
      {sections.map((section) => {
        const completedCount = section.habits.filter(
          (habit) => habit.completed
        ).length;

        return (
          <motion.div
            key={section.value}
            className="grid gap-3"
            variants={staggerItemVariants}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {completedCount}/{section.habits.length}
                </span>
                <span>{section.resetLabel}</span>
              </div>
            </div>

            <div className="grid gap-px">
              {section.habits.map((habit) => (
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggleHabit}
                  showCategory={true}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </HabitListCard>
  );
}
