import { CalendarPlus } from "lucide-react";

import { getCarryoverKeyboardRowId } from "@/renderer/features/today/lib/today-keyboard-row-ids";
import { Checkbox } from "@/renderer/shared/components/ui/checkbox";
import { HabitListCard } from "@/renderer/shared/components/ui/habit-list";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
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

  if (carryovers.length === 0) {
    return null;
  }

  return (
    <HabitListCard
      description="Moved from yesterday."
      icon={CalendarPlus}
      progressLabel={`${completedCount}/${carryovers.length}`}
      progressValue={Math.round((completedCount / carryovers.length) * 100)}
      title="Carried over"
    >
      <div className="grid gap-px">
        {carryovers.map((carryover) => {
          const presentation = getHabitCategoryPresentation(
            carryover.category,
            categoryPreferences
          );
          const CarryoverIcon = presentation.icon;
          const keyboardRowId = getCarryoverKeyboardRowId(
            carryover.sourceDate,
            carryover.id
          );

          return (
            <label
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
                "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                carryover.completed
                  ? "text-muted-foreground/50"
                  : "hover:bg-muted/25"
              )}
              htmlFor={`carryover-${carryover.sourceDate}-${carryover.id}`}
              key={`${carryover.sourceDate}-${carryover.id}`}
              {...getKeyboardRowProps?.(keyboardRowId)}
            >
              <Checkbox
                checked={carryover.completed}
                className="size-4 shrink-0 rounded-full border-2"
                id={`carryover-${carryover.sourceDate}-${carryover.id}`}
                onCheckedChange={() =>
                  onToggleCarryover(carryover.sourceDate, carryover.id)
                }
                style={{
                  backgroundColor: carryover.completed
                    ? presentation.color
                    : undefined,
                  borderColor: presentation.color,
                  color: carryover.completed ? "#fff" : undefined,
                }}
              />
              <CarryoverIcon
                className="size-3.5 shrink-0 opacity-70"
                style={{ color: presentation.accentTextColor }}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm transition-all duration-150",
                  carryover.completed &&
                    "line-through decoration-muted-foreground/30"
                )}
              >
                {carryover.name}
              </span>
              <span className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80">
                {presentation.label}
              </span>
            </label>
          );
        })}
      </div>
    </HabitListCard>
  );
}
