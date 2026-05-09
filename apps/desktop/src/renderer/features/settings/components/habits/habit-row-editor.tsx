import { m } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { getHabitNameError } from "@/renderer/features/settings/lib/habit-name-validation";
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
import { hoverLift, microTransition } from "@/renderer/shared/lib/motion";

import { DropIndicator } from "./drop-indicator";
import { HabitDetailsForm } from "./habit-details-form";
import type { HabitRowEditorProps } from "./habit-row-editor.types";
import { HabitRowHeader } from "./habit-row-header";

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
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitRowEditorProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const [draftName, setDraftName] = useState(habit.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const lastCommittedNameRef = useRef(habit.name);
  const categoryPresentation = getHabitCategoryPresentation(
    habit.category,
    categoryPreferences
  );
  const isDragging = dragState?.draggedHabitId === habit.id;
  const showDropBefore =
    dragState?.overHabitId === habit.id && dragState.position === "before";
  const showDropAfter =
    dragState?.overHabitId === habit.id && dragState.position === "after";

  useEffect(() => {
    setDraftName(habit.name);
    setNameError(null);
    lastCommittedNameRef.current = habit.name;
  }, [habit.id, habit.name]);

  async function handleRenameCommit(nextName: string): Promise<void> {
    if (nextName === lastCommittedNameRef.current) {
      return;
    }

    const trimmedName = nextName.trim();
    const nextNameError = getHabitNameError(trimmedName);
    if (nextNameError) {
      setNameError(nextNameError);
      return;
    }

    const previousName = lastCommittedNameRef.current;

    try {
      await onRenameHabit(habit.id, nextName);
      setNameError(null);
      lastCommittedNameRef.current = nextName;
    } catch {
      setDraftName(previousName);
    }
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
            onReorderHabits={onReorderHabits}
          />

          <CollapsibleContent>
            <HabitDetailsForm
              draftName={draftName}
              habit={habit}
              nameError={nameError}
              onRenameCommit={handleRenameCommit}
              onUpdateHabitCategory={onUpdateHabitCategory}
              onUpdateHabitFrequency={onUpdateHabitFrequency}
              onUpdateHabitTargetCount={onUpdateHabitTargetCount}
              onUpdateHabitWeekdays={onUpdateHabitWeekdays}
              setDraftName={setDraftName}
              setNameError={setNameError}
            />
          </CollapsibleContent>
        </Item>
      </Collapsible>
    </m.div>
  );
}
