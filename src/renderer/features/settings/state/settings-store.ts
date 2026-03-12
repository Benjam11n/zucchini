import { create } from "zustand";

import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import type { AppSettings } from "@/shared/domain/settings";

export interface SettingsStoreState {
  settingsDraft: AppSettings | null;
  settingsFieldErrors: SettingsFieldErrors;
  settingsSaveErrorMessage: string | null;
  settingsSavePhase: SettingsSavePhase;
  clearSettingsFeedback: () => void;
  handleSettingsDraftChange: (settingsDraft: AppSettings) => void;
  setSettingsDraft: (settingsDraft: AppSettings | null) => void;
  setSettingsSaveErrorMessage: (message: string | null) => void;
  setSettingsSavePhase: (phase: SettingsSavePhase) => void;
  setSettingsValidationErrors: (errors: SettingsFieldErrors) => void;
}

function getInitialSettingsState(): Pick<
  SettingsStoreState,
  | "settingsDraft"
  | "settingsFieldErrors"
  | "settingsSaveErrorMessage"
  | "settingsSavePhase"
> {
  return {
    settingsDraft: null,
    settingsFieldErrors: {},
    settingsSaveErrorMessage: null,
    settingsSavePhase: "idle",
  };
}

export const useSettingsStore = create<SettingsStoreState>()((set) => ({
  ...getInitialSettingsState(),
  clearSettingsFeedback: () =>
    set({
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
      settingsSavePhase: "idle",
    }),
  handleSettingsDraftChange: (settingsDraft) => {
    set({
      settingsDraft,
      settingsSaveErrorMessage: null,
    });
  },
  setSettingsDraft: (settingsDraft) => set({ settingsDraft }),
  setSettingsSaveErrorMessage: (settingsSaveErrorMessage) =>
    set({ settingsSaveErrorMessage }),
  setSettingsSavePhase: (settingsSavePhase) => set({ settingsSavePhase }),
  setSettingsValidationErrors: (settingsFieldErrors) =>
    set({ settingsFieldErrors }),
}));

export function resetSettingsStore() {
  useSettingsStore.setState(getInitialSettingsState());
}
