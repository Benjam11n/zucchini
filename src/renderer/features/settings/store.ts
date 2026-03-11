import { create } from "zustand";

import type { SettingsStoreState } from "@/renderer/app/state/types";

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
