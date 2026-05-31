import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { cn } from "@/renderer/shared/lib/class-names";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";

import { FocusQuotaGoalsCard } from "./focus-quota-goals-card";

const UNDO_TIMEOUT_MS = 5000;

interface FocusQuotaSettingsCardProps {
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  onArchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUnarchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUpsertFocusQuotaGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}

export function FocusQuotaSettingsCard({
  focusQuotaGoals,
  onArchiveFocusQuotaGoal,
  onUnarchiveFocusQuotaGoal,
  onUpsertFocusQuotaGoal,
}: FocusQuotaSettingsCardProps) {
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

  return (
    <Card>
      <SettingsCardHeader
        description="Set weekly and monthly focus targets."
        icon={Timer}
        title="Focus quota"
      />
      <CardContent className="grid gap-3">
        <FocusQuotaGoalsCard
          archiveButtonVariant="destructive"
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
        {archivedGoalFeedback ? (
          <output
            aria-live="polite"
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-foreground"
            )}
          >
            <span>
              Archived {archivedGoalFeedback.goalFrequencyLabel} focus quota.
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
          </output>
        ) : null}
      </CardContent>
    </Card>
  );
}
