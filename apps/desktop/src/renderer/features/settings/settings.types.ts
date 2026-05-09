import type { HabitMutationActions } from "@/renderer/shared/types/habit-actions";
import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/shared/types/settings";
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
import type { Habit } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

export type { SettingsFieldErrors, SettingsSavePhase };

export interface SettingsPageProps extends HabitMutationActions {
  fieldErrors: SettingsFieldErrors;
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  habits: Habit[];
  settings: AppSettings;
  saveErrorMessage: string | null;
  savePhase: SettingsSavePhase;
  onChange: (settings: AppSettings) => void;
  onOpenWindDown: () => void;
  onArchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUnarchiveFocusQuotaGoal: (goalId: number) => Promise<void>;
  onUpsertFocusQuotaGoal: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
}
