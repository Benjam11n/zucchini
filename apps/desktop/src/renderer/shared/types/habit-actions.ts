import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

export interface HabitManagementActions {
  archiveHabit: (habitId: number) => Promise<void>;
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<void>;
  pauseHabit?: (habitId: number) => Promise<void>;
  renameHabit: (habitId: number, name: string) => Promise<void>;
  reorderHabits: (habits: Habit[]) => Promise<void>;
  resumeHabit?: (habitId: number) => Promise<void>;
  unarchiveHabit: (habitId: number) => Promise<void>;
  updateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) => Promise<void>;
  updateHabitTargetCount: (
    habitId: number,
    targetCount: number
  ) => Promise<void>;
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
}
