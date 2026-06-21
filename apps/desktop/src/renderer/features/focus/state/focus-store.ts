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
import { runStoreLoad } from "@/renderer/shared/ipc/store-load-task";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { TodayState } from "@/shared/read-models/today-state";

interface FocusStoreState {
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: AppIpcError | null;
  focusSessionsPhase: FocusSessionsPhase;
  hasLoadedFocusSessions: boolean;
  timerState: PersistedFocusTimerState;
  clearFocusSaveError: () => void;
  getTodaySnapshot: () => Promise<TodayState>;
  loadFocusSessions: (force?: boolean) => Promise<void>;
  prependFocusSession: (focusSession: FocusSession) => void;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  restoreFocusTimerState: () => Promise<PersistedFocusTimerState | null>;
  saveFocusTimerState: (
    timerState: PersistedFocusTimerState
  ) => Promise<PersistedFocusTimerState>;
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
  getTodaySnapshot: () => window.desktop.query({ type: "today.get" }),
  loadFocusSessions: async (force = false) => {
    if (
      get().focusSessionsPhase === "loading" ||
      (!force && get().hasLoadedFocusSessions)
    ) {
      return;
    }

    await runStoreLoad<FocusStoreState, FocusSession[]>({
      error: (focusSessionsLoadError) => ({
        focusSessionsLoadError,
        focusSessionsPhase: "error",
      }),
      loading: {
        focusSessionsLoadError: null,
        focusSessionsPhase: "loading",
      },
      set,
      success: (focusSessions) => ({
        focusSessions,
        focusSessionsLoadError: null,
        focusSessionsPhase: "ready",
        hasLoadedFocusSessions: true,
      }),
      task: () => window.desktop.query({ type: "focusSession.list" }),
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
  recordFocusSession: async (input) => {
    const focusSession = await window.desktop.command({
      payload: input,
      type: "focusSession.record",
    });
    set({ focusSaveErrorMessage: null });
    return focusSession;
  },
  restoreFocusTimerState: () =>
    window.desktop.query({ type: "focusTimer.getState" }),
  saveFocusTimerState: (timerState) =>
    window.desktop.command({
      payload: timerState,
      type: "focusTimer.saveState",
    }),
  setFocusSaveErrorMessage: (focusSaveErrorMessage) =>
    set({ focusSaveErrorMessage }),
  setTimerState: (timerState) => set({ timerState }),
}));
