import { Timer } from "lucide-react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { useTimedUndo } from "@/renderer/shared/hooks/use-timed-undo";
import { cn } from "@/renderer/shared/lib/class-names";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";

import { FocusQuotaGoalsCard } from "../focus-quota-goals-card";

const UNDO_TIMEOUT_MS = 5000;

interface ArchivedGoalFeedback {
  goalFrequencyLabel: string;
  goalId: number;
}

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
  const archivedGoalUndo = useTimedUndo<ArchivedGoalFeedback>({
    isCurrent: (current, next) => current.goalId === next.goalId,
    timeoutMs: UNDO_TIMEOUT_MS,
  });

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
            archivedGoalUndo.show({
              goalFrequencyLabel:
                goal.frequency[0]?.toUpperCase() + goal.frequency.slice(1),
              goalId: goal.id,
            });
          }}
          onSaveGoal={onUpsertFocusQuotaGoal}
        />
        {archivedGoalUndo.value ? (
          <output
            aria-live="polite"
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-foreground"
            )}
          >
            <span>
              Archived {archivedGoalUndo.value.goalFrequencyLabel} focus quota.
            </span>
            <Button
              className="h-7 px-2.5 text-[0.7rem]"
              onClick={async () => {
                const archivedGoal = archivedGoalUndo.consume();
                if (!archivedGoal) {
                  return;
                }

                try {
                  await onUnarchiveFocusQuotaGoal(archivedGoal.goalId);
                } catch {
                  archivedGoalUndo.show(archivedGoal);
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
