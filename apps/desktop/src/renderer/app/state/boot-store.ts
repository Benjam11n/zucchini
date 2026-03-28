import { create } from "zustand";

import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";

export interface BootStoreState {
  bootError: HabitsIpcError | null;
  bootPhase: "error" | "loading" | "ready";
  setBootError: (error: HabitsIpcError | null) => void;
  setBootPhase: (phase: BootStoreState["bootPhase"]) => void;
}

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
