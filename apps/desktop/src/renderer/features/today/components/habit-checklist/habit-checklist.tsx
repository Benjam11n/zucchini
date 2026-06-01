import { Flame, Pause, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import { getDailyHabitKeyboardRowId } from "@/renderer/features/today/lib/today-keyboard-row-ids";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  HabitListEmptyState,
  HabitListCard,
  HabitListItem,
  HabitListRows,
} from "@/renderer/shared/components/ui/habit-list";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { CategoryStreak } from "@/shared/domain/category-streak";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HabitStreak } from "@/shared/domain/habit-streak";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  pausedHabits?: Habit[];
  onToggleHabit?: (habitId: number) => void;
  onResumeHabit?: (habitId: number) => Promise<void>;
  completedCount: number;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  headerActions?: ReactNode;
  habitStreaks?: Readonly<Record<number, HabitStreak>>;
  categoryStreaks?: Readonly<Partial<Record<HabitCategory, CategoryStreak>>>;
  isPaused?: boolean;
  getKeyboardRowProps?: (rowId: string) => KeyboardRowProps | undefined;
  readOnly?: boolean;
  title?: string;
  icon?: React.ElementType;
}

type CategoryGroup = (typeof HABIT_CATEGORY_SLOTS)[number] & {
  completedCount: number;
  habits: HabitWithStatus[];
};

export const HabitChecklist = memo(function HabitChecklist({
  habits,
  pausedHabits = [],
  onToggleHabit,
  onResumeHabit,
  completedCount,
  emptyMessage = "Add habits in Settings to get started.",
  emptyAction: _emptyAction,
  headerActions,
  habitStreaks,
  categoryStreaks,
  isPaused = false,
  getKeyboardRowProps,
  readOnly = false,
  title = "Today",
  icon: Icon,
}: HabitChecklistProps) {
  const totalHabits = habits.length;
  const totalPausedHabits = pausedHabits.length;
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
      {totalHabits === 0 && totalPausedHabits === 0 ? (
        <HabitListEmptyState action={_emptyAction}>
          {emptyMessage}
        </HabitListEmptyState>
      ) : null}

      {habitsByCategory.map((category) => {
        const presentation = getHabitCategoryPresentation(
          category.value,
          categoryPreferences
        );
        const CategoryIcon = presentation.icon;
        const categoryStreak = categoryStreaks?.[category.value];

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
              {categoryStreak && categoryStreak.currentStreak > 0 ? (
                <span
                  className="inline-flex h-4 items-center gap-1 rounded-sm px-1 text-[0.65rem] tabular-nums"
                  style={{
                    backgroundColor: `${presentation.color}18`,
                    color: presentation.accentTextColor,
                  }}
                  title={`${presentation.label} streak`}
                >
                  <Flame className="size-2.5" />
                  {categoryStreak.currentStreak}d
                </span>
              ) : null}
              <span className="ml-auto text-[0.68rem] tabular-nums text-muted-foreground/60">
                {category.completedCount}/{category.habits.length}
              </span>
            </div>

            {/* Habit items */}
            <HabitListRows>
              {category.habits.map((habit) => {
                const streak = habitStreaks?.[habit.id];
                const streakProps = streak ? { streak } : {};

                return (
                  <HabitListItem
                    disabled={isPaused}
                    key={habit.id}
                    habit={habit}
                    keyboardRowProps={
                      readOnly
                        ? undefined
                        : getKeyboardRowProps?.(
                            getDailyHabitKeyboardRowId(habit.id)
                          )
                    }
                    onToggle={onToggleHabit}
                    readOnly={readOnly}
                    {...streakProps}
                  />
                );
              })}
            </HabitListRows>
          </div>
        );
      })}

      {totalPausedHabits > 0 ? (
        <div className="grid gap-1">
          <div className="flex items-center gap-2 px-0.5 pb-1">
            <Pause className="size-3 shrink-0 text-muted-foreground/70" />
            <span className="text-[0.68rem] uppercase tracking-wide text-muted-foreground">
              Paused
            </span>
            <span
              className="hidden text-[0.68rem] text-muted-foreground/70 sm:inline"
              title="Paused habits do not count as missed and do not affect streaks."
            >
              Do not count as missed
            </span>
            <span className="ml-auto text-[0.68rem] tabular-nums text-muted-foreground/60">
              {totalPausedHabits}
            </span>
          </div>

          <HabitListRows>
            {pausedHabits.map((habit) => (
              <HabitListItem
                habit={
                  {
                    ...habit,
                    completed: false,
                    completedCount: 0,
                  } satisfies HabitWithStatus
                }
                key={habit.id}
                muted
                readOnly
                trailingActions={
                  <Button
                    className="border-primary/30 bg-primary/10 text-primary opacity-100 hover:bg-primary/15 hover:text-primary"
                    disabled={!onResumeHabit}
                    onClick={async () => {
                      await onResumeHabit?.(habit.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Play className="size-3.5" />
                    Resume
                  </Button>
                }
              />
            ))}
          </HabitListRows>
        </div>
      ) : null}
    </HabitListCard>
  );
});
