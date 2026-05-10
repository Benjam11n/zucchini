import { m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import type { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import {
  HABIT_ROW_BASE_CLASSNAME,
  HABIT_ROW_CONTENT_INTERACTION_CLASSNAME,
  HABIT_ROW_INTERACTIVE_CLASSNAME,
} from "@/renderer/shared/lib/habit-row-interaction";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface LongerHabitListItemProps {
  habit: HabitWithStatus;
  keyboardRowProps?: KeyboardRowProps | undefined;
  onDecrement?: ((habitId: number) => void) | undefined;
  onIncrement?: ((habitId: number) => void) | undefined;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
  readOnly?: boolean;
}

function formatQuotaLabel(completed: number, target: number): React.ReactNode {
  return (
    <span className="flex items-center gap-1 font-medium transition-colors">
      <span>{completed}</span>
      <span className="opacity-40">/</span>
      <span className="opacity-70">{target}</span>
    </span>
  );
}

function LongerHabitControls({
  completedCount,
  habit,
  isComplete,
  onDecrement,
  onIncrement,
  presentation,
}: {
  completedCount: number;
  habit: HabitWithStatus;
  isComplete: boolean;
  onDecrement?: ((habitId: number) => void) | undefined;
  onIncrement?: ((habitId: number) => void) | undefined;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
}) {
  const completedButtonStyle = isComplete
    ? ({
        backgroundColor: presentation.color,
        borderColor: presentation.color,
        color: presentation.selectedTextColor,
      } as CSSProperties)
    : undefined;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        aria-label={`Increase progress for ${habit.name}`}
        className={cn(isComplete && "habit-completion-pop")}
        onClick={() => onIncrement?.(habit.id)}
        size="icon-xs"
        style={completedButtonStyle}
        type="button"
        variant={isComplete ? "default" : "outline"}
      >
        <Plus className="size-3" />
      </Button>
      <Button
        aria-label={`Decrease progress for ${habit.name}`}
        className={cn(
          "opacity-0 transition-all duration-200 group-hover:opacity-60 hover:opacity-100!",
          completedCount > 0 && "opacity-20"
        )}
        disabled={completedCount === 0}
        onClick={() => onDecrement?.(habit.id)}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Minus className="size-3" />
      </Button>
    </div>
  );
}

export function LongerHabitListItem({
  habit,
  keyboardRowProps,
  onDecrement,
  onIncrement,
  presentation,
  readOnly = false,
}: LongerHabitListItemProps) {
  const completedCount = habit.completedCount ?? 0;
  const targetCount = habit.targetCount ?? 1;
  const isComplete = habit.completed;
  const isInteractive = !(isComplete || readOnly);

  return (
    <m.div
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={cn(
        "flex flex-wrap items-center gap-2 px-2.5 py-2",
        HABIT_ROW_BASE_CLASSNAME,
        readOnly && "cursor-default",
        isComplete
          ? "bg-muted/15 text-muted-foreground/65"
          : isInteractive && HABIT_ROW_INTERACTIVE_CLASSNAME
      )}
      initial={{ opacity: 0, scale: 0.98, x: -8 }}
      layout
      transition={microTransition}
      {...(readOnly ? {} : keyboardRowProps)}
      whileTap={tapPress}
      {...(isInteractive ? { whileHover: hoverLift } : {})}
    >
      {readOnly ? null : (
        <LongerHabitControls
          completedCount={completedCount}
          habit={habit}
          isComplete={isComplete}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          presentation={presentation}
        />
      )}

      <div className="flex min-w-0 flex-1 basis-0 flex-wrap items-center gap-2 overflow-hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <presentation.icon
            className={cn(
              "size-3.5 shrink-0 opacity-70 group-hover:opacity-100",
              isInteractive && HABIT_ROW_CONTENT_INTERACTION_CLASSNAME
            )}
            style={{ color: presentation.accentTextColor }}
          />
          <span
            className={cn(
              "truncate text-sm transition-all duration-150",
              isComplete
                ? "text-muted-foreground/60 line-through decoration-muted-foreground/30"
                : [
                    "text-foreground/90 group-hover:text-foreground",
                    isInteractive && HABIT_ROW_CONTENT_INTERACTION_CLASSNAME,
                  ]
            )}
          >
            {habit.name}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 tabular-nums">
          <div className="relative hidden h-1 w-12 overflow-hidden rounded-full bg-muted/40 transition-colors group-hover:bg-muted/60 md:block">
            <div
              className="habit-progress-fill absolute inset-y-0 left-0 transition-all duration-500"
              key={completedCount}
              style={{
                backgroundColor: presentation.color,
                width: `${Math.min((completedCount / targetCount) * 100, 100)}%`,
              }}
            />
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium transition-all duration-200",
              isComplete
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
            style={
              !isComplete && completedCount > 0
                ? {
                    backgroundColor: `${presentation.color}15`,
                    color: presentation.accentTextColor,
                  }
                : undefined
            }
          >
            {formatQuotaLabel(completedCount, targetCount)}
          </span>
        </div>
      </div>
    </m.div>
  );
}
