import type { HabitMutationActions } from "@/renderer/shared/types/habit-actions";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
import type { Habit } from "@/shared/domain/habit";

export interface HabitManagementCardProps extends Omit<
  HabitMutationActions,
  "onPauseHabit" | "onResumeHabit"
> {
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  habits: Habit[];
  onArchiveFocusQuotaGoal?: (goalId: number) => Promise<void>;
  onPauseHabit?: HabitMutationActions["onPauseHabit"];
  onResumeHabit?: HabitMutationActions["onResumeHabit"];
  onUpsertFocusQuotaGoal?: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
  onUnarchiveFocusQuotaGoal?: (goalId: number) => Promise<void>;
}
