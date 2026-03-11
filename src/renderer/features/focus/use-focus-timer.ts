import { useEffect } from "react";

import { useFocusStore } from "@/renderer/features/app/stores/focus-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import { toDateKey } from "@/shared/utils/date";

import { readFocusTimerState, writeFocusTimerState } from "./focus-storage";
import type { PersistedFocusTimerState } from "./types";

const FOCUS_DURATION_MS = 25 * 60 * 1000;
const BREAK_DURATION_MS = 5 * 60 * 1000;

export function createIdleFocusTimerState(
  now = new Date()
): PersistedFocusTimerState {
  return {
    endsAt: null,
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: FOCUS_DURATION_MS,
    startedAt: null,
    status: "idle",
  };
}

export function createRunningFocusTimerState(
  now = new Date()
): PersistedFocusTimerState {
  return {
    endsAt: new Date(now.getTime() + FOCUS_DURATION_MS).toISOString(),
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: FOCUS_DURATION_MS,
    startedAt: now.toISOString(),
    status: "running",
  };
}

function createRunningBreakTimerState(
  now = new Date()
): PersistedFocusTimerState {
  return {
    endsAt: new Date(now.getTime() + BREAK_DURATION_MS).toISOString(),
    lastUpdatedAt: now.toISOString(),
    phase: "break",
    remainingMs: BREAK_DURATION_MS,
    startedAt: null,
    status: "running",
  };
}

export function pauseFocusTimerState(
  timerState: PersistedFocusTimerState,
  now = new Date()
): PersistedFocusTimerState {
  if (timerState.status !== "running" || !timerState.endsAt) {
    return timerState;
  }

  return {
    ...timerState,
    endsAt: null,
    lastUpdatedAt: now.toISOString(),
    remainingMs: Math.max(Date.parse(timerState.endsAt) - now.getTime(), 0),
    status: "paused",
  };
}

export function resumeFocusTimerState(
  timerState: PersistedFocusTimerState,
  now = new Date()
): PersistedFocusTimerState {
  if (timerState.status !== "paused") {
    return timerState;
  }

  return {
    ...timerState,
    endsAt: new Date(now.getTime() + timerState.remainingMs).toISOString(),
    lastUpdatedAt: now.toISOString(),
    status: "running",
  };
}

export function formatTimerLabel(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(remainingMs, 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function createCompletedFocusSessionInput(
  startedAt: string,
  completedAt: string
): CreateFocusSessionInput {
  return {
    completedAt,
    completedDate: toDateKey(new Date(completedAt)),
    durationSeconds: FOCUS_DURATION_MS / 1000,
    startedAt,
  };
}

async function notify(
  showNotification: (title: string, body: string) => Promise<void>,
  title: string,
  body: string
): Promise<void> {
  try {
    await showNotification(title, body);
  } catch {
    // Notifications are best effort for the focus timer.
  }
}

export function useFocusTimer({
  clearFocusSaveError,
  recordFocusSession,
  setFocusSaveErrorMessage,
}: {
  clearFocusSaveError: () => void;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<unknown>;
  setFocusSaveErrorMessage: (message: string | null) => void;
}) {
  const timerState = useFocusStore((state) => state.timerState);
  const setTimerState = useFocusStore((state) => state.setTimerState);

  useEffect(() => {
    const restored = readFocusTimerState();
    if (!restored) {
      return;
    }

    if (restored.status === "running" && restored.endsAt) {
      const remainingMs = Math.max(Date.parse(restored.endsAt) - Date.now(), 0);

      if (remainingMs === 0) {
        if (restored.phase === "focus" && restored.startedAt) {
          const completedAt = restored.endsAt;
          setTimerState(createRunningBreakTimerState(new Date(completedAt)));
          clearFocusSaveError();
          void notify(
            window.habits.showNotification,
            "Focus complete",
            "Time for a short break."
          );
          void recordFocusSession(
            createCompletedFocusSessionInput(restored.startedAt, completedAt)
          ).catch(() => {
            setFocusSaveErrorMessage(
              "Could not save that focus session. New sessions will keep working."
            );
          });
          return;
        }

        setTimerState(createIdleFocusTimerState(new Date()));
        return;
      }

      setTimerState({
        ...restored,
        lastUpdatedAt: new Date().toISOString(),
        remainingMs,
      });
      return;
    }

    setTimerState(restored);
  }, [
    clearFocusSaveError,
    recordFocusSession,
    setFocusSaveErrorMessage,
    setTimerState,
  ]);

  useEffect(() => {
    writeFocusTimerState(timerState);
  }, [timerState]);

  useEffect(() => {
    if (timerState.status !== "running" || !timerState.endsAt) {
      return;
    }

    const tick = () => {
      const currentState = useFocusStore.getState().timerState;
      if (currentState.status !== "running" || !currentState.endsAt) {
        return;
      }

      const now = new Date();
      const remainingMs = Math.max(
        Date.parse(currentState.endsAt) - now.getTime(),
        0
      );

      if (remainingMs === 0) {
        if (currentState.phase === "focus" && currentState.startedAt) {
          const completedAt = currentState.endsAt;
          useFocusStore
            .getState()
            .setTimerState(createRunningBreakTimerState(new Date(completedAt)));
          clearFocusSaveError();
          void notify(
            window.habits.showNotification,
            "Focus complete",
            "Time for a short break."
          );
          void recordFocusSession(
            createCompletedFocusSessionInput(
              currentState.startedAt,
              completedAt
            )
          ).catch(() => {
            setFocusSaveErrorMessage(
              "Could not save that focus session. New sessions will keep working."
            );
          });
          return;
        }

        useFocusStore.getState().setTimerState(createIdleFocusTimerState(now));
        void notify(
          window.habits.showNotification,
          "Break complete",
          "Back to focused work."
        );
        return;
      }

      useFocusStore.getState().setTimerState({
        ...currentState,
        lastUpdatedAt: now.toISOString(),
        remainingMs,
      });
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    clearFocusSaveError,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerState.endsAt,
    timerState.phase,
    timerState.startedAt,
    timerState.status,
  ]);
}
