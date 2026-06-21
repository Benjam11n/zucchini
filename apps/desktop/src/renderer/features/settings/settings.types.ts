import type { HabitManagementActions } from "@/renderer/shared/components/app/habit-management/habit-management.types";
import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";
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

export type SettingsSavePhase =
  | "idle"
  | "pending"
  | "invalid"
  | "saving"
  | "saved"
  | "error";

export type SettingsFieldErrors = Partial<Record<keyof AppSettings, string>>;

export interface SettingsPageActions {
  dataManagement: {
    chooseBackupForRestore: () => Promise<BackupRestorePreview | null>;
    clearData: () => Promise<boolean>;
    exportBackup: () => Promise<string | null>;
    exportCsvData: () => Promise<string | null>;
    getLatestAutoBackupRestorePreview: () => Promise<BackupRestorePreview | null>;
    openAutoBackupFolder: () => Promise<string>;
    openDataFolder: () => Promise<string>;
    restoreBackup: (restoreId: string) => Promise<boolean>;
  };
  focusQuotaGoals: {
    archive: (goalId: number) => Promise<void>;
    unarchive: (goalId: number) => Promise<void>;
    upsert: (frequency: GoalFrequency, targetMinutes: number) => Promise<void>;
  };
  habits: HabitManagementActions;
  openWindDown: () => void;
  settings: {
    change: (settings: AppSettings) => void;
  };
}

export interface SettingsPageViewModel {
  fieldErrors: SettingsFieldErrors;
  focusQuotaGoals: FocusQuotaGoalWithStatus[];
  habits: Habit[];
  settings: AppSettings;
  saveErrorMessage: string | null;
  savePhase: SettingsSavePhase;
}
