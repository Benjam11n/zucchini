import { ListTodo } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FocusQuotaGoalsCard } from "@/renderer/features/focus/components/focus-quota-goals-card";
import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { cn } from "@/renderer/shared/lib/class-names";

import { HabitManagementContent } from "./habit-management-content";
import type { HabitManagementCardProps } from "./habit-management.types";

const EMPTY_FOCUS_QUOTA_GOALS: NonNullable<
  HabitManagementCardProps["focusQuotaGoals"]
> = [];
const UNDO_TIMEOUT_MS = 5000;

export function HabitManagementCard({
  focusQuotaGoals = EMPTY_FOCUS_QUOTA_GOALS,
  habits,
  onArchiveHabit,
  onArchiveFocusQuotaGoal,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUpsertFocusQuotaGoal,
  onUnarchiveHabit,
  onUnarchiveFocusQuotaGoal,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const [archivedGoalFeedback, setArchivedGoalFeedback] = useState<{
    goalFrequencyLabel: string;
    goalId: number;
  } | null>(null);
  const archivedGoalTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (archivedGoalTimeoutRef.current !== null) {
        window.clearTimeout(archivedGoalTimeoutRef.current);
      }
    },
    []
  );

  function clearArchivedGoalTimer() {
    if (archivedGoalTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(archivedGoalTimeoutRef.current);
    archivedGoalTimeoutRef.current = null;
  }

  function showArchivedGoalFeedback(
    goalId: number,
    goalFrequencyLabel: string
  ) {
    clearArchivedGoalTimer();
    setArchivedGoalFeedback({ goalFrequencyLabel, goalId });
    archivedGoalTimeoutRef.current = window.setTimeout(() => {
      setArchivedGoalFeedback((current) =>
        current?.goalId === goalId ? null : current
      );
      archivedGoalTimeoutRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  const optionalProps = {
    ...(focusQuotaGoals.length > 0 ? { focusQuotaGoals } : {}),
    ...(onArchiveFocusQuotaGoal ? { onArchiveFocusQuotaGoal } : {}),
    ...(onUpsertFocusQuotaGoal ? { onUpsertFocusQuotaGoal } : {}),
  };

  return (
    <Card>
      <SettingsCardHeader
        description="Create, reorder, archive, and restore habits."
        icon={ListTodo}
        title="Manage habits"
      />
      <CardContent className="grid gap-3">
        <HabitManagementContent
          habits={habits}
          onArchiveHabit={onArchiveHabit}
          onCreateHabit={onCreateHabit}
          onRenameHabit={onRenameHabit}
          onReorderHabits={onReorderHabits}
          onUnarchiveHabit={onUnarchiveHabit}
          onUpdateHabitCategory={onUpdateHabitCategory}
          onUpdateHabitFrequency={onUpdateHabitFrequency}
          onUpdateHabitTargetCount={onUpdateHabitTargetCount}
          onUpdateHabitWeekdays={onUpdateHabitWeekdays}
          {...optionalProps}
        />
        {onArchiveFocusQuotaGoal && onUpsertFocusQuotaGoal ? (
          <>
            <FocusQuotaGoalsCard
              archiveButtonVariant="destructive"
              embedded
              focusQuotaGoals={focusQuotaGoals}
              onArchiveGoal={onArchiveFocusQuotaGoal}
              onArchiveGoalStart={(goal) => {
                showArchivedGoalFeedback(
                  goal.id,
                  goal.frequency[0]?.toUpperCase() + goal.frequency.slice(1)
                );
              }}
              onSaveGoal={onUpsertFocusQuotaGoal}
            />
            {archivedGoalFeedback && onUnarchiveFocusQuotaGoal ? (
              <div
                aria-live="polite"
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-foreground"
                )}
                role="status"
              >
                <span>
                  Archived {archivedGoalFeedback.goalFrequencyLabel} focus
                  quota.
                </span>
                <Button
                  className="h-7 px-2.5 text-[0.7rem]"
                  onClick={async () => {
                    const archivedGoal = archivedGoalFeedback;

                    clearArchivedGoalTimer();

                    try {
                      await onUnarchiveFocusQuotaGoal(archivedGoal.goalId);
                      setArchivedGoalFeedback(null);
                    } catch {
                      showArchivedGoalFeedback(
                        archivedGoal.goalId,
                        archivedGoal.goalFrequencyLabel
                      );
                    }
                  }}
                  type="button"
                  variant="secondary"
                >
                  Undo
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
