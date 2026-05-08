import { m } from "framer-motion";
import type { CSSProperties } from "react";

import { Checkbox } from "@/renderer/shared/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
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
    const currentUnit = streak.currentStreak === 1 ? "day" : "days";
    const bestUnit = streak.bestStreak === 1 ? "day" : "days";
    const bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
    const progress = Math.min(
      100,
      Math.max(8, (streak.currentStreak / bestStreak) * 100)
    );
    const isBestStreak = streak.currentStreak >= bestStreak;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={`Current streak ${streak.currentStreak} ${currentUnit}. Best streak ${bestStreak} ${bestUnit}.`}
              className={cn(
                "inline-flex shrink-0 cursor-help items-center gap-1 text-xs font-medium tabular-nums",
                isBestStreak
                  ? "text-secondary"
                  : "text-primary/85 dark:text-primary"
              )}
            >
              <span>{streak.currentStreak}d</span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-1 w-5 overflow-hidden rounded-full",
                  isBestStreak ? "bg-secondary/20" : "bg-primary/15"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-current",
                    isBestStreak && "shadow-[0_0_8px_var(--secondary)]"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </span>
              <span
                className={cn(
                  "min-w-3 text-[0.68rem]",
                  isBestStreak ? "text-secondary" : "text-muted-foreground/55"
                )}
              >
                {bestStreak}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            Current streak: {streak.currentStreak} {currentUnit}. Best streak:{" "}
            {bestStreak} {bestUnit}.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
