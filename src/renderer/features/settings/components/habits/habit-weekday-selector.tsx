import { m } from "framer-motion";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import {
  HABIT_WEEKDAY_DEFINITIONS,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { HabitWeekday } from "@/shared/domain/habit";

interface HabitWeekdaySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (selectedWeekdays: HabitWeekday[] | null) => void;
  selectedWeekdays: HabitWeekday[] | null;
}

export function HabitWeekdaySelector({
  className,
  compact = false,
  name,
  onChange,
  selectedWeekdays,
}: HabitWeekdaySelectorProps) {
  const effectiveSelectedWeekdays =
    selectedWeekdays ??
    HABIT_WEEKDAY_DEFINITIONS.map((definition) => definition.value);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {HABIT_WEEKDAY_DEFINITIONS.map((weekday) => {
        const isSelected = effectiveSelectedWeekdays.includes(weekday.value);

        return (
          <m.button
            key={weekday.value}
            animate={{ opacity: 1, scale: 1 }}
            aria-pressed={isSelected}
            id={`${name}-${weekday.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => {
              if (isSelected && effectiveSelectedWeekdays.length === 1) {
                return;
              }

              const nextSelectedWeekdays = isSelected
                ? effectiveSelectedWeekdays.filter(
                    (value) => value !== weekday.value
                  )
                : [...effectiveSelectedWeekdays, weekday.value];

              onChange(normalizeHabitWeekdays(nextSelectedWeekdays));
            }}
            className={cn(
              "rounded-full border transition-all",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
            title={weekday.longLabel}
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            {weekday.label}
          </m.button>
        );
      })}
    </div>
  );
}
