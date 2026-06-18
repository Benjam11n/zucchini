import { m } from "framer-motion";
import type { CSSProperties } from "react";

import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/animation/motion";
import { getHabitCategoryPresentation } from "@/renderer/shared/components/app/habit-category/lib/presentation";
import {
  HABIT_COMPLETION_POP_CLASSNAME,
  HABIT_ROW_BASE_CLASSNAME,
  HABIT_ROW_CHECKBOX_INTERACTION_CLASSNAME,
  HABIT_ROW_CONTENT_INTERACTION_CLASSNAME,
  HABIT_ROW_INTERACTIVE_CLASSNAME,
} from "@/renderer/shared/components/app/habit-management/lib/habit-row-interaction";
import { Checkbox } from "@/renderer/shared/components/ui/checkbox";
import { HabitCategoryLabel } from "@/renderer/shared/components/ui/habit-category-label";
import type { HabitListItemProps } from "@/renderer/shared/components/ui/habit-list-item-types";
import { HabitStreakLabel } from "@/renderer/shared/components/ui/habit-streak-label";
import { HabitTrailingActions } from "@/renderer/shared/components/ui/habit-trailing-actions";
import { cn } from "@/renderer/shared/lib/class-names";
import { useHabitCategoryPreferences } from "@/renderer/shared/providers/habit-category-preferences";

const HABIT_ITEM_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_INITIAL = { opacity: 0, scale: 0.98, x: -8 };

function getItemStateClassName({
  completed,
  isInteractive,
  muted,
}: {
  completed: boolean;
  isInteractive: boolean;
  muted: boolean;
}) {
  if (completed) {
    return "text-muted-foreground/50";
  }

  if (muted) {
    return "text-muted-foreground/60";
  }

  return isInteractive && HABIT_ROW_INTERACTIVE_CLASSNAME;
}

function getLabelStateClassName({
  completed,
  isInteractive,
  muted,
}: {
  completed: boolean;
  isInteractive: boolean;
  muted: boolean;
}) {
  if (completed) {
    return "line-through decoration-muted-foreground/30";
  }

  if (muted) {
    return "text-muted-foreground/70";
  }

  return isInteractive && HABIT_ROW_CONTENT_INTERACTION_CLASSNAME;
}

function HabitListItemComponent({
  disabled = false,
  habit,
  inputId = `habit-${habit.id}`,
  keyboardRowProps,
  muted = false,
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
  const stateClassNameProps = {
    completed: habit.completed,
    isInteractive,
    muted,
  };
  const itemStateClassName = getItemStateClassName(stateClassNameProps);
  const labelStateClassName = getLabelStateClassName(stateClassNameProps);

  return (
    <m.label
      animate={HABIT_ITEM_ANIMATE}
      htmlFor={isInteractive ? inputId : undefined}
      initial={HABIT_ITEM_INITIAL}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        HABIT_ROW_BASE_CLASSNAME,
        disabled && "cursor-default opacity-55",
        muted && !disabled && "cursor-default bg-muted/25",
        readOnly && "cursor-default",
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
        className={cn(
          "size-4 shrink-0 rounded-full border-2",
          HABIT_ROW_CHECKBOX_INTERACTION_CLASSNAME,
          HABIT_COMPLETION_POP_CLASSNAME,
          muted && "opacity-45 grayscale"
        )}
        disabled={disabled}
        id={inputId}
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
