import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
/**
 * Settings page type definitions.
 *
 * Defines the save phase lifecycle (`idle` → `pending` → `saving` → `saved`/`error`),
 * field-level error map, and the full props interface for the settings page
 * component including habit management callbacks.
 */
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
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  habits: Habit[];
  settings: AppSettings;
  saveErrorMessage: string | null;
  savePhase: SettingsSavePhase;
  onChange: (settings: AppSettings) => void;
  onOpenWindDown: () => void;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
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
  onArchiveHabit: (habitId: number) => Promise<void>;
  onArchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
  onUnarchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUpsertFocusQuotaGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
}
