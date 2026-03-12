import { create } from "zustand";

import type {
  FocusSessionsPhase,
  PersistedFocusTimerState,
} from "@/renderer/features/focus/focus.types";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";

import { DEFAULT_FOCUS_DURATION_MS } from "../lib/focus-timer.constants";

export interface FocusStoreState {
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: HabitsIpcError | null;
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
  return {
    cycleId: null,
    endsAt: null,
    focusDurationMs: DEFAULT_FOCUS_DURATION_MS,
    lastUpdatedAt: new Date().toISOString(),
    phase: "focus" as const,
    remainingMs: DEFAULT_FOCUS_DURATION_MS,
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

    await runAsyncTask(() => window.habits.getFocusSessions(), {
      mapError: toHabitsIpcError,
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
      focusSessions: [focusSession, ...state.focusSessions].slice(0, 30),
    })),
  setFocusSaveErrorMessage: (focusSaveErrorMessage) =>
    set({ focusSaveErrorMessage }),
  setTimerState: (timerState) => set({ timerState }),
}));

export function resetFocusStore() {
  useFocusStore.setState(getInitialFocusState());
}
