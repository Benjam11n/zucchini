import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { CSSProperties } from "react";
import { memo } from "react";

import type { HabitStreak } from "@/renderer/features/today/today-habit-streaks";
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

interface HabitListItemProps {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  showCategory?: boolean;
  streak?: HabitStreak;
  trailingActions?: React.ReactNode;
}

const HABIT_ITEM_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_INITIAL = { opacity: 0, scale: 0.98, x: -8 };
const HABIT_ITEM_COMPLETION_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_COMPLETION_EXIT = { opacity: 0, scale: 0.7, x: 6 };
const HABIT_ITEM_COMPLETION_INITIAL = { opacity: 0, scale: 0.7, x: -6 };

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
            style={{ color: presentation.color }}
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
          {streak.currentStreak}d
        </span>
      ) : null}
      {trailingActions ? (
        <div className="z-10 flex shrink-0 items-center gap-1">
          {trailingActions}
        </div>
      ) : null}
      <AnimatePresence initial={false}>
        {habit.completed ? (
          <m.span
            animate={HABIT_ITEM_COMPLETION_ANIMATE}
            className="flex shrink-0"
            exit={HABIT_ITEM_COMPLETION_EXIT}
            initial={HABIT_ITEM_COMPLETION_INITIAL}
            transition={microTransition}
          >
            <CheckCircle2
              className="size-3.5 opacity-60"
              style={{ color: presentation.color }}
            />
          </m.span>
        ) : null}
      </AnimatePresence>
    </m.label>
  );
}

function areHabitListItemPropsEqual(
  previous: HabitListItemProps,
  next: HabitListItemProps
): boolean {
  return (
    previous.habit.id === next.habit.id &&
    previous.habit.name === next.habit.name &&
    previous.habit.category === next.habit.category &&
    previous.habit.completed === next.habit.completed &&
    previous.onToggle === next.onToggle &&
    previous.showCategory === next.showCategory &&
    previous.streak?.bestStreak === next.streak?.bestStreak &&
    previous.streak?.currentStreak === next.streak?.currentStreak &&
    previous.trailingActions === next.trailingActions
  );
}

export const HabitListItem = memo(
  HabitListItemComponent,
  areHabitListItemPropsEqual
);
