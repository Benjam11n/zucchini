import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export interface HabitManagementCardProps {
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  habits: Habit[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onArchiveFocusQuotaGoal?: (goalId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) => Promise<void>;
  onUpdateHabitTargetCount?: (
    habitId: number,
    targetCount: number
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
  onUpsertFocusQuotaGoal?: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
  onUnarchiveFocusQuotaGoal?: (goalId: number) => Promise<void>;
}
