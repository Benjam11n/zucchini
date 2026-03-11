import { create } from "zustand";

import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";

import type { FocusStoreState } from "./types";

function createIdleTimerState() {
  return {
    cycleId: null,
    endsAt: null,
    lastUpdatedAt: new Date().toISOString(),
    phase: "focus" as const,
    remainingMs: 25 * 60 * 1000,
    startedAt: null,
    status: "idle" as const,
  };
}

function getInitialFocusState(): Pick<
  FocusStoreState,
  | "focusSaveErrorMessage"
  | "focusSessions"
  | "focusSessionsLoadError"
  | "focusSessionsPhase"
  | "hasLoadedFocusSessions"
  | "timerState"
> {
  return {
    focusSaveErrorMessage: null,
    focusSessions: [],
    focusSessionsLoadError: null,
    focusSessionsPhase: "idle",
    hasLoadedFocusSessions: false,
    timerState: createIdleTimerState(),
  };
}

export const useFocusStore = create<FocusStoreState>()((set, get) => ({
  ...getInitialFocusState(),
  clearFocusSaveError: () => set({ focusSaveErrorMessage: null }),
  loadFocusSessions: async (force = false) => {
    if (
      get().focusSessionsPhase === "loading" ||
      (!force && get().hasLoadedFocusSessions)
    ) {
      return;
    }

    set({
      focusSessionsLoadError: null,
      focusSessionsPhase: "loading",
    });

    try {
      const focusSessions = await window.habits.getFocusSessions();
      set({
        focusSessions,
        focusSessionsLoadError: null,
        focusSessionsPhase: "ready",
        hasLoadedFocusSessions: true,
      });
    } catch (error) {
      set({
        focusSessionsLoadError: toHabitsIpcError(error),
        focusSessionsPhase: "error",
      });
    }
  },
  prependFocusSession: (focusSession: FocusSession) =>
    set((state) => ({
      focusSessions: [focusSession, ...state.focusSessions].slice(0, 30),
    })),
  setFocusSaveErrorMessage: (focusSaveErrorMessage) =>
    set({ focusSaveErrorMessage }),
  setTimerState: (timerState) => set({ timerState }),
}));

export function resetFocusStore() {
  useFocusStore.setState(getInitialFocusState());
}
