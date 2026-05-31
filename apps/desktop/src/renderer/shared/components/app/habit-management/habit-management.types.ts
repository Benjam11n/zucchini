import type { HabitMutationActions } from "@/renderer/shared/types/habit-actions";
import type { Habit } from "@/shared/domain/habit";

export interface HabitManagementCardProps extends Omit<
  HabitMutationActions,
  "onPauseHabit" | "onResumeHabit"
> {
  habits: Habit[];
  onPauseHabit?: HabitMutationActions["onPauseHabit"];
  onResumeHabit?: HabitMutationActions["onResumeHabit"];
}
