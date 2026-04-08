import type { HabitManagementListProps } from "./habit-management-list";
import { HabitRowEditor } from "./habit-row-editor";

const HABIT_DRAG_DATA_TYPE = "text/plain";

function getDropPosition(bounds: DOMRect, clientY: number): "after" | "before" {
  const midpoint = bounds.top + bounds.height / 2;
  return clientY < midpoint ? "before" : "after";
}

interface HabitManagementListItemProps {
  dragState: HabitManagementListProps["dragState"];
  expandedHabitId: number | null;
  habit: HabitManagementListProps["habits"][number] | null;
  sectionHabits: HabitManagementListProps["habits"];
  index: number;
  onArchiveHabit: HabitManagementListProps["onArchiveHabit"];
  onDragStateChange: HabitManagementListProps["onDragStateChange"];
  onDrop: HabitManagementListProps["onDrop"];
  onExpandedHabitChange: HabitManagementListProps["onExpandedHabitChange"];
  onRenameHabit: HabitManagementListProps["onRenameHabit"];
  onReorderHabits: HabitManagementListProps["onReorderHabits"];
  onUndoArchive: HabitManagementListProps["onUndoArchive"];
  onUpdateHabitCategory: HabitManagementListProps["onUpdateHabitCategory"];
  onUpdateHabitFrequency: HabitManagementListProps["onUpdateHabitFrequency"];
  onUpdateHabitTargetCount: HabitManagementListProps["onUpdateHabitTargetCount"];
  onUpdateHabitWeekdays: HabitManagementListProps["onUpdateHabitWeekdays"];
  recentArchivedHabit: HabitManagementListProps["recentArchivedHabit"];
}

export function HabitManagementListItem({
  dragState,
  expandedHabitId,
  habit,
  sectionHabits,
  index,
  onArchiveHabit,
  onDragStateChange,
  onDrop,
  onExpandedHabitChange,
  onRenameHabit,
  onReorderHabits,
  onUndoArchive,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
  recentArchivedHabit,
}: HabitManagementListItemProps) {
  if (recentArchivedHabit) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/6 px-4 py-3 text-sm">
        <div className="min-w-0">
          <p className="truncate text-foreground">
            Archived {recentArchivedHabit.habitName}
          </p>
          <p className="text-xs text-muted-foreground">
            Undo is available for a few seconds.
          </p>
        </div>
        <button
          className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          onClick={async () => {
            await onUndoArchive();
          }}
          type="button"
        >
          Undo
        </button>
      </div>
    );
  }

  if (!habit) {
    return null;
  }

  return (
    <HabitRowEditor
      dragState={dragState}
      habit={habit}
      habits={sectionHabits}
      index={index}
      isExpanded={expandedHabitId === habit.id}
      onArchiveHabit={(habitId) =>
        onArchiveHabit(habitId, habit.name, habit.frequency, index)
      }
      onDragEnd={() => {
        onDragStateChange(null);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!dragState) {
          return;
        }

        const draggedHabit = sectionHabits.find(
          (candidate) => candidate.id === dragState.draggedHabitId
        );

        if (!draggedHabit || draggedHabit.frequency !== habit.frequency) {
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
      onDrop={async (event) => {
        event.preventDefault();
        const draggedHabitId = Number.parseInt(
          event.dataTransfer.getData(HABIT_DRAG_DATA_TYPE),
          10
        );
        const resolvedDraggedHabitId = Number.isNaN(draggedHabitId)
          ? null
          : draggedHabitId;
        const draggedHabit = sectionHabits.find(
          (candidate) => candidate.id === resolvedDraggedHabitId
        );

        if (!draggedHabit || draggedHabit.frequency !== habit.frequency) {
          onDragStateChange(null);
          return;
        }

        await onDrop(
          resolvedDraggedHabitId,
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
        onUpdateHabitFrequency(
          habitId,
          frequency,
          habit.targetCount ?? 1,
          habit.name
        )
      }
      onUpdateHabitTargetCount={(habitId, targetCount) =>
        onUpdateHabitTargetCount(habitId, targetCount, habit.name)
      }
      onUpdateHabitWeekdays={(habitId, selectedWeekdays) =>
        onUpdateHabitWeekdays(habitId, selectedWeekdays, habit.name)
      }
    />
  );
}
