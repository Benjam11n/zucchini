import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, CheckCircle2 } from "lucide-react";
import type { CSSProperties } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import {
  hoverLift,
  microTransition,
  staggerItemVariants,
  tapPress,
} from "@/renderer/lib/motion";
import type { HabitFrequency, HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod, parseDateKey } from "@/shared/domain/habit-period";

interface PeriodHabitBoardProps {
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

export function PeriodHabitBoard({
  dateKey,
  habits,
  onToggleHabit,
}: PeriodHabitBoardProps) {
  const sections = PERIOD_SECTIONS.map((section) => {
    const sectionHabits = habits.filter(
      (habit) => habit.frequency === section.value
    );
    const period = getHabitPeriod(section.value, dateKey);

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
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 text-primary" />
          <CardTitle className="text-base font-medium">Longer Cycles</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Weekly and monthly habits stay out of the rings and daily streak.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-1">
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
                {section.habits.map((habit) => {
                  const ui = HABIT_CATEGORY_UI[habit.category];

                  return (
                    <motion.label
                      key={habit.id}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 px-3 py-3 transition-colors duration-150",
                        habit.completed
                          ? "bg-muted/20 text-muted-foreground/60"
                          : "hover:bg-muted/25"
                      )}
                      htmlFor={`period-habit-${habit.id}`}
                      initial={{ opacity: 0, scale: 0.98, x: -8 }}
                      transition={microTransition}
                      whileHover={habit.completed ? undefined : hoverLift}
                      whileTap={tapPress}
                    >
                      <Checkbox
                        checked={habit.completed}
                        className="size-4 shrink-0 rounded-full border-2 transition-all duration-200"
                        id={`period-habit-${habit.id}`}
                        onCheckedChange={() => onToggleHabit(habit.id)}
                        style={
                          {
                            backgroundColor: habit.completed
                              ? ui.ringColor
                              : undefined,
                            borderColor: ui.ringColor,
                            color: habit.completed ? "#fff" : undefined,
                          } as CSSProperties
                        }
                      />
                      <div className="grid flex-1 gap-1">
                        <span
                          className={cn(
                            "text-sm",
                            habit.completed &&
                              "line-through decoration-muted-foreground/30"
                          )}
                        >
                          {habit.name}
                        </span>
                        <span
                          className="text-[0.68rem] tracking-[0.14em] uppercase"
                          style={{ color: ui.ringColor }}
                        >
                          {habit.category}
                        </span>
                      </div>
                      <AnimatePresence initial={false}>
                        {habit.completed ? (
                          <motion.span
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            className="flex shrink-0"
                            exit={{ opacity: 0, scale: 0.7, x: 6 }}
                            initial={{ opacity: 0, scale: 0.7, x: -6 }}
                            transition={microTransition}
                          >
                            <CheckCircle2
                              className="size-3.5 opacity-60"
                              style={{ color: ui.ringColor }}
                            />
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </motion.label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
