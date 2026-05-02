import { m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import type { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface LongerHabitListItemProps {
  habit: HabitWithStatus;
  onDecrement: (habitId: number) => void;
  onIncrement: (habitId: number) => void;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
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
        "group flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-2 transition-colors duration-150",
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
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          aria-label={`Increase progress for ${habit.name}`}
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
          <Plus className="size-3" />
        </Button>
        <Button
          aria-label={`Decrease progress for ${habit.name}`}
          className={cn(
            "opacity-0 transition-all duration-200 group-hover:opacity-60 hover:opacity-100!",
            completedCount > 0 && "opacity-20"
          )}
          disabled={completedCount === 0}
          onClick={() => onDecrement(habit.id)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Minus className="size-3" />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 basis-0 flex-wrap items-center gap-2 overflow-hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <presentation.icon
            className="size-3.5 shrink-0 opacity-70 transition-all group-hover:opacity-100"
            style={{ color: presentation.accentTextColor }}
          />
          <span
            className={cn(
              "truncate text-sm transition-all duration-150",
              habit.completed
                ? "text-muted-foreground/60 line-through decoration-muted-foreground/30"
                : "text-foreground/90 group-hover:text-foreground"
            )}
          >
            {habit.name}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 tabular-nums">
          <div className="relative hidden h-1 w-12 overflow-hidden rounded-full bg-muted/40 transition-colors group-hover:bg-muted/60 md:block">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                backgroundColor: presentation.color,
                width: `${Math.min((completedCount / targetCount) * 100, 100)}%`,
              }}
            />
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium transition-all duration-200",
              habit.completed
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
            style={
              !habit.completed && completedCount > 0
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
