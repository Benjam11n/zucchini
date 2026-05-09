import { ArrowDown, ArrowUp, Archive, GripVertical } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import { CollapsibleTrigger } from "@/renderer/shared/components/ui/collapsible";
import { ConfirmIconButton } from "@/renderer/shared/components/ui/confirm-icon-button";
import { reorderHabitList } from "@/renderer/shared/lib/reorder-habits";

import { getHabitCadenceSummary } from "./habit-cadence-summary";
import { HABIT_DRAG_DATA_TYPE } from "./habit-row-editor.types";
import type { HabitRowHeaderProps } from "./habit-row-editor.types";

export function HabitRowHeader({
  categoryPresentation,
  habit,
  habits,
  index,
  isExpanded,
  onArchiveHabit,
  onDragEnd,
  onDragStart,
  onReorderHabits,
}: HabitRowHeaderProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-2.5 sm:px-3 sm:py-3">
      <CollapsibleTrigger asChild>
        <button
          aria-label={
            isExpanded
              ? `Collapse habit details for ${habit.name}`
              : `Expand habit details for ${habit.name}`
          }
          className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-1.5 text-left outline-none transition-colors hover:bg-muted/25 focus-visible:ring-3 focus-visible:ring-ring/50"
          type="button"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">
              {habit.name}
            </p>
            <div className="flex min-w-0 shrink items-center gap-2 overflow-hidden">
              <span
                className="inline-flex max-w-32 shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium"
                style={{
                  backgroundColor: categoryPresentation.color,
                  borderColor: categoryPresentation.color,
                  color: categoryPresentation.selectedTextColor,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${categoryPresentation.selectedTextColor} 50%, transparent)`,
                  }}
                />
                <span className="min-w-0 truncate">
                  {categoryPresentation.label}
                </span>
              </span>
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {getHabitCadenceSummary(habit)}
              </span>
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-label={`Drag to reorder ${habit.name}`}
          className="cursor-grab active:cursor-grabbing"
          draggable
          onDragEnd={onDragEnd}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(HABIT_DRAG_DATA_TYPE, String(habit.id));
            onDragStart();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <GripVertical className="size-3.5" />
        </Button>
        <Button
          aria-label={`Move ${habit.name} up`}
          disabled={index === 0}
          onClick={async () => {
            await onReorderHabits(reorderHabitList(habits, habit.id, -1));
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          aria-label={`Move ${habit.name} down`}
          disabled={index === habits.length - 1}
          onClick={async () => {
            await onReorderHabits(reorderHabitList(habits, habit.id, 1));
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <ConfirmIconButton
          confirmLabel={`Confirm archive ${habit.name}`}
          icon={<Archive className="size-3.5" />}
          idleLabel={`Archive ${habit.name}`}
          onConfirm={async () => {
            await onArchiveHabit(habit.id);
          }}
          resetKey={habit.id}
          size="icon-sm"
          variant="destructive"
        />
      </div>
    </div>
  );
}
