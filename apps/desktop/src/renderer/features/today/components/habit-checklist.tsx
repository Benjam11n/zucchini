import type { LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import {
  HabitListCard,
  HabitListItem,
} from "@/renderer/shared/components/ui/habit-list";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";
import type { HabitStreak } from "@/shared/domain/habit-streak";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
  completedCount: number;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  headerActions?: ReactNode;
  habitStreaks?: Readonly<Record<number, HabitStreak>>;
  title?: string;
  icon?: React.ElementType;
}

type CategoryGroup = (typeof HABIT_CATEGORY_SLOTS)[number] & {
  completedCount: number;
  habits: HabitWithStatus[];
};

function HabitChecklistComponent({
  habits,
  onToggleHabit,
  completedCount,
  emptyMessage = "Add habits in Settings to get started.",
  emptyAction: _emptyAction,
  headerActions,
  habitStreaks,
  title = "Today",
  icon: Icon,
}: HabitChecklistProps) {
  const totalHabits = habits.length;
  const categoryPreferences = useHabitCategoryPreferences();
  const progressProps =
    totalHabits > 0
      ? {
          progressLabel: `${completedCount}/${totalHabits}`,
          progressValue: Math.round((completedCount / totalHabits) * 100),
        }
      : {};
  const habitsByCategory = useMemo(() => {
    const groupedHabits = Object.fromEntries(
      HABIT_CATEGORY_SLOTS.map((category) => [
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

    const populatedCategories: CategoryGroup[] = [];

    for (const category of HABIT_CATEGORY_SLOTS) {
      const group = groupedHabits[category.value];
      if (group.habits.length === 0) {
        continue;
      }

      populatedCategories.push({
        ...category,
        completedCount: group.completedCount,
        habits: group.habits,
      });
    }

    return populatedCategories;
  }, [habits]);

  return (
    <HabitListCard
      title={title}
      icon={Icon as LucideIcon}
      headerActions={headerActions}
      {...progressProps}
    >
      {totalHabits === 0 ? (
        <div className="rounded-md border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {_emptyAction ? <div className="mt-4">{_emptyAction}</div> : null}
        </div>
      ) : null}

      {habitsByCategory.map((category) => {
        const presentation = getHabitCategoryPresentation(
          category.value,
          categoryPreferences
        );
        const CategoryIcon = presentation.icon;

        return (
          <div key={category.value} className="grid gap-1">
            {/* Category header */}
            <div className="flex items-center gap-2 px-0.5 pb-1">
              <CategoryIcon
                className="size-3 shrink-0 opacity-60"
                style={{ color: presentation.accentTextColor }}
              />
              <span
                className="text-[0.68rem] uppercase tracking-wide"
                style={{ color: presentation.accentTextColor }}
              >
                {presentation.label}
              </span>
              <span className="ml-auto text-[0.68rem] tabular-nums text-muted-foreground/60">
                {category.completedCount}/{category.habits.length}
              </span>
            </div>

            {/* Habit items */}
            <div className="grid gap-px">
              {category.habits.map((habit) => {
                const streak = habitStreaks?.[habit.id];
                const streakProps = streak ? { streak } : {};

                return (
                  <HabitListItem
                    key={habit.id}
                    habit={habit}
                    isStreakLoading={habitStreaks === undefined}
                    onToggle={onToggleHabit}
                    {...streakProps}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </HabitListCard>
  );
}

export const HabitChecklist = memo(HabitChecklistComponent);
