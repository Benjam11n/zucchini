import { AnimatePresence, LayoutGroup } from "framer-motion";

import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type { HabitDragState } from "./habit-management-content.types";
import type { HabitManagementCardProps } from "./habit-management.types";
import { HabitRowEditor } from "./habit-row-editor";

const HABIT_DRAG_DATA_TYPE = "text/plain";

function getDropPosition(bounds: DOMRect, clientY: number): "after" | "before" {
  const midpoint = bounds.top + bounds.height / 2;
  return clientY < midpoint ? "before" : "after";
}

interface HabitManagementListProps {
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
  onUpdateHabitWeekdays,
}: HabitManagementListProps) {
  return (
    <div className="grid gap-3">
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {habits.map((habit, index) => (
            <HabitRowEditor
              key={habit.id}
              dragState={dragState}
              habit={habit}
              habits={habits}
              index={index}
              isExpanded={expandedHabitId === habit.id}
              onArchiveHabit={(habitId) => onArchiveHabit(habitId, habit.name)}
              onDragEnd={() => {
                onDragStateChange(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!dragState) {
                  return;
                }

                onDragStateChange({
                  ...dragState,
                  overHabitId: habit.id,
                  position: getDropPosition(
                    event.currentTarget.getBoundingClientRect(),
                    event.clientY
                  ),
                });
              }}
              onDragStart={() => {
                onDragStateChange({
                  draggedHabitId: habit.id,
                  overHabitId: habit.id,
                  position: "before",
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                const draggedHabitId = Number.parseInt(
                  event.dataTransfer.getData(HABIT_DRAG_DATA_TYPE),
                  10
                );

                void onDrop(
                  Number.isNaN(draggedHabitId) ? null : draggedHabitId,
                  habit.id,
                  getDropPosition(
                    event.currentTarget.getBoundingClientRect(),
                    event.clientY
                  )
                );
              }}
              onExpandedChange={(open) => {
                onExpandedHabitChange(open ? habit.id : null);
              }}
              onRenameHabit={onRenameHabit}
              onReorderHabits={onReorderHabits}
              onUpdateHabitCategory={(habitId, category) =>
                onUpdateHabitCategory(habitId, category, habit.name)
              }
              onUpdateHabitFrequency={(habitId, frequency) =>
                onUpdateHabitFrequency(habitId, frequency, habit.name)
              }
              onUpdateHabitWeekdays={(habitId, selectedWeekdays) =>
                onUpdateHabitWeekdays(habitId, selectedWeekdays, habit.name)
              }
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
