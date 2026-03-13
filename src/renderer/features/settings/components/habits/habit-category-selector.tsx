import { m } from "framer-motion";

import {
  SETTINGS_CATEGORY_COLORS,
  SETTINGS_CATEGORY_TEXT_ON_SELECTED,
} from "@/renderer/features/settings/components/habits/habit-category-colors";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import {
  HABIT_CATEGORY_DEFINITIONS,
  HABIT_FREQUENCY_DEFINITIONS,
  HABIT_WEEKDAY_DEFINITIONS,
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

interface HabitCategorySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (category: HabitCategory) => void;
  selectedCategory: HabitCategory;
}

interface HabitFrequencySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (frequency: HabitFrequency) => void;
  selectedFrequency: HabitFrequency;
}

interface HabitWeekdaySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (selectedWeekdays: HabitWeekday[] | null) => void;
  selectedWeekdays: HabitWeekday[] | null;
}

export function HabitCategorySelector({
  className,
  compact = false,
  name,
  onChange,
  selectedCategory,
}: HabitCategorySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {HABIT_CATEGORY_DEFINITIONS.map((category) => {
        const isSelected = selectedCategory === category.value;
        const color = SETTINGS_CATEGORY_COLORS[category.value];

        return (
          <m.button
            key={category.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${category.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => onChange(normalizeHabitCategory(category.value))}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border transition-all",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              !isSelected &&
                "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
            style={
              isSelected
                ? {
                    backgroundColor: color,
                    borderColor: color,
                    color: SETTINGS_CATEGORY_TEXT_ON_SELECTED[category.value],
                  }
                : undefined
            }
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${SETTINGS_CATEGORY_TEXT_ON_SELECTED[category.value]} 55%, transparent)`
                  : color,
              }}
            />
            {category.label}
          </m.button>
        );
      })}
    </div>
  );
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
