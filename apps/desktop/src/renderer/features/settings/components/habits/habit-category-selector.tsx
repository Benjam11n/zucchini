import { m } from "framer-motion";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import {
  HABIT_CATEGORY_DEFINITIONS,
  normalizeHabitCategory,
} from "@/shared/domain/habit";
import type { HabitCategory } from "@/shared/domain/habit";

interface HabitCategorySelectorProps {
  className?: string;
  compact?: boolean;
  name: string;
  onChange: (category: HabitCategory) => void;
  selectedCategory: HabitCategory;
}

export function HabitCategorySelector({
  className,
  compact = false,
  name,
  onChange,
  selectedCategory,
}: HabitCategorySelectorProps) {
  const categoryPreferences = useHabitCategoryPreferences();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {HABIT_CATEGORY_DEFINITIONS.map((category) => {
        const isSelected = selectedCategory === category.value;
        const presentation = getHabitCategoryPresentation(
          category.value,
          categoryPreferences
        );
        const CategoryIcon = presentation.icon;

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
            {...(isSelected
              ? {
                  style: {
                    backgroundColor: presentation.color,
                    borderColor: presentation.color,
                    color: presentation.selectedTextColor,
                  },
                }
              : {})}
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            <CategoryIcon className="size-3 shrink-0 opacity-80" />
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${presentation.selectedTextColor} 55%, transparent)`
                  : presentation.color,
              }}
            />
            {presentation.label}
          </m.button>
        );
      })}
    </div>
  );
}
