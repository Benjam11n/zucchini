import { m } from "framer-motion";
import { ArrowDown, ArrowUp, Archive, GripVertical } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { reorderHabitList } from "@/renderer/features/settings/lib/reorder-habits";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/renderer/shared/components/ui/collapsible";
import { Input } from "@/renderer/shared/components/ui/input";
import { Item } from "@/renderer/shared/components/ui/item";
import { Label } from "@/renderer/shared/components/ui/label";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { hoverLift, microTransition } from "@/renderer/shared/lib/motion";
import { HABIT_WEEKDAY_DEFINITIONS } from "@/shared/domain/habit";
import type { Habit, HabitWeekday } from "@/shared/domain/habit";

import { HabitCategorySelector } from "./habit-category-selector";
import { HabitFrequencySelector } from "./habit-frequency-selector";
import type { HabitManagementCardProps } from "./habit-management.types";
import { HabitTargetCountStepper } from "./habit-target-count-stepper";
import { HabitWeekdaySelector } from "./habit-weekday-selector";

const HABIT_DRAG_DATA_TYPE = "text/plain";

type DragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;

interface HabitRowEditorProps extends Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
  | "onUpdateHabitTargetCount"
  | "onUpdateHabitWeekdays"
> {
  habit: Habit;
  habits: Habit[];
  index: number;
  isExpanded: boolean;
  dragState: DragState;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onExpandedChange: (open: boolean) => void;
}

const WEEKDAY_LABELS = Object.fromEntries(
  HABIT_WEEKDAY_DEFINITIONS.map(({ label, value }) => [value, label])
) as Record<HabitWeekday, string>;

const WEEKDAYS: HabitWeekday[] = HABIT_WEEKDAY_DEFINITIONS.map(
  ({ value }) => value
);

function getCadenceSummary(habit: Habit): string {
  if (habit.frequency === "weekly") {
    return `${habit.targetCount ?? 1}x / week`;
  }

  if (habit.frequency === "monthly") {
    return `${habit.targetCount ?? 1}x / month`;
  }

  const weekdays = habit.selectedWeekdays ?? WEEKDAYS;

  if (weekdays.length === WEEKDAYS.length) {
    return "Daily";
  }

  if (weekdays.join(",") === "1,2,3,4,5") {
    return "Weekdays";
  }

  if (weekdays.join(",") === "0,6") {
    return "Weekends";
  }

  return weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(" ");
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
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitRowEditorProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const [draftName, setDraftName] = useState(habit.name);
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
    lastCommittedNameRef.current = habit.name;
  }, [habit.id, habit.name]);

  async function handleRenameCommit(nextName: string): Promise<void> {
    if (nextName === lastCommittedNameRef.current) {
      return;
    }

    const previousName = lastCommittedNameRef.current;

    try {
      await onRenameHabit(habit.id, nextName);
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
      <div
        className={cn(
          "pointer-events-none absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary transition-opacity",
          showDropBefore ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary transition-opacity",
          showDropAfter ? "opacity-100" : "opacity-0"
        )}
      />
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <Item
          className="flex-col items-stretch gap-0 overflow-hidden rounded-xl border-border/70 bg-muted/20 p-0"
          variant="outline"
        >
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
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {habit.name}
                  </p>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium"
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
                      {categoryPresentation.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getCadenceSummary(habit)}
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
                  event.dataTransfer.setData(
                    HABIT_DRAG_DATA_TYPE,
                    String(habit.id)
                  );
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
              <Button
                aria-label={`Archive ${habit.name}`}
                onClick={async () => {
                  await onArchiveHabit(habit.id);
                }}
                size="icon-sm"
                type="button"
                variant="destructive"
              >
                <Archive className="size-3.5" />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className="grid gap-4 border-t border-border/60 px-3 py-3 sm:px-4">
              <div
                className={cn(
                  "grid gap-3",
                  habit.frequency === "daily"
                    ? "grid-cols-1"
                    : "grid-cols-[minmax(0,1fr)_auto] items-end"
                )}
              >
                <div className="grid gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`habit-name-${habit.id}`}
                  >
                    Name
                  </Label>
                  <Input
                    className="h-9"
                    id={`habit-name-${habit.id}`}
                    onBlur={async (event) => {
                      const nextName = event.target.value;
                      setDraftName(nextName);
                      await handleRenameCommit(nextName);
                    }}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={async (event) => {
                      if (event.key !== "Enter") {
                        return;
                      }

                      event.preventDefault();
                      const nextName = event.currentTarget.value;
                      setDraftName(nextName);
                      await handleRenameCommit(nextName);
                      event.currentTarget.blur();
                    }}
                    required
                    type="text"
                    value={draftName}
                  />
                </div>

                {habit.frequency === "daily" ? null : (
                  <div className="grid gap-2 min-w-[8.5rem]">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Goal
                    </Label>
                    <HabitTargetCountStepper
                      compact
                      frequency={habit.frequency}
                      onChange={async (targetCount) => {
                        await onUpdateHabitTargetCount?.(habit.id, targetCount);
                      }}
                      value={habit.targetCount ?? 1}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Category
                  </Label>
                  <HabitCategorySelector
                    compact
                    name={`habit-category-${habit.id}`}
                    onChange={async (category) => {
                      await onUpdateHabitCategory(habit.id, category);
                    }}
                    selectedCategory={habit.category}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Frequency
                  </Label>
                  <HabitFrequencySelector
                    compact
                    name={`habit-frequency-${habit.id}`}
                    onChange={async (frequency) => {
                      await onUpdateHabitFrequency(
                        habit.id,
                        frequency,
                        habit.targetCount ?? 1
                      );
                    }}
                    selectedFrequency={habit.frequency}
                  />
                </div>
              </div>

              {habit.frequency === "daily" ? (
                <div className="grid max-w-full gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Applies on
                  </Label>
                  <HabitWeekdaySelector
                    compact
                    name={`habit-weekdays-${habit.id}`}
                    onChange={async (selectedWeekdays) => {
                      await onUpdateHabitWeekdays(habit.id, selectedWeekdays);
                    }}
                    selectedWeekdays={habit.selectedWeekdays ?? null}
                  />
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        </Item>
      </Collapsible>
    </m.div>
  );
}
