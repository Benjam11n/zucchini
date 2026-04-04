import { m } from "framer-motion";
import { CheckCircle2, Minus, Plus, Timer } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import type { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";

function formatQuotaLabel(
  completed: number,
  target: number,
  suffix: ReactNode
): ReactNode {
  return (
    <>
      <span className="font-medium text-foreground">{completed}</span>
      <span>/</span>
      <span>{target}</span>
      <span>{suffix}</span>
    </>
  );
}

interface LongerHabitListItemProps {
  habit: HabitWithStatus;
  onDecrement: (habitId: number) => void;
  onIncrement: (habitId: number) => void;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
}

export function LongerHabitListItem({
  habit,
  onDecrement,
  onIncrement,
  presentation,
}: LongerHabitListItemProps) {
  const completedCount = habit.completedCount ?? 0;
  const targetCount = habit.targetCount ?? 1;

  return (
    <m.div
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors duration-150",
        habit.completed
          ? "bg-muted/15 text-muted-foreground/65"
          : "hover:bg-muted/25"
      )}
      initial={{ opacity: 0, scale: 0.98, x: -8 }}
      layout
      transition={microTransition}
      whileTap={tapPress}
      {...(habit.completed ? {} : { whileHover: hoverLift })}
    >
      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-label={`Increase progress for ${habit.name}`}
          disabled={completedCount >= targetCount}
          onClick={() => onIncrement(habit.id)}
          size="icon-xs"
          style={
            habit.completed
              ? ({
                  backgroundColor: presentation.color,
                  borderColor: presentation.color,
                  color: presentation.selectedTextColor,
                } as CSSProperties)
              : undefined
          }
          type="button"
          variant={habit.completed ? "default" : "outline"}
        >
          {habit.completed ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <Plus className="size-3" />
          )}
        </Button>
        <Button
          aria-label={`Decrease progress for ${habit.name}`}
          disabled={completedCount === 0}
          onClick={() => onDecrement(habit.id)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Minus className="size-3" />
        </Button>
      </div>

      <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
        <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
          <span
            className={cn(
              "truncate text-sm transition-all duration-150",
              habit.completed && "line-through decoration-muted-foreground/30"
            )}
          >
            {habit.name}
          </span>
          <span
            className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
            style={{ color: presentation.color }}
          >
            {presentation.label}
          </span>
        </div>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {habit.completed ? (
            <span style={{ color: presentation.color }}>Complete</span>
          ) : (
            <span>{targetCount - completedCount} left</span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {formatQuotaLabel(completedCount, targetCount, " done")}
        </span>
      </div>
    </m.div>
  );
}

export function FocusQuotaRow({ goal }: { goal: FocusQuotaGoalWithStatus }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm">
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <Timer className="size-3.5 shrink-0 text-primary/80" />
        <div className="truncate">Focus quota</div>
        {goal.completed ? (
          <span className="shrink-0 text-xs text-primary">Complete</span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            In progress
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
        {formatQuotaLabel(goal.completedMinutes, goal.targetMinutes, " min")}
      </span>
    </div>
  );
}
