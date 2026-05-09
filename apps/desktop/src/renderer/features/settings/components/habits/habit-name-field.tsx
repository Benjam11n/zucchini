import { getHabitNameError } from "@/renderer/features/settings/lib/habit-name-validation";
import { Input } from "@/renderer/shared/components/ui/input";
import { Label } from "@/renderer/shared/components/ui/label";

import type { HabitNameFieldProps } from "./habit-row-editor.types";

export function HabitNameField({
  draftName,
  habit,
  nameError,
  onCommit,
  setDraftName,
  setNameError,
}: HabitNameFieldProps) {
  async function commitInputValue(value: string) {
    setDraftName(value);
    await onCommit(value);
  }

  return (
    <div className="grid gap-2">
      <Label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={`habit-name-${habit.id}`}
      >
        Name
      </Label>
      <Input
        aria-describedby={
          nameError ? `habit-name-error-${habit.id}` : undefined
        }
        aria-invalid={nameError ? "true" : undefined}
        className="h-9"
        id={`habit-name-${habit.id}`}
        onBlur={async (event) => {
          await commitInputValue(event.target.value);
        }}
        onChange={(event) => {
          const nextName = event.target.value;
          setDraftName(nextName);
          setNameError(getHabitNameError(nextName.trim()));
        }}
        onKeyDown={async (event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          await commitInputValue(event.currentTarget.value);
          event.currentTarget.blur();
        }}
        required
        type="text"
        value={draftName}
      />
      {nameError ? (
        <p
          className="text-xs font-medium text-destructive"
          id={`habit-name-error-${habit.id}`}
        >
          {nameError}
        </p>
      ) : null}
    </div>
  );
}
