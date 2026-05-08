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
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HabitListItemStreak {
  bestStreak: number;
  currentStreak: number;
}

interface HabitListItemProps {
  disabled?: boolean;
  habit: HabitWithStatus;
  keyboardRowProps?: KeyboardRowProps | undefined;
  onToggle?: ((habitId: number) => void) | undefined;
  readOnly?: boolean;
  showCategory?: boolean | undefined;
  streak?: HabitListItemStreak;
  trailingActions?: React.ReactNode;
}

const HABIT_ITEM_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_INITIAL = { opacity: 0, scale: 0.98, x: -8 };

function HabitStreakLabel({
  streak,
}: {
  streak?: HabitListItemStreak | undefined;
}) {
  if (streak && streak.currentStreak > 0) {
    return (
      <span
        aria-label={`Current streak ${streak.currentStreak} days`}
        className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground"
        title={`Current streak: ${streak.currentStreak} days. Best: ${streak.bestStreak} days.`}
      >
        {streak.currentStreak} {streak.currentStreak === 1 ? "day" : "days"}
      </span>
    );
  }

  return null;
}

function HabitCategoryLabel({
  accentTextColor,
  label,
  showCategory,
}: {
  accentTextColor: string;
  label: string;
  showCategory?: boolean | undefined;
}) {
  if (!showCategory) {
    return null;
  }

  return (
    <span
      className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
      style={{ color: accentTextColor }}
    >
      {label}
    </span>
  );
}

function HabitTrailingActions({
  trailingActions,
}: {
  trailingActions?: React.ReactNode;
}) {
  if (!trailingActions) {
    return null;
  }

  return (
    <div className="z-10 flex shrink-0 items-center gap-1">
      {trailingActions}
    </div>
  );
}

function HabitListItemComponent({
  disabled = false,
  habit,
  keyboardRowProps,
  onToggle,
  readOnly = false,
  showCategory,
  streak,
  trailingActions,
}: HabitListItemProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const presentation = getHabitCategoryPresentation(
    habit.category,
    categoryPreferences
  );
  const hoverProps =
    habit.completed || disabled || readOnly ? {} : { whileHover: hoverLift };
  const isInteractive = !(disabled || readOnly);
  const itemStateClassName = habit.completed
    ? "text-muted-foreground/50"
    : isInteractive && "hover:bg-muted/25";
  const labelStateClassName = habit.completed
    ? "line-through decoration-muted-foreground/30"
    : isInteractive &&
      "group-hover:brightness-125 dark:group-hover:brightness-150";

  return (
    <m.label
      animate={HABIT_ITEM_ANIMATE}
      htmlFor={isInteractive ? `habit-${habit.id}` : undefined}
      initial={HABIT_ITEM_INITIAL}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled && "cursor-default opacity-55",
        readOnly && "cursor-default",
        isInteractive && "cursor-pointer",
        itemStateClassName
      )}
      transition={microTransition}
      {...hoverProps}
      {...(readOnly ? {} : keyboardRowProps)}
      whileTap={tapPress}
    >
      <Checkbox
        aria-disabled={readOnly ? true : undefined}
        checked={habit.completed}
        className="size-4 shrink-0 rounded-full border-2 transition-all duration-200 group-hover:scale-110 group-active:scale-90"
        disabled={disabled}
        id={`habit-${habit.id}`}
        onCheckedChange={() => {
          if (isInteractive) {
            onToggle?.(habit.id);
          }
        }}
        tabIndex={readOnly ? -1 : undefined}
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
            labelStateClassName
          )}
        >
          {habit.name}
        </span>
        <HabitCategoryLabel
          accentTextColor={presentation.accentTextColor}
          label={presentation.label}
          showCategory={showCategory}
        />
      </div>
      <HabitStreakLabel streak={streak} />
      <HabitTrailingActions trailingActions={trailingActions} />
    </m.label>
  );
}

export const HabitListItem = HabitListItemComponent;
