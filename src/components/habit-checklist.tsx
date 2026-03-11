import { Dumbbell, Utensils, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import { HABIT_CATEGORY_DEFINITIONS } from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";

import { HabitListCard, HabitListItem } from "./ui/habit-list";

const CATEGORY_ICONS: Record<HabitCategory, React.ElementType> = {
  fitness: Dumbbell,
  nutrition: Utensils,
  productivity: Zap,
};

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
  completedCount: number;
  emptyMessage?: string;
  title?: string;
  icon?: React.ElementType;
}

export function HabitChecklist({
  habits,
  onToggleHabit,
  completedCount,
  emptyMessage = "Add habits in Settings to get started.",
  title = "Today",
  icon: Icon,
}: HabitChecklistProps) {
  const totalHabits = habits.length;
  const habitsByCategory = HABIT_CATEGORY_DEFINITIONS.map((category) => ({
    ...category,
    habits: habits.filter((habit) => habit.category === category.value),
  })).filter((category) => category.habits.length > 0);

  return (
    <HabitListCard
      title={title}
      icon={Icon as LucideIcon}
      progressLabel={
        totalHabits > 0 ? `${completedCount}/${totalHabits}` : undefined
      }
      progressValue={
        totalHabits > 0
          ? Math.round((completedCount / totalHabits) * 100)
          : undefined
      }
    >
      {totalHabits === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : null}

      {habitsByCategory.map((category) => {
        const ui = HABIT_CATEGORY_UI[category.value];
        const categoryCompleted = category.habits.filter(
          (habit) => habit.completed
        ).length;
        const CategoryIcon = CATEGORY_ICONS[category.value];

        return (
          <div key={category.value} className="grid gap-1">
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
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggleHabit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </HabitListCard>
  );
}
