import { AnimatePresence, LayoutGroup } from "framer-motion";

import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type { HabitDragState } from "./habit-management-content.types";
import { HabitManagementListItem } from "./habit-management-list-item";
import type { HabitManagementCardProps } from "./habit-management.types";

export interface HabitManagementListProps {
  dragState: HabitDragState;
  expandedHabitId: number | null;
  habits: HabitManagementCardProps["habits"];
  onArchiveHabit: (habitId: number, habitName: string) => Promise<void>;
  onDragStateChange: (dragState: HabitDragState) => void;
  onDrop: (
    draggedHabitId: number | null,
    targetHabitId: number,
    position: "after" | "before"
  ) => Promise<void>;
  onExpandedHabitChange: (habitId: number | null) => void;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (
    habits: HabitManagementCardProps["habits"]
  ) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null | undefined,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitTargetCount: (
    habitId: number,
    targetCount: number,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    habitName: string
  ) => Promise<void>;
}

export function HabitManagementList({
  dragState,
  expandedHabitId,
  habits,
  onArchiveHabit,
  onDragStateChange,
  onDrop,
  onExpandedHabitChange,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitManagementListProps) {
  return (
    <div className="grid gap-3">
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {habits.map((habit, index) => (
            <HabitManagementListItem
              key={habit.id}
              dragState={dragState}
              expandedHabitId={expandedHabitId}
              habit={habit}
              habits={habits}
              index={index}
              onArchiveHabit={onArchiveHabit}
              onDragStateChange={onDragStateChange}
              onDrop={onDrop}
              onExpandedHabitChange={onExpandedHabitChange}
              onRenameHabit={onRenameHabit}
              onReorderHabits={onReorderHabits}
              onUpdateHabitCategory={onUpdateHabitCategory}
              onUpdateHabitFrequency={onUpdateHabitFrequency}
              onUpdateHabitTargetCount={onUpdateHabitTargetCount}
              onUpdateHabitWeekdays={onUpdateHabitWeekdays}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
