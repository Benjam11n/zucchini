import { GOAL_FREQUENCY_DEFINITIONS } from "@/shared/domain/goal";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";

import { FocusQuotaGoalForm } from "../focus-quota-goal-form";

interface FocusQuotaGoalsCardProps {
  archiveButtonVariant?: "destructive" | "ghost";
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  onArchiveGoal: (goalId: number) => Promise<void>;
  onArchiveGoalStart?: (goal: FocusQuotaGoalWithStatus) => void;
  onSaveGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}

export function FocusQuotaGoalsCard({
  archiveButtonVariant = "ghost",
  focusQuotaGoals,
  onArchiveGoal,
  onArchiveGoalStart,
  onSaveGoal,
}: FocusQuotaGoalsCardProps) {
  const goalsByFrequency = new Map(
    focusQuotaGoals.map((goal) => [goal.frequency, goal])
  );

  return (
    <section className="grid gap-3">
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
              {...(onArchiveGoalStart ? { onArchiveGoalStart } : {})}
            />
          );
        })}
      </div>
    </section>
  );
}
