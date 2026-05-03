import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export interface HabitMutationActions {
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) => Promise<void>;
  onUpdateHabitTargetCount: (
    habitId: number,
    targetCount: number
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
}
