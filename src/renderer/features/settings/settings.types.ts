import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

export type SettingsSavePhase =
  | "idle"
  | "pending"
  | "invalid"
  | "saving"
  | "saved"
  | "error";
export type SettingsFieldErrors = Partial<Record<keyof AppSettings, string>>;

export interface SettingsPageProps {
  fieldErrors: SettingsFieldErrors;
  habits: Habit[];
  settings: AppSettings;
  saveErrorMessage: string | null;
  savePhase: SettingsSavePhase;
  onChange: (settings: AppSettings) => void;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
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
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
}

export interface HabitManagementCardProps {
  habits: Habit[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
}
