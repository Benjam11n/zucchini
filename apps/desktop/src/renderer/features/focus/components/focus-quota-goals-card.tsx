import { Archive, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { Input } from "@/renderer/shared/components/ui/input";
import { Label } from "@/renderer/shared/components/ui/label";
import { cn } from "@/renderer/shared/lib/class-names";
import { GOAL_FREQUENCY_DEFINITIONS } from "@/shared/domain/goal";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";

function getDraftValue(goal: FocusQuotaGoalWithStatus | undefined): string {
  return goal ? `${goal.targetMinutes}` : "";
}

function buildDrafts(
  goals: FocusQuotaGoalWithStatus[]
): Record<GoalFrequency, string> {
  const goalsByFrequency = new Map(goals.map((goal) => [goal.frequency, goal]));
  return {
    monthly: getDraftValue(goalsByFrequency.get("monthly")),
    weekly: getDraftValue(goalsByFrequency.get("weekly")),
  };
}

interface FocusQuotaGoalsCardProps {
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  embedded?: boolean;
  onArchiveGoal: (goalId: number) => Promise<void>;
  onSaveGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}

export function FocusQuotaGoalsCard({
  embedded = false,
  focusQuotaGoals,
  onArchiveGoal,
  onSaveGoal,
}: FocusQuotaGoalsCardProps) {
  const [drafts, setDrafts] = useState<Record<GoalFrequency, string>>(() =>
    buildDrafts(focusQuotaGoals)
  );
  const goalsByFrequency = new Map(
    focusQuotaGoals.map((goal) => [goal.frequency, goal])
  );

  useEffect(() => {
    setDrafts(buildDrafts(focusQuotaGoals));
  }, [focusQuotaGoals]);

  return (
    <section
      className={cn("grid gap-3", embedded && "border-t border-border/60 pt-3")}
    >
      <div className="flex items-center gap-2">
        <Timer className="size-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Focus quota</p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {GOAL_FREQUENCY_DEFINITIONS.map((definition) => {
          const goal = goalsByFrequency.get(definition.value);
          const inputId = `focus-quota-${definition.value}`;

          return (
            <form
              key={definition.value}
              className="grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const targetMinutes = Number(drafts[definition.value]);

                if (!Number.isFinite(targetMinutes) || targetMinutes <= 0) {
                  return;
                }

                await onSaveGoal(definition.value, Math.round(targetMinutes));
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label className="text-sm font-medium" htmlFor={inputId}>
                    {definition.label}
                  </Label>
                  <p className="truncate text-xs text-muted-foreground">
                    {goal
                      ? `${goal.completedMinutes}/${goal.targetMinutes} min this ${definition.value === "weekly" ? "week" : "month"}`
                      : ""}
                  </p>
                </div>
                {goal ? (
                  <Button
                    className="shrink-0"
                    onClick={async () => {
                      await onArchiveGoal(goal.id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Archive className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    aria-label={`${definition.label} focus quota in minutes`}
                    className="h-9"
                    id={inputId}
                    min="30"
                    name="minutes"
                    onChange={(event) => {
                      setDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [definition.value]: event.target.value,
                      }));
                    }}
                    placeholder="Minutes"
                    step="1"
                    type="number"
                    value={drafts[definition.value]}
                  />
                </div>
                <Button className="h-9 px-3" type="submit">
                  {goal ? "Save" : "Add"}
                </Button>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}
