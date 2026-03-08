import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

export interface SettingsPageProps {
  habits: HabitWithStatus[];
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
}

export interface HabitManagementCardProps {
  habits: HabitWithStatus[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
}
