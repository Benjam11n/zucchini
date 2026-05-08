import { m } from "framer-motion";

import { getPeriodicHabitKeyboardRowId } from "@/renderer/features/today/lib/today-keyboard-row-ids";
import { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import { staggerItemVariants } from "@/renderer/shared/lib/motion";
import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";

import { FocusQuotaRow, LongerHabitListItem } from "./longer-habit-rows";

interface LongerHabitSectionData {
  completedHabitGoalCount: number;
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  habits: HabitWithStatus[];
  resetLabel: string;
  title: string;
  value: string;
}

interface LongerHabitSectionProps {
  categoryPreferences: Parameters<typeof getHabitCategoryPresentation>[1];
  getKeyboardRowProps?: (rowId: string) => KeyboardRowProps | undefined;
  onDecrementHabitProgress?: (habitId: number) => void;
  onIncrementHabitProgress?: (habitId: number) => void;
  readOnly?: boolean;
  section: LongerHabitSectionData;
}

export function LongerHabitSection({
  categoryPreferences,
  getKeyboardRowProps,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
  readOnly = false,
  section,
}: LongerHabitSectionProps) {
  return (
    <m.div className="grid gap-2.5" variants={staggerItemVariants}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-foreground">{section.title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {section.habits.length > 0 ? (
            <span className="tabular-nums">
              {section.completedHabitGoalCount}/{section.habits.length} habits
            </span>
          ) : null}
          <span>{section.resetLabel}</span>
        </div>
      </div>

      <div className="grid gap-1">
        {section.focusQuotaGoals.map((goal) => (
          <FocusQuotaRow key={`${goal.kind}-${goal.id}`} goal={goal} />
        ))}
        {section.habits.map((habit) => (
          <LongerHabitListItem
            key={habit.id}
            habit={habit}
            keyboardRowProps={
              readOnly
                ? undefined
                : getKeyboardRowProps?.(getPeriodicHabitKeyboardRowId(habit.id))
            }
            onDecrement={onDecrementHabitProgress}
            onIncrement={onIncrementHabitProgress}
            presentation={getHabitCategoryPresentation(
              habit.category,
              categoryPreferences
            )}
            readOnly={readOnly}
          />
        ))}
      </div>
    </m.div>
  );
}
