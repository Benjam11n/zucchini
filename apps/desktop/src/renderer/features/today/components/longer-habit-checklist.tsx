import { LazyMotion, domAnimation, m } from "framer-motion";
import { CalendarRange, CheckCircle2, Minus, Plus, Timer } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { HabitListCard } from "@/renderer/shared/components/ui/habit-list";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  staggerItemVariants,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import { parseDateKey } from "@/shared/utils/date";

interface LongerHabitChecklistProps {
  dateKey: string;
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  habits: HabitWithStatus[];
  onDecrementHabitProgress: (habitId: number) => void;
  onIncrementHabitProgress: (habitId: number) => void;
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
  return `Resets ${parseDateKey(periodEnd).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  })}`;
}

function formatQuotaLabel(
  completed: number,
  target: number,
  suffix: ReactNode
): ReactNode {
  return (
    <>
      <span className="font-medium text-foreground">{completed}</span>
      <span>/</span>
      <span>{target}</span>
      <span>{suffix}</span>
    </>
  );
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
    <m.div
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors duration-150",
        habit.completed
          ? "bg-muted/15 text-muted-foreground/65"
          : "hover:bg-muted/25"
      )}
      initial={{ opacity: 0, scale: 0.98, x: -8 }}
      layout
      transition={microTransition}
      whileTap={tapPress}
      {...(habit.completed ? {} : { whileHover: hoverLift })}
    >
      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-label={`Increase progress for ${habit.name}`}
          className="rounded-full"
          disabled={completedCount >= targetCount}
          onClick={() => onIncrement(habit.id)}
          size="icon-xs"
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
            <CheckCircle2 className="size-3" />
          ) : (
            <Plus className="size-3" />
          )}
        </Button>
        <Button
          aria-label={`Decrease progress for ${habit.name}`}
          className="rounded-full"
          disabled={completedCount === 0}
          onClick={() => onDecrement(habit.id)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Minus className="size-3" />
        </Button>
      </div>

      <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
        <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
          <span
            className={cn(
              "truncate text-sm transition-all duration-150",
              habit.completed && "line-through decoration-muted-foreground/30"
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
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {habit.completed ? (
            <span style={{ color: presentation.color }}>Complete</span>
          ) : (
            <span>{targetCount - completedCount} left</span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {formatQuotaLabel(completedCount, targetCount, " done")}
        </span>
      </div>
    </m.div>
  );
}

function FocusQuotaRow({ goal }: { goal: FocusQuotaGoalWithStatus }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm">
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <Timer className="size-3.5 shrink-0 text-primary/80" />
        <div className="truncate">Focus quota</div>
        {goal.completed ? (
          <span className="shrink-0 text-xs text-primary">Complete</span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            In progress
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
        {formatQuotaLabel(goal.completedMinutes, goal.targetMinutes, " min")}
      </span>
    </div>
  );
}

export function LongerHabitChecklist({
  dateKey,
  focusQuotaGoals,
  habits,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
}: LongerHabitChecklistProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  let trackedGoalCount = 0;
  let completedGoalCount = 0;
  let aggregateCompletionRatio = 0;

  const sections = PERIOD_SECTIONS.map((section) => {
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
      sectionCompletionRatio += (habit.completedCount ?? 0) / target;
    }
    for (const goal of sectionFocusQuotaGoals) {
      sectionCompletionRatio += goal.completedMinutes / goal.targetMinutes;
    }

    trackedGoalCount += goalCount;
    completedGoalCount +=
      completedHabitGoals +
      sectionFocusQuotaGoals.filter((goal) => goal.completed).length;
    aggregateCompletionRatio += sectionCompletionRatio;

    // oxlint-disable-next-line eslint/sort-keys
    return {
      ...section,
      completedCount,
      completedHabitGoalCount: completedHabitGoals,
      completedMinutes,
      focusQuotaGoals: sectionFocusQuotaGoals,
      habits: sectionHabits,
      goalCount,
      resetLabel: formatResetLabel(period.end),
      targetCount,
      targetMinutes,
    };
  }).filter(
    (section) => section.habits.length > 0 || section.focusQuotaGoals.length > 0
  );

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
      <HabitListCard
        title="Beyond Today"
        icon={CalendarRange}
        {...progressProps}
      >
        {sections.map((section) => (
          <m.div
            key={section.value}
            className="grid gap-2.5"
            variants={staggerItemVariants}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-foreground">
                {section.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {section.habits.length > 0 ? (
                  <span className="tabular-nums">
                    {section.completedHabitGoalCount}/{section.habits.length}{" "}
                    habits
                  </span>
                ) : null}
                <span>{section.resetLabel}</span>
              </div>
            </div>

            <div className="grid gap-1">
              {section.focusQuotaGoals.map((goal) => (
                <FocusQuotaRow key={`${goal.kind}-${goal.id}`} goal={goal} />
              ))}
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
