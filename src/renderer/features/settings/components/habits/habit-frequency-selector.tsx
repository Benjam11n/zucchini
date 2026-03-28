/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { m } from "framer-motion";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import {
  HABIT_FREQUENCY_DEFINITIONS,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { HabitFrequency } from "@/shared/domain/habit";

interface HabitFrequencySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (frequency: HabitFrequency) => void;
  selectedFrequency: HabitFrequency;
}

export function HabitFrequencySelector({
  className,
  compact = false,
  name,
  onChange,
  selectedFrequency,
}: HabitFrequencySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {HABIT_FREQUENCY_DEFINITIONS.map((frequency) => {
        const isSelected = selectedFrequency === frequency.value;

        return (
          <m.button
            key={frequency.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${frequency.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => onChange(normalizeHabitFrequency(frequency.value))}
            className={cn(
              "rounded-full border transition-all",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            {frequency.label}
          </m.button>
        );
      })}
    </div>
  );
}
