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
        "flex h-10 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        className
      )}
    >
      <Button
        aria-label={`Decrease target count for ${frequency} habit`}
        className="size-7 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
        disabled={value <= minimumTargetCount}
        onClick={() => onChange(Math.max(minimumTargetCount, value - 1))}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Minus className="size-3.5" />
      </Button>
      <div className="min-w-0 flex-1 text-center">
        <p
          className={cn(
            "font-semibold tabular-nums text-sm text-foreground",
            compact && "text-[13px]"
          )}
        >
          {value}
        </p>
      </div>
      <Button
        aria-label={`Increase target count for ${frequency} habit`}
        className="size-7 rounded-full border border-border/70 bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
        disabled={value >= maximumTargetCount}
        onClick={() => onChange(Math.min(maximumTargetCount, value + 1))}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
