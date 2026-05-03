import { m } from "framer-motion";
import type { CSSProperties } from "react";

import { Checkbox } from "@/renderer/shared/components/ui/checkbox";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HabitListItemStreak {
  bestStreak: number;
  currentStreak: number;
}

interface HabitListItemProps {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  showCategory?: boolean;
  streak?: HabitListItemStreak;
  trailingActions?: React.ReactNode;
}

const HABIT_ITEM_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_INITIAL = { opacity: 0, scale: 0.98, x: -8 };
function HabitListItemComponent({
  habit,
  onToggle,
  showCategory,
  streak,
  trailingActions,
}: HabitListItemProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const presentation = getHabitCategoryPresentation(
    habit.category,
    categoryPreferences
  );
  const hoverProps = habit.completed ? {} : { whileHover: hoverLift };

  return (
    <m.label
      animate={HABIT_ITEM_ANIMATE}
      htmlFor={`habit-${habit.id}`}
      initial={HABIT_ITEM_INITIAL}
      layout
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        habit.completed ? "text-muted-foreground/50" : "hover:bg-muted/25"
      )}
      transition={microTransition}
      {...hoverProps}
      whileTap={tapPress}
    >
      <Checkbox
        checked={habit.completed}
        className="size-4 shrink-0 rounded-full border-2 transition-all duration-200 group-hover:scale-110 group-active:scale-90"
        id={`habit-${habit.id}`}
        onCheckedChange={() => onToggle(habit.id)}
        style={
          {
            backgroundColor: habit.completed ? presentation.color : undefined,
            borderColor: presentation.color,
            color: habit.completed ? "#fff" : undefined,
          } as CSSProperties
        }
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "min-w-0 break-words text-sm leading-snug transition-all duration-150",
            habit.completed
              ? "line-through decoration-muted-foreground/30"
              : "group-hover:brightness-125 dark:group-hover:brightness-150"
          )}
        >
          {habit.name}
        </span>
        {showCategory && (
          <span
            className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
            style={{ color: presentation.accentTextColor }}
          >
            {presentation.label}
          </span>
        )}
      </div>
      {streak && streak.currentStreak > 0 ? (
        <span
          aria-label={`Current streak ${streak.currentStreak} days`}
          className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground"
          title={`Current streak: ${streak.currentStreak} days. Best: ${streak.bestStreak} days.`}
        >
          {streak.currentStreak} {streak.currentStreak === 1 ? "day" : "days"}
        </span>
      ) : null}
      {trailingActions ? (
        <div className="z-10 flex shrink-0 items-center gap-1">
          {trailingActions}
        </div>
      ) : null}
    </m.label>
  );
}

export const HabitListItem = HabitListItemComponent;
