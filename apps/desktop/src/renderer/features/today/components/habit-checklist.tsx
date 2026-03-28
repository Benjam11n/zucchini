import { LazyMotion, domAnimation, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import {
  HABIT_CATEGORY_ICONS,
  HABIT_CATEGORY_UI,
} from "@/renderer/shared/lib/habit-categories";
import { staggerItemVariants } from "@/renderer/shared/lib/motion";
import { HabitListCard, HabitListItem } from "@/renderer/shared/ui/habit-list";
import { HABIT_CATEGORY_DEFINITIONS } from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
  completedCount: number;
  emptyMessage?: string;
  headerActions?: ReactNode;
  title?: string;
  icon?: React.ElementType;
}

type CategoryGroup = (typeof HABIT_CATEGORY_DEFINITIONS)[number] & {
  completedCount: number;
  habits: HabitWithStatus[];
};

function HabitChecklistComponent({
  habits,
  onToggleHabit,
  completedCount,
  emptyMessage = "Add habits in Settings to get started.",
  headerActions,
  title = "Today",
  icon: Icon,
}: HabitChecklistProps) {
  const totalHabits = habits.length;
  const habitsByCategory = useMemo(() => {
    const groupedHabits = Object.fromEntries(
      HABIT_CATEGORY_DEFINITIONS.map((category) => [
        category.value,
        {
          completedCount: 0,
          habits: [] as HabitWithStatus[],
        },
      ])
    ) as Record<
      HabitCategory,
      Pick<CategoryGroup, "completedCount" | "habits">
    >;

    for (const habit of habits) {
      const group = groupedHabits[habit.category];
      group.habits.push(habit);

      if (habit.completed) {
        group.completedCount += 1;
      }
    }

    return HABIT_CATEGORY_DEFINITIONS.map((category) => ({
      ...category,
      completedCount: groupedHabits[category.value].completedCount,
      habits: groupedHabits[category.value].habits,
    })).filter((category) => category.habits.length > 0);
  }, [habits]);

  return (
    <LazyMotion features={domAnimation}>
      <HabitListCard
        title={title}
        icon={Icon as LucideIcon}
        progressLabel={
          totalHabits > 0 ? `${completedCount}/${totalHabits}` : undefined
        }
        headerActions={headerActions}
        progressValue={
          totalHabits > 0
            ? Math.round((completedCount / totalHabits) * 100)
            : undefined
        }
      >
        {totalHabits === 0 ? (
          <m.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-dashed border-border py-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </m.div>
        ) : null}

        {habitsByCategory.map((category) => {
          const ui = HABIT_CATEGORY_UI[category.value];
          const CategoryIcon = HABIT_CATEGORY_ICONS[category.value];

          return (
            <m.div
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
                  {category.completedCount}/{category.habits.length}
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
            </m.div>
          );
        })}
      </HabitListCard>
    </LazyMotion>
  );
}

export const HabitChecklist = memo(HabitChecklistComponent);
