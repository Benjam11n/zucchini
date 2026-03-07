import { CheckCircle2, Dumbbell, Utensils, Zap } from "lucide-react";
import type { CSSProperties } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { HABIT_CATEGORY_DEFINITIONS } from "../../shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "../../shared/domain/habit";
import { HABIT_CATEGORY_UI } from "../lib/habit-categories";

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
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedCount}/{totalHabits}
            </span>
          )}
        </div>
        {totalHabits > 0 && (
          <div className="h-px overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-primary/60 transition-[width] duration-500"
              style={{
                width: `${Math.round((completedCount / totalHabits) * 100)}%`,
              }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-6 pt-1">
        {totalHabits === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Add habits in Settings to get started.
            </p>
          </div>
        ) : null}

        {habitsByCategory.map((category) => {
          const ui = HABIT_CATEGORY_UI[category.value];
          const categoryCompleted = category.habits.filter(
            (habit) => habit.completed
          ).length;
          const CategoryIcon = CATEGORY_ICONS[category.value];

          return (
            <div className="grid gap-1" key={category.value}>
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
                  <label
                    key={habit.id}
                    htmlFor={`habit-${habit.id}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
                      habit.completed
                        ? "text-muted-foreground/50"
                        : "hover:bg-muted/25"
                    )}
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
                    {habit.completed && (
                      <CheckCircle2
                        className="size-3.5 shrink-0 opacity-60"
                        style={{ color: ui.ringColor }}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
