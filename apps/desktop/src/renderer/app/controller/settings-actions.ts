import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import type { AppSettings } from "@/shared/domain/settings";

export function createSettingsActions() {
  return {
    clearSettingsFeedback() {
      useSettingsStore.getState().clearSettingsFeedback();
    },
    handleSettingsDraftChange(settingsDraft: AppSettings) {
      useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
    },
    async handleUpdateSettings(settings: AppSettings) {
      const nextSettings = await habitsClient.updateSettings(settings);

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
