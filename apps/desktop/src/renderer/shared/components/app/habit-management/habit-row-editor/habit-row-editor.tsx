import { m } from "framer-motion";
import type { DragEvent } from "react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
} from "@/renderer/shared/components/ui/collapsible";
import { Item } from "@/renderer/shared/components/ui/item";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { getHabitNameError } from "@/renderer/shared/lib/habit-name-validation";
import { hoverLift, microTransition } from "@/renderer/shared/lib/motion";
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";
import type { Habit } from "@/shared/domain/habit";

import { DropIndicator } from "../drop-indicator/drop-indicator";
import { HabitDetailsForm } from "../habit-details-form/habit-details-form";
import { HabitRowHeader } from "../habit-row-header/habit-row-header";

type HabitRowDragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;

interface HabitRowEditorProps {
  dragState: HabitRowDragState;
  habit: Habit;
  habits: Habit[];
  index: number;
  isExpanded: boolean;
  onArchiveHabit: HabitManagementActions["archiveHabit"];
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onExpandedChange: (open: boolean) => void;
  onPauseHabit: NonNullable<HabitManagementActions["pauseHabit"]>;
  onRenameHabit: HabitManagementActions["renameHabit"];
  onReorderHabits: HabitManagementActions["reorderHabits"];
  onResumeHabit: NonNullable<HabitManagementActions["resumeHabit"]>;
  onUpdateHabitCategory: HabitManagementActions["updateHabitCategory"];
  onUpdateHabitFrequency: HabitManagementActions["updateHabitFrequency"];
  onUpdateHabitTargetCount: HabitManagementActions["updateHabitTargetCount"];
  onUpdateHabitWeekdays: HabitManagementActions["updateHabitWeekdays"];
}

export function HabitRowEditor({
  habit,
  habits,
  index,
  isExpanded,
  dragState,
  onArchiveHabit,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onExpandedChange,
  onPauseHabit,
  onRenameHabit,
  onReorderHabits,
  onResumeHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitRowEditorProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const [draftState, setDraftState] = useState(() => ({
    draftName: habit.name,
    habitId: habit.id,
    nameError: null as string | null,
  }));
  const categoryPresentation = getHabitCategoryPresentation(
    habit.category,
    categoryPreferences
  );
  const isDragging = dragState?.draggedHabitId === habit.id;
  const showDropBefore =
    dragState?.overHabitId === habit.id && dragState.position === "before";
  const showDropAfter =
    dragState?.overHabitId === habit.id && dragState.position === "after";

  if (draftState.habitId !== habit.id) {
    setDraftState({
      draftName: habit.name,
      habitId: habit.id,
      nameError: null,
    });
  }

  async function handleRenameCommit(nextName: string): Promise<void> {
    if (nextName === habit.name) {
      return;
    }

    const trimmedName = nextName.trim();
    const nextNameError = getHabitNameError(trimmedName);
    if (nextNameError) {
      setDraftState((current) => ({
        ...current,
        nameError: nextNameError,
      }));
      return;
    }

    await onRenameHabit(habit.id, nextName);
    setDraftState((current) => ({
      ...current,
      nameError: null,
    }));
  }

  return (
    <m.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        "relative rounded-xl transition-opacity",
        isDragging && "opacity-55"
      )}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      layout
      onDragOver={onDragOver}
      onDrop={onDrop}
      transition={microTransition}
      whileHover={hoverLift}
    >
      <DropIndicator position="before" show={showDropBefore} />
      <DropIndicator position="after" show={showDropAfter} />
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <Item
          className="flex-col items-stretch gap-0 overflow-hidden rounded-xl border-border/70 bg-muted/20 p-0"
          variant="outline"
        >
          <HabitRowHeader
            categoryPresentation={categoryPresentation}
            habit={habit}
            habits={habits}
            index={index}
            isExpanded={isExpanded}
            onArchiveHabit={onArchiveHabit}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            onPauseHabit={onPauseHabit}
            onReorderHabits={onReorderHabits}
            onResumeHabit={onResumeHabit}
          />

          <CollapsibleContent>
            <HabitDetailsForm
              draftName={draftState.draftName}
              habit={habit}
              nameError={draftState.nameError}
              onRenameCommit={handleRenameCommit}
              onUpdateHabitCategory={onUpdateHabitCategory}
              onUpdateHabitFrequency={onUpdateHabitFrequency}
              onUpdateHabitTargetCount={onUpdateHabitTargetCount}
              onUpdateHabitWeekdays={onUpdateHabitWeekdays}
              setDraftName={(draftName) =>
                setDraftState((current) => ({ ...current, draftName }))
              }
              setNameError={(nameError) =>
                setDraftState((current) => ({ ...current, nameError }))
              }
            />
          </CollapsibleContent>
        </Item>
      </Collapsible>
    </m.div>
  );
}
