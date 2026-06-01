import { CalendarPlus } from "lucide-react";
import { useMemo } from "react";

import { getCarryoverKeyboardRowId } from "@/renderer/features/today/lib/today-keyboard-row-ids";
import {
  HabitListCard,
  HabitListItem,
  HabitListRows,
} from "@/renderer/shared/components/ui/habit-list";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import type { HabitCategory } from "@/shared/domain/habit";
import type { HabitCarryover } from "@/shared/domain/habit-carryover";

interface CarryoverChecklistProps {
  carryovers: HabitCarryover[];
  getKeyboardRowProps?: (rowId: string) => KeyboardRowProps | undefined;
  onToggleCarryover: (sourceDate: string, habitId: number) => void;
}

export function CarryoverChecklist({
  carryovers,
  getKeyboardRowProps,
  onToggleCarryover,
}: CarryoverChecklistProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const completedCount = carryovers.filter(
    (carryover) => carryover.completed
  ).length;
  const carryoversByCategory = useMemo(() => {
    const groupedCarryovers = Object.fromEntries(
      HABIT_CATEGORY_SLOTS.map((category) => [
        category.value,
        {
          carryovers: [] as HabitCarryover[],
          completedCount: 0,
        },
      ])
    ) as Record<
      HabitCategory,
      {
        carryovers: HabitCarryover[];
        completedCount: number;
      }
    >;

    for (const carryover of carryovers) {
      const group = groupedCarryovers[carryover.category];
      group.carryovers.push(carryover);

      if (carryover.completed) {
        group.completedCount += 1;
      }
    }

    return HABIT_CATEGORY_SLOTS.flatMap((category) => {
      const group = groupedCarryovers[category.value];

      return group.carryovers.length > 0
        ? [
            {
              ...category,
              ...group,
            },
          ]
        : [];
    });
  }, [carryovers]);

  if (carryovers.length === 0) {
    return null;
  }

  return (
    <HabitListCard
      description="Due today from yesterday."
      icon={CalendarPlus}
      progressLabel={`${completedCount}/${carryovers.length}`}
      progressValue={Math.round((completedCount / carryovers.length) * 100)}
      title="Carried over"
    >
      {carryoversByCategory.map((category) => {
        const presentation = getHabitCategoryPresentation(
          category.value,
          categoryPreferences
        );
        const CategoryIcon = presentation.icon;

        return (
          <div key={category.value} className="grid gap-1">
            <div className="flex items-center gap-2 px-0.5 pb-1">
              <CategoryIcon
                className="size-3 shrink-0 opacity-60"
                style={{ color: presentation.accentTextColor }}
              />
              <span
                className="text-[0.68rem] uppercase tracking-wide"
                style={{ color: presentation.accentTextColor }}
              >
                {presentation.label}
              </span>
              <span className="ml-auto text-[0.68rem] tabular-nums text-muted-foreground/60">
                {category.completedCount}/{category.carryovers.length}
              </span>
            </div>
            <HabitListRows>
              {category.carryovers.map((carryover) => {
                const keyboardRowId = getCarryoverKeyboardRowId(
                  carryover.sourceDate,
                  carryover.id
                );

                return (
                  <HabitListItem
                    habit={carryover}
                    inputId={`carryover-${carryover.sourceDate}-${carryover.id}`}
                    key={`${carryover.sourceDate}-${carryover.id}`}
                    keyboardRowProps={getKeyboardRowProps?.(keyboardRowId)}
                    onToggle={() =>
                      onToggleCarryover(carryover.sourceDate, carryover.id)
                    }
                  />
                );
              })}
            </HabitListRows>
          </div>
        );
      })}
    </HabitListCard>
  );
}
