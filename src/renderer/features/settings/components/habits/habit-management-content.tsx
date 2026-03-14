import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  LayoutGroup,
} from "framer-motion";
import { useState } from "react";

import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";

import { HabitRowEditor } from "./habit-row-editor";
import { NewHabitForm } from "./new-habit-form";

export function HabitManagementContent({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-10 pb-3">
        <NewHabitForm onCreateHabit={onCreateHabit} />
      </div>

      <div className="grid gap-3">
        <LayoutGroup>
          <AnimatePresence initial={false}>
            {habits.map((habit, index) => (
              <HabitRowEditor
                key={habit.id}
                habit={habit}
                habits={habits}
                index={index}
                isExpanded={expandedHabitId === habit.id}
                onArchiveHabit={onArchiveHabit}
                onExpandedChange={(open) => {
                  setExpandedHabitId(open ? habit.id : null);
                }}
                onRenameHabit={onRenameHabit}
                onReorderHabits={onReorderHabits}
                onUpdateHabitCategory={onUpdateHabitCategory}
                onUpdateHabitFrequency={onUpdateHabitFrequency}
                onUpdateHabitWeekdays={onUpdateHabitWeekdays}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </LazyMotion>
  );
}
