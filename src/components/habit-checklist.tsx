import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Dumbbell, Utensils, Zap } from "lucide-react";
import type { CSSProperties } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import {
  hoverLift,
  microTransition,
  staggerItemVariants,
  tapPress,
} from "@/renderer/lib/motion";
import { HABIT_CATEGORY_DEFINITIONS } from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";

const CATEGORY_ICONS: Record<HabitCategory, React.ElementType> = {
  fitness: Dumbbell,
  nutrition: Utensils,
  productivity: Zap,
};

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
  completedCount: number;
}

export function HabitChecklist({
  habits,
  onToggleHabit,
  completedCount,
}: HabitChecklistProps) {
  const totalHabits = habits.length;
  const habitsByCategory = HABIT_CATEGORY_DEFINITIONS.map((category) => ({
    ...category,
    habits: habits.filter((habit) => habit.category === category.value),
  })).filter((category) => category.habits.length > 0);

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Today</CardTitle>
          {totalHabits > 0 && (
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={completedCount}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground tabular-nums"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                transition={microTransition}
              >
                {completedCount}/{totalHabits}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
        {totalHabits > 0 && (
          <Progress
            className="h-1"
            value={Math.round((completedCount / totalHabits) * 100)}
          />
        )}
      </CardHeader>

      <CardContent className="grid gap-6 pt-1">
        {totalHabits === 0 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-dashed border-border py-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            transition={microTransition}
          >
            <p className="text-sm text-muted-foreground">
              Add habits in Settings to get started.
            </p>
          </motion.div>
        ) : null}

        {habitsByCategory.map((category) => {
          const ui = HABIT_CATEGORY_UI[category.value];
          const categoryCompleted = category.habits.filter(
            (habit) => habit.completed
          ).length;
          const CategoryIcon = CATEGORY_ICONS[category.value];

          return (
            <motion.div
              key={category.value}
              className="grid gap-1"
              layout
              variants={staggerItemVariants}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 px-0.5 pb-1">
                <CategoryIcon
                  className="size-3 shrink-0 opacity-60"
                  style={{ color: ui.ringColor }}
                />
                <span
                  className="text-[0.68rem] tracking-[0.14em] uppercase"
                  style={{ color: ui.ringColor }}
                >
                  {category.label}
                </span>
                <span className="ml-auto text-[0.68rem] tabular-nums text-muted-foreground/60">
                  {categoryCompleted}/{category.habits.length}
                </span>
              </div>

              {/* Habit items */}
              <div className="grid gap-px">
                {category.habits.map((habit) => (
                  <motion.label
                    key={habit.id}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    htmlFor={`habit-${habit.id}`}
                    initial={{ opacity: 0, scale: 0.98, x: -8 }}
                    layout
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
                      habit.completed
                        ? "text-muted-foreground/50"
                        : "hover:bg-muted/25"
                    )}
                    transition={microTransition}
                    whileHover={habit.completed ? undefined : hoverLift}
                    whileTap={tapPress}
                  >
                    <Checkbox
                      checked={habit.completed}
                      className="size-4 shrink-0 rounded-full border-2 transition-all duration-200"
                      id={`habit-${habit.id}`}
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
                    <span
                      className={cn(
                        "flex-1 text-sm transition-all duration-150",
                        habit.completed &&
                          "line-through decoration-muted-foreground/30"
                      )}
                    >
                      {habit.name}
                    </span>
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
                ))}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
