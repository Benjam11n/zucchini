import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import type { AppSettings } from "@/shared/domain/settings";

import { updateTodaySettings } from "./action-helpers";

export function createSettingsActions() {
  return {
    clearSettingsFeedback() {
      useSettingsStore.getState().clearSettingsFeedback();
    },
    handleSettingsDraftChange(settingsDraft: AppSettings) {
      useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
    },
    async handleUpdateSettings(settings: AppSettings) {
      const nextSettings = await window.habits.updateSettings(settings);

      useSettingsStore.setState({
        settingsDraft: nextSettings,
        settingsFieldErrors: {},
        settingsSaveErrorMessage: null,
      });
      updateTodaySettings(nextSettings);

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
