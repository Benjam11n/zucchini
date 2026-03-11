import { create } from "zustand";

import type { ThemeMode } from "@/shared/domain/settings";

import type { UiStoreState } from "./types";

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
