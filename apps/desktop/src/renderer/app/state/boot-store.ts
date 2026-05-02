/**
 * Boot phase state store.
 *
 * Tracks whether the app is still loading initial data, has finished
 * bootstrapping, or encountered a fatal error. The boot phase gates the
 * entire renderer — the app root shows loading/error UI until phase is
 * `"ready"`.
 */
import { create } from "zustand";

import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";

interface BootStoreState {
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
