import { domAnimation, LazyMotion } from "framer-motion";
import { ArrowDownAZ } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";

import { HabitManagementFeedback } from "./habit-management-feedback";
import { HabitManagementList } from "./habit-management-list";
import type { HabitManagementCardProps } from "./habit-management.types";
import { NewHabitForm } from "./new-habit-form";
import { useHabitManagementController } from "./use-habit-management-controller";

export function HabitManagementContent(props: HabitManagementCardProps) {
  const { habits } = props;
  const {
    dragState,
    expandedHabitId,
    feedback,
    handleArchive,
    handleAutoSort,
    handleCreateHabit,
    handleDrop,
    handleRenameHabit,
    handleReorderHabits,
    handleUndoArchive,
    handleUndoAutoSort,
    handleUpdateHabitCategory,
    handleUpdateHabitFrequency,
    handleUpdateHabitTargetCount,
    handleUpdateHabitWeekdays,
    recentArchivedHabit,
    setDragState,
    setExpandedHabitId,
  } = useHabitManagementController(props);

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-10 pb-3">
        <NewHabitForm onCreateHabit={handleCreateHabit} />
      </div>

      <div className="grid gap-3 pb-3">
        <div className="mt-3 flex justify-end">
          <Button onClick={handleAutoSort} type="button" variant="outline">
            <ArrowDownAZ className="size-4" />
            Auto sort
          </Button>
        </div>
        <HabitManagementFeedback
          feedback={feedback}
          onUndoAutoSort={handleUndoAutoSort}
        />
      </div>

      <HabitManagementList
        dragState={dragState}
        expandedHabitId={expandedHabitId}
        habits={habits}
        onArchiveHabit={handleArchive}
        onDragStateChange={setDragState}
        onDrop={handleDrop}
        onExpandedHabitChange={setExpandedHabitId}
        onRenameHabit={handleRenameHabit}
        onReorderHabits={handleReorderHabits}
        onUndoArchive={handleUndoArchive}
        onUpdateHabitCategory={handleUpdateHabitCategory}
        onUpdateHabitFrequency={handleUpdateHabitFrequency}
        onUpdateHabitTargetCount={handleUpdateHabitTargetCount}
        onUpdateHabitWeekdays={handleUpdateHabitWeekdays}
        recentArchivedHabit={recentArchivedHabit}
      />
    </LazyMotion>
  );
}
