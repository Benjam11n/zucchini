import { useForm } from "@tanstack/react-form";
import { Archive, Timer } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import { Input } from "@/renderer/shared/components/ui/input";
import { Label } from "@/renderer/shared/components/ui/label";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getFocusQuotaTargetMinutesBounds,
  GOAL_FREQUENCY_DEFINITIONS,
} from "@/shared/domain/goal";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";

interface FocusQuotaGoalsCardProps {
  archiveButtonVariant?: "destructive" | "ghost";
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  embedded?: boolean;
  onArchiveGoal: (goalId: number) => Promise<void>;
  onSaveGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}

interface FocusQuotaGoalFormProps {
  archiveButtonVariant: "destructive" | "ghost";
  definition: (typeof GOAL_FREQUENCY_DEFINITIONS)[number];
  goal: FocusQuotaGoalWithStatus | undefined;
  onArchiveGoal: (goalId: number) => Promise<void>;
  onSaveGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}

function FocusQuotaGoalForm({
  archiveButtonVariant,
  definition,
  goal,
  onArchiveGoal,
  onSaveGoal,
}: FocusQuotaGoalFormProps) {
  const inputId = `focus-quota-${definition.value}`;
  const form = useForm({
    defaultValues: {
      minutes: goal ? `${goal.targetMinutes}` : "",
    },
    onSubmit: async ({ value }) => {
      const targetMinutes = Number(value.minutes);
      const { max, min } = getFocusQuotaTargetMinutesBounds(definition.value);

      if (
        !Number.isInteger(targetMinutes) ||
        targetMinutes < min ||
        targetMinutes > max
      ) {
        return;
      }

      await onSaveGoal(definition.value, targetMinutes);
    },
  });

  return (
    <form
      className="grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await form.handleSubmit();
      }}
    >
      <Label className="min-w-0 text-sm font-medium" htmlFor={inputId}>
        {definition.label}
      </Label>

      <div className="flex items-center gap-2">
        <form.Field name="minutes">
          {(field) => (
            <div className="flex-1">
              <Input
                aria-label={`${definition.label} focus quota in minutes`}
                className="h-9"
                id={inputId}
                min="30"
                name="minutes"
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                placeholder="Minutes"
                step="1"
                type="number"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
        {goal ? (
          <Button
            className="h-9 shrink-0 px-3"
            onClick={async () => {
              await onArchiveGoal(goal.id);
            }}
            size="sm"
            type="button"
            variant={archiveButtonVariant}
          >
            <Archive className="size-4" />
          </Button>
        ) : null}
        <form.Subscribe
          selector={(formState) => ({
            isSubmitting: formState.isSubmitting,
            minutes: formState.values.minutes,
          })}
        >
          {(state) => (
            <Button
              className="h-9 px-3"
              disabled={state.isSubmitting || state.minutes === ""}
              type="submit"
            >
              {goal ? "Save" : "Add"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export function FocusQuotaGoalsCard({
  archiveButtonVariant = "ghost",
  embedded = false,
  focusQuotaGoals,
  onArchiveGoal,
  onSaveGoal,
}: FocusQuotaGoalsCardProps) {
  const goalsByFrequency = new Map(
    focusQuotaGoals.map((goal) => [goal.frequency, goal])
  );

  return (
    <section
      className={cn("grid gap-3", embedded && "border-t border-border/60 pt-3")}
    >
      <div className="flex items-center gap-2">
        <Timer className="size-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Focus quota</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GOAL_FREQUENCY_DEFINITIONS.map((definition) => {
          const goal = goalsByFrequency.get(definition.value);

          return (
            <FocusQuotaGoalForm
              archiveButtonVariant={archiveButtonVariant}
              definition={definition}
              goal={goal}
              key={`${definition.value}-${goal?.id ?? "new"}-${goal?.targetMinutes ?? "empty"}`}
              onArchiveGoal={onArchiveGoal}
              onSaveGoal={onSaveGoal}
            />
          );
        })}
      </div>
    </section>
  );
}
