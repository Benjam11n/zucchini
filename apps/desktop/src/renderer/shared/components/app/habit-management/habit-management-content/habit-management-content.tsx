import { domAnimation, LazyMotion } from "framer-motion";
import { ArrowDownAZ } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";
import type { Habit } from "@/shared/domain/habit";

import { HabitManagementFeedback } from "../habit-management-feedback";
import { HabitManagementList } from "../habit-management-list";
import { NewHabitForm } from "../new-habit-form";
import { useHabitManagementController } from "../use-habit-management-controller";

export interface HabitManagementContentProps {
  actions: HabitManagementActions;
  habits: Habit[];
}

export function HabitManagementContent(props: HabitManagementContentProps) {
  const { habits } = props;
  const {
    dragState,
    expandedHabitId,
    feedback,
    handleArchive,
    handleAutoSort,
    handleCreateHabit,
    handleDrop,
    handlePauseHabit,
    handleRenameHabit,
    handleReorderHabits,
    handleResumeHabit,
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
      <div className="pb-3">
        <NewHabitForm actions={{ createHabit: handleCreateHabit }} />
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
        onPauseHabit={handlePauseHabit}
        onRenameHabit={handleRenameHabit}
        onReorderHabits={handleReorderHabits}
        onResumeHabit={handleResumeHabit}
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
