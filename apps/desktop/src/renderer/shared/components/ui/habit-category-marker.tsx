import type { ComponentProps } from "react";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { HabitCategory } from "@/shared/domain/habit";

import { Badge } from "./badge";

type HabitCategoryMarkerVariant = "badge" | "dot";

interface HabitCategoryMarkerProps extends Omit<
  ComponentProps<"span">,
  "children"
> {
  category: HabitCategory;
  variant: HabitCategoryMarkerVariant;
}

export function HabitCategoryMarker({
  category,
  className,
  variant,
  ...props
}: HabitCategoryMarkerProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const presentation = getHabitCategoryPresentation(
    category,
    categoryPreferences
  );
  const CategoryIcon = presentation.icon;
  const label = `${presentation.label} category`;

  if (variant === "dot") {
    return (
      <span
        aria-label={label}
        className={cn("inline-flex shrink-0 items-center gap-2", className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: presentation.color }}
        />
        <span className="sr-only">{presentation.label}</span>
      </span>
    );
  }

  return (
    <Badge
      aria-label={label}
      className={cn("gap-1.5 border font-medium", className)}
      style={presentation.badgeStyle}
      variant="outline"
      {...props}
    >
      <CategoryIcon className="size-3" />
      {presentation.label}
    </Badge>
  );
}
