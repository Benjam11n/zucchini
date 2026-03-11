import { create } from "zustand";

import type { BootStoreState } from "./types";

function getInitialBootState(): Pick<
  BootStoreState,
  "bootError" | "bootPhase"
> {
  return {
    bootError: null,
    bootPhase: "loading",
  };
}

export const useBootStore = create<BootStoreState>()((set) => ({
  ...getInitialBootState(),
  setBootError: (bootError) => set({ bootError }),
  setBootPhase: (bootPhase) => set({ bootPhase }),
}));

export function resetBootStore() {
  useBootStore.setState(getInitialBootState());
}
