import { LazyMotion, domAnimation, m } from "framer-motion";
import { CalendarRange, CheckCircle2, Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/components/ui/button";
import { HabitListCard } from "@/renderer/shared/components/ui/habit-list";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { staggerItemVariants } from "@/renderer/shared/lib/motion";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import { parseDateKey } from "@/shared/utils/date";

interface LongerHabitChecklistProps {
  dateKey: string;
  habits: HabitWithStatus[];
  onDecrementHabitProgress: (habitId: number) => void;
  onIncrementHabitProgress: (habitId: number) => void;
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

function LongerHabitListItem({
  habit,
  onDecrement,
  onIncrement,
  presentation,
}: {
  habit: HabitWithStatus;
  onDecrement: (habitId: number) => void;
  onIncrement: (habitId: number) => void;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
}) {
  const completedCount = habit.completedCount ?? 0;
  const targetCount = habit.targetCount ?? 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        habit.completed ? "bg-muted/20" : "hover:bg-muted/25"
      )}
    >
      <Button
        aria-label={`Decrease progress for ${habit.name}`}
        className="shrink-0"
        disabled={completedCount === 0}
        onClick={() => onDecrement(habit.id)}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Minus className="size-3.5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className={cn(
              "truncate text-sm",
              habit.completed && "text-muted-foreground"
            )}
          >
            {habit.name}
          </span>
          <span
            className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
            style={{ color: presentation.color }}
          >
            {presentation.label}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={
                {
                  backgroundColor: presentation.color,
                  width: `${Math.round((completedCount / targetCount) * 100)}%`,
                } as CSSProperties
              }
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {completedCount}/{targetCount}
          </span>
        </div>
      </div>

      <Button
        aria-label={`Increase progress for ${habit.name}`}
        className="shrink-0"
        disabled={completedCount >= targetCount}
        onClick={() => onIncrement(habit.id)}
        size="icon-sm"
        style={
          habit.completed
            ? ({
                backgroundColor: presentation.color,
                borderColor: presentation.color,
                color: presentation.selectedTextColor,
              } as CSSProperties)
            : undefined
        }
        type="button"
        variant={habit.completed ? "default" : "outline"}
      >
        {habit.completed ? (
          <CheckCircle2 className="size-3.5" />
        ) : (
          <Plus className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

export function LongerHabitChecklist({
  dateKey,
  habits,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
}: LongerHabitChecklistProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  let totalTargetCount = 0;
  let totalCompletedCount = 0;

  const sections = PERIOD_SECTIONS.map((section) => {
    const sectionHabits = habits.filter(
      (habit) => habit.frequency === section.value
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

    totalTargetCount += targetCount;
    totalCompletedCount += completedCount;

    return {
      ...section,
      categoryProgress: getHabitCategoryProgress(sectionHabits),
      completedCount,
      habits: sectionHabits,
      resetLabel: formatResetLabel(period.end),
      targetCount,
    };
  }).filter((section) => section.habits.length > 0);

  if (sections.length === 0) {
    return null;
  }

  const progressProps =
    totalTargetCount > 0
      ? {
          progressLabel: `${totalCompletedCount}/${totalTargetCount}`,
          progressValue: Math.round(
            (totalCompletedCount / totalTargetCount) * 100
          ),
        }
      : {};

  return (
    <LazyMotion features={domAnimation}>
      <HabitListCard
        title="Beyond Today"
        icon={CalendarRange}
        description=""
        {...progressProps}
      >
        {sections.map((section) => (
          <m.div
            key={section.value}
            className="grid gap-3"
            variants={staggerItemVariants}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border/70 bg-card/70 p-1 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)]">
                    <HabitActivityRingGlyph
                      categoryProgress={section.categoryProgress}
                      size={24}
                    />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {section.completedCount}/{section.targetCount}
                </span>
                <span>{section.resetLabel}</span>
              </div>
            </div>

            <div className="grid gap-px">
              {section.habits.map((habit) => (
                <LongerHabitListItem
                  key={habit.id}
                  habit={habit}
                  onDecrement={onDecrementHabitProgress}
                  onIncrement={onIncrementHabitProgress}
                  presentation={getHabitCategoryPresentation(
                    habit.category,
                    categoryPreferences
                  )}
                />
              ))}
            </div>
          </m.div>
        ))}
      </HabitListCard>
    </LazyMotion>
  );
}
