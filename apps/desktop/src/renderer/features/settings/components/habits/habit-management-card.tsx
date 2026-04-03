import { ListTodo } from "lucide-react";
import { VisuallyHidden } from "radix-ui";

import { FocusQuotaGoalsCard } from "@/renderer/features/focus/components/focus-quota-goals-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

import { HabitManagementContent } from "./habit-management-content";
import type { HabitManagementCardProps } from "./habit-management.types";

const EMPTY_FOCUS_QUOTA_GOALS: NonNullable<
  HabitManagementCardProps["focusQuotaGoals"]
> = [];

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
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const optionalProps = {
    ...(focusQuotaGoals.length > 0 ? { focusQuotaGoals } : {}),
    ...(onArchiveFocusQuotaGoal ? { onArchiveFocusQuotaGoal } : {}),
    ...(onUpsertFocusQuotaGoal ? { onUpsertFocusQuotaGoal } : {}),
    ...(onUpdateHabitTargetCount ? { onUpdateHabitTargetCount } : {}),
  };

  return (
    <Card>
      <CardHeader>
        <VisuallyHidden.Root>
          <CardDescription>Habits</CardDescription>
        </VisuallyHidden.Root>
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" />
          <CardTitle>Manage Habits</CardTitle>
        </div>
      </CardHeader>
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
          onUpdateHabitWeekdays={onUpdateHabitWeekdays}
          {...optionalProps}
        />
        {onArchiveFocusQuotaGoal && onUpsertFocusQuotaGoal ? (
          <FocusQuotaGoalsCard
            archiveButtonVariant="destructive"
            embedded
            focusQuotaGoals={focusQuotaGoals}
            onArchiveGoal={onArchiveFocusQuotaGoal}
            onSaveGoal={onUpsertFocusQuotaGoal}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
