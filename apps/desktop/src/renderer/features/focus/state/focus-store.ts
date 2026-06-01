/**
 * Focus page Zustand store.
 *
 * Manages the Pomodoro timer state, focus session history, and save error
 * messages. Provides actions for loading sessions (with dedup), prepending
 * newly recorded sessions, and updating the timer state synced from the
 * main process via IPC broadcast.
 */
import { create } from "zustand";

import type {
  FocusSessionsPhase,
  PersistedFocusTimerState,
} from "@/renderer/features/focus/focus.types";
import { createIdleFocusTimerState } from "@/renderer/features/focus/lib/focus-timer-state";
import { appClient } from "@/renderer/shared/lib/app-client";
import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type { FocusSession } from "@/shared/domain/focus-session";

interface FocusStoreState {
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: AppIpcError | null;
  focusSessionsPhase: FocusSessionsPhase;
  hasLoadedFocusSessions: boolean;
  timerState: PersistedFocusTimerState;
  clearFocusSaveError: () => void;
  loadFocusSessions: (force?: boolean) => Promise<void>;
  prependFocusSession: (focusSession: FocusSession) => void;
  setFocusSaveErrorMessage: (message: string | null) => void;
  setTimerState: (timerState: PersistedFocusTimerState) => void;
}

function createIdleTimerState() {
  return createIdleFocusTimerState();
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

    await runAppIpcTask(() => appClient.getFocusSessions(), {
      onError: (focusSessionsLoadError) => {
        set({
          focusSessionsLoadError,
          focusSessionsPhase: "error",
        });
      },
      onStart: () => {
        set({
          focusSessionsLoadError: null,
          focusSessionsPhase: "loading",
        });
      },
      onSuccess: (focusSessions) => {
        set({
          focusSessions,
          focusSessionsLoadError: null,
          focusSessionsPhase: "ready",
          hasLoadedFocusSessions: true,
        });
      },
    });
  },
  prependFocusSession: (focusSession: FocusSession) =>
    set((state) => ({
      focusSessions: state.focusSessions.some(
        (existingSession) => existingSession.id === focusSession.id
      )
        ? state.focusSessions
        : [focusSession, ...state.focusSessions].slice(0, 30),
    })),
  setFocusSaveErrorMessage: (focusSaveErrorMessage) =>
    set({ focusSaveErrorMessage }),
  setTimerState: (timerState) => set({ timerState }),
}));
