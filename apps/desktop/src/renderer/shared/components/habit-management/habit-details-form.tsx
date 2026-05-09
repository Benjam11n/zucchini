import { Label } from "@/renderer/shared/components/ui/label";
import { cn } from "@/renderer/shared/lib/class-names";

import { HabitCategorySelector } from "./habit-category-selector";
import { HabitFrequencySelector } from "./habit-frequency-selector";
import { HabitNameField } from "./habit-name-field";
import type { HabitDetailsFormProps } from "./habit-row-editor.types";
import { HabitTargetCountStepper } from "./habit-target-count-stepper";
import { HabitWeekdaySelector } from "./habit-weekday-selector";

export function HabitDetailsForm({
  draftName,
  habit,
  nameError,
  onRenameCommit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
  setDraftName,
  setNameError,
}: HabitDetailsFormProps) {
  return (
    <div className="grid gap-4 border-t border-border/60 px-3 py-3 sm:px-4">
      <div
        className={cn(
          "grid gap-3",
          habit.frequency === "daily"
            ? "grid-cols-1"
            : "grid-cols-[minmax(0,1fr)_auto] items-end"
        )}
      >
        <HabitNameField
          draftName={draftName}
          habit={habit}
          nameError={nameError}
          onCommit={onRenameCommit}
          setDraftName={setDraftName}
          setNameError={setNameError}
        />

        {habit.frequency === "daily" ? null : (
          <div className="grid gap-2 min-w-34">
            <Label className="text-xs font-medium text-muted-foreground">
              Goal
            </Label>
            <HabitTargetCountStepper
              compact
              frequency={habit.frequency}
              onChange={async (targetCount) => {
                await onUpdateHabitTargetCount(habit.id, targetCount);
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
  );
}
