import { create } from "zustand";

import type { AppTab } from "@/renderer/app/app.types";
import type { ThemeMode } from "@/shared/domain/settings";

export interface UiStoreState {
  systemTheme: ThemeMode;
  tab: AppTab;
  setSystemTheme: (systemTheme: ThemeMode) => void;
  setTab: (tab: AppTab) => void;
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialUiState(): Pick<UiStoreState, "systemTheme" | "tab"> {
  return {
    systemTheme: getSystemTheme(),
    tab: "today",
  };
}

export const useUiStore = create<UiStoreState>()((set) => ({
  ...getInitialUiState(),
  setSystemTheme: (systemTheme) => set({ systemTheme }),
  setTab: (tab) => set({ tab }),
}));

export function resetUiStore() {
  useUiStore.setState(getInitialUiState());
}
