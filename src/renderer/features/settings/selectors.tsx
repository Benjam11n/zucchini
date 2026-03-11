import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  SETTINGS_CATEGORY_COLORS,
  SETTINGS_CATEGORY_TEXT_ON_SELECTED,
} from "@/renderer/features/settings/constants";
import { hoverLift, microTransition, tapPress } from "@/renderer/lib/motion";
import {
  HABIT_CATEGORY_DEFINITIONS,
  HABIT_FREQUENCY_DEFINITIONS,
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";

interface HabitCategorySelectorProps {
  name: string;
  onChange: (category: HabitCategory) => void;
  selectedCategory: HabitCategory;
}

interface HabitFrequencySelectorProps {
  name: string;
  onChange: (frequency: HabitFrequency) => void;
  selectedFrequency: HabitFrequency;
}

export function HabitCategorySelector({
  name,
  onChange,
  selectedCategory,
}: HabitCategorySelectorProps) {
  return (
    <div className="flex gap-2">
      {HABIT_CATEGORY_DEFINITIONS.map((category) => {
        const isSelected = selectedCategory === category.value;
        const color = SETTINGS_CATEGORY_COLORS[category.value];

        return (
          <motion.button
            key={category.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${category.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => onChange(normalizeHabitCategory(category.value))}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all",
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
          </motion.button>
        );
      })}
    </div>
  );
}

export function HabitFrequencySelector({
  name,
  onChange,
  selectedFrequency,
}: HabitFrequencySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {HABIT_FREQUENCY_DEFINITIONS.map((frequency) => {
        const isSelected = selectedFrequency === frequency.value;

        return (
          <motion.button
            key={frequency.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${frequency.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => onChange(normalizeHabitFrequency(frequency.value))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-all",
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
          </motion.button>
        );
      })}
    </div>
  );
}
