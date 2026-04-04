import { Minus, Plus } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HabitFrequency } from "@/shared/domain/habit";

interface HabitTargetCountStepperProps {
  className?: string;
  compact?: boolean;
  frequency: Exclude<HabitFrequency, "daily">;
  onChange: (targetCount: number) => void;
  value: number;
}

function getMaximumTargetCount(frequency: Exclude<HabitFrequency, "daily">) {
  return frequency === "weekly" ? 7 : 31;
}

export function HabitTargetCountStepper({
  className,
  compact = false,
  frequency,
  onChange,
  value,
}: HabitTargetCountStepperProps) {
  const maximumTargetCount = getMaximumTargetCount(frequency);
  const minimumTargetCount = 1;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2",
        className
      )}
    >
      <Button
        aria-label={`Decrease target count for ${frequency} habit`}
        disabled={value <= minimumTargetCount}
        onClick={() => onChange(Math.max(minimumTargetCount, value - 1))}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Minus className="size-3.5" />
      </Button>
      <div className="min-w-0 flex-1 text-center">
        <p className={cn("font-semibold tabular-nums", compact && "text-sm")}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">
          times per {frequency === "weekly" ? "week" : "month"}
        </p>
      </div>
      <Button
        aria-label={`Increase target count for ${frequency} habit`}
        disabled={value >= maximumTargetCount}
        onClick={() => onChange(Math.min(maximumTargetCount, value + 1))}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
