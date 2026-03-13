import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  LayoutGroup,
} from "framer-motion";

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
  return (
    <LazyMotion features={domAnimation}>
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {habits.map((habit, index) => (
            <HabitRowEditor
              key={habit.id}
              habit={habit}
              habits={habits}
              index={index}
              onArchiveHabit={onArchiveHabit}
              onRenameHabit={onRenameHabit}
              onReorderHabits={onReorderHabits}
              onUpdateHabitCategory={onUpdateHabitCategory}
              onUpdateHabitFrequency={onUpdateHabitFrequency}
              onUpdateHabitWeekdays={onUpdateHabitWeekdays}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>

      <NewHabitForm onCreateHabit={onCreateHabit} />
    </LazyMotion>
  );
}
