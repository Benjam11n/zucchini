/**
 * Global UI state store.
 *
 * Tracks the active tab (today/focus/history/settings) and the OS-level
 * system theme (dark/light). Updated by tab navigation and theme detection
 * hooks. Does not hold any feature-specific data.
 */
import { create } from "zustand";

import type { AppTab } from "@/renderer/app/app.types";
import { getSystemTheme } from "@/renderer/shared/lib/theme";
export interface UiStoreState {
  systemTheme: "dark" | "light";
  tab: AppTab;
  setSystemTheme: (systemTheme: "dark" | "light") => void;
  setTab: (tab: AppTab) => void;
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
