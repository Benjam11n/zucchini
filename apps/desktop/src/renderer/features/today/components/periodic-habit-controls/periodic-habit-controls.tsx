import { Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import type { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface PeriodicHabitControlsProps {
  completedCount: number;
  habit: HabitWithStatus;
  isComplete: boolean;
  onDecrement?: ((habitId: number) => void) | undefined;
  onIncrement?: ((habitId: number) => void) | undefined;
  presentation: ReturnType<typeof getHabitCategoryPresentation>;
}

export function PeriodicHabitControls({
  completedCount,
  habit,
  isComplete,
  onDecrement,
  onIncrement,
  presentation,
}: PeriodicHabitControlsProps) {
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
