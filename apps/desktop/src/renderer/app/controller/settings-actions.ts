import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { appClient } from "@/renderer/shared/lib/app-client";
import { clearZucchiniStorage } from "@/renderer/shared/lib/storage";
import type { AppSettings } from "@/shared/domain/settings";

export function createSettingsActions() {
  return {
    clearSettingsFeedback() {
      useSettingsStore.getState().clearSettingsFeedback();
    },
    handleChooseBackupForRestore() {
      return window.desktop.chooseBackupForRestore();
    },
    handleClearData() {
      clearZucchiniStorage();
      return window.desktop.clearData();
    },
    handleExportBackup() {
      return window.desktop.exportBackup();
    },
    handleExportCsvData() {
      return window.desktop.exportCsvData();
    },
    handleGetLatestAutoBackupRestorePreview() {
      return window.desktop.getLatestAutoBackupRestorePreview();
    },
    handleOpenAutoBackupFolder() {
      return window.desktop.openAutoBackupFolder();
    },
    handleOpenDataFolder() {
      return window.desktop.openDataFolder();
    },
    handleRestoreBackup(restoreId: string) {
      return window.desktop.restoreBackup(restoreId);
    },
    handleSettingsDraftChange(settingsDraft: AppSettings) {
      useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
    },
    async handleUpdateSettings(settings: AppSettings) {
      const nextSettings = await appClient.updateSettings(settings);

      useSettingsStore.setState({
        settingsDraft: nextSettings,
        settingsFieldErrors: {},
        settingsSaveErrorMessage: null,
      });
      const { todayState } = useTodayStore.getState();
      useTodayStore.setState({
        todayState: todayState
          ? {
              ...todayState,
              settings: nextSettings,
            }
          : todayState,
      });

      return nextSettings;
    },
    setSettingsSaveErrorMessage(message: string | null) {
      useSettingsStore.getState().setSettingsSaveErrorMessage(message);
    },
    setSettingsSavePhase(phase: SettingsSavePhase) {
      useSettingsStore.getState().setSettingsSavePhase(phase);
    },
    setSettingsValidationErrors(errors: SettingsFieldErrors) {
      useSettingsStore.getState().setSettingsValidationErrors(errors);
    },
  };
}
