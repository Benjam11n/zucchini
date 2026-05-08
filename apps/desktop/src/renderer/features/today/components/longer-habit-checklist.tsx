import { LazyMotion, domAnimation } from "framer-motion";
import { CalendarRange } from "lucide-react";

import { HabitListCard } from "@/renderer/shared/components/ui/habit-list";
import { useHabitCategoryPreferences } from "@/renderer/shared/lib/habit-category-presentation";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import { formatDateKey } from "@/shared/utils/date";

import { LongerHabitSection } from "./longer-habit-section";

interface LongerHabitChecklistProps {
  dateKey: string;
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  getKeyboardRowProps?: (rowId: string) => KeyboardRowProps | undefined;
  habits: HabitWithStatus[];
  onDecrementHabitProgress?: (habitId: number) => void;
  onIncrementHabitProgress?: (habitId: number) => void;
  readOnly?: boolean;
  title?: string;
}

const PERIOD_SECTIONS: { title: string; value: HabitFrequency }[] = [
  {
    title: "This Week",
    value: "weekly",
  },
  {
    title: "This Month",
    value: "monthly",
  },
];

function formatResetLabel(periodEnd: string): string {
  return `Resets ${formatDateKey(periodEnd, {
    day: "numeric",
    month: "short",
    weekday: "short",
  })}`;
}

export function LongerHabitChecklist({
  dateKey,
  focusQuotaGoals,
  getKeyboardRowProps,
  habits,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
  readOnly = false,
  title = "Beyond Today",
}: LongerHabitChecklistProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  let trackedGoalCount = 0;
  let completedGoalCount = 0;
  let aggregateCompletionRatio = 0;

  const sections = [];

  for (const section of PERIOD_SECTIONS) {
    const sectionHabits = habits.filter(
      (habit) => habit.frequency === section.value
    );
    const sectionFocusQuotaGoals = focusQuotaGoals.filter(
      (goal) => goal.frequency === section.value
    );
    const period = getHabitPeriod(section.value, dateKey);
    const completedCount = sectionHabits.reduce(
      (total, habit) => total + (habit.completedCount ?? 0),
      0
    );
    const targetCount = sectionHabits.reduce(
      (total, habit) => total + (habit.targetCount ?? 1),
      0
    );
    const completedMinutes = sectionFocusQuotaGoals.reduce(
      (total, goal) => total + goal.completedMinutes,
      0
    );
    const targetMinutes = sectionFocusQuotaGoals.reduce(
      (total, goal) => total + goal.targetMinutes,
      0
    );

    const completedHabitGoals = sectionHabits.filter(
      (habit) => habit.completed
    ).length;
    const goalCount = sectionHabits.length + sectionFocusQuotaGoals.length;
    let sectionCompletionRatio = 0;
    for (const habit of sectionHabits) {
      const target = habit.targetCount ?? 1;
      sectionCompletionRatio += Math.min(
        (habit.completedCount ?? 0) / target,
        1
      );
    }
    for (const goal of sectionFocusQuotaGoals) {
      sectionCompletionRatio += Math.min(
        goal.completedMinutes / goal.targetMinutes,
        1
      );
    }

    trackedGoalCount += goalCount;
    completedGoalCount +=
      completedHabitGoals +
      sectionFocusQuotaGoals.filter((goal) => goal.completed).length;
    aggregateCompletionRatio += sectionCompletionRatio;

    if (sectionHabits.length === 0 && sectionFocusQuotaGoals.length === 0) {
      continue;
    }

    sections.push({
      ...section,
      completedCount,
      completedHabitGoalCount: completedHabitGoals,
      completedMinutes,
      focusQuotaGoals: sectionFocusQuotaGoals,
      goalCount,
      habits: sectionHabits,
      resetLabel: formatResetLabel(period.end),
      targetCount,
      targetMinutes,
    });
  }

  if (sections.length === 0) {
    return null;
  }

  const progressProps =
    trackedGoalCount > 0
      ? {
          progressLabel: `${completedGoalCount}/${trackedGoalCount}`,
          progressValue: Math.round(
            (aggregateCompletionRatio / trackedGoalCount) * 100
          ),
        }
      : {};

  return (
    <LazyMotion features={domAnimation}>
      <HabitListCard title={title} icon={CalendarRange} {...progressProps}>
        {sections.map((section) => (
          <LongerHabitSection
            key={section.value}
            categoryPreferences={categoryPreferences}
            getKeyboardRowProps={getKeyboardRowProps}
            onDecrementHabitProgress={onDecrementHabitProgress}
            onIncrementHabitProgress={onIncrementHabitProgress}
            readOnly={readOnly}
            section={section}
          />
        ))}
      </HabitListCard>
    </LazyMotion>
  );
}
