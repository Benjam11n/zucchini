import { useEffect, useRef } from "react";

import { useFocusStore } from "@/renderer/features/focus/store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import { toDateKey } from "@/shared/utils/date";

import {
  readFocusTimerState,
  subscribeToFocusTimerState,
  writeFocusTimerState,
} from "./focus-storage";
import {
  clampFocusDurationMs,
  DEFAULT_FOCUS_DURATION_MS,
} from "./focus-timer-constants";
import type { PersistedFocusTimerState } from "./types";

const BREAK_DURATION_MS = 5 * 60 * 1000;
const LEASE_TTL_MS = 2500;

function createCycleId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCycleCompletionId(timerState: PersistedFocusTimerState): string {
  return timerState.cycleId ?? timerState.startedAt ?? timerState.endsAt ?? "0";
}

function resolveRestoredTimerState(
  timerState: PersistedFocusTimerState
): PersistedFocusTimerState {
  if (timerState.status !== "running" || !timerState.endsAt) {
    return timerState;
  }

  return {
    ...timerState,
    remainingMs: Math.max(Date.parse(timerState.endsAt) - Date.now(), 0),
  };
}

export function createIdleFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
    cycleId: null,
    endsAt: null,
    focusDurationMs: resolvedFocusDurationMs,
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: null,
    status: "idle",
  };
}

export function createRunningFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
    cycleId: createCycleId(),
    endsAt: new Date(now.getTime() + resolvedFocusDurationMs).toISOString(),
    focusDurationMs: resolvedFocusDurationMs,
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: now.toISOString(),
    status: "running",
  };
}

function createRunningBreakTimerState(
  focusDurationMs: number,
  now = new Date()
): PersistedFocusTimerState {
  return {
    cycleId: null,
    endsAt: new Date(now.getTime() + BREAK_DURATION_MS).toISOString(),
    focusDurationMs: clampFocusDurationMs(focusDurationMs),
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
  completedAt: string,
  durationMs: number
): CreateFocusSessionInput {
  return {
    completedAt,
    completedDate: toDateKey(new Date(completedAt)),
    durationSeconds: clampFocusDurationMs(durationMs) / 1000,
    startedAt,
  };
}

export function setFocusTimerDuration(
  timerState: PersistedFocusTimerState,
  focusDurationMs: number,
  now = new Date()
): PersistedFocusTimerState {
  if (timerState.status !== "idle" || timerState.phase !== "focus") {
    return timerState;
  }

  return createIdleFocusTimerState(now, focusDurationMs);
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
  const instanceIdRef = useRef(createCycleId());
  const hasSeenTimerStateRef = useRef(false);
  const previousTimerStateRef = useRef(timerState);

  useEffect(() => {
    const restored = readFocusTimerState();
    if (!restored) {
      return;
    }

    setTimerState(resolveRestoredTimerState(restored));
  }, [setTimerState]);

  useEffect(
    () =>
      subscribeToFocusTimerState((nextTimerState) => {
        useFocusStore
          .getState()
          .setTimerState(nextTimerState ?? createIdleFocusTimerState());
      }),
    []
  );

  useEffect(() => {
    writeFocusTimerState(timerState);
  }, [timerState]);

  useEffect(() => {
    if (!hasSeenTimerStateRef.current) {
      hasSeenTimerStateRef.current = true;
      previousTimerStateRef.current = timerState;
      return;
    }

    const previousTimerState = previousTimerStateRef.current;
    previousTimerStateRef.current = timerState;

    const startedFocusTimer =
      previousTimerState.status !== "running" &&
      timerState.status === "running" &&
      timerState.phase === "focus";

    if (!startedFocusTimer) {
      return;
    }

    void window.habits.showFocusWidget().catch(() => {
      // Re-opening the widget is best effort UI behavior.
    });
  }, [timerState]);

  useEffect(() => {
    const instanceId = instanceIdRef.current;

    if (timerState.status !== "running") {
      void window.habits.releaseFocusTimerLeadership(instanceId);
      return;
    }

    let disposed = false;
    let tickInFlight = false;

    const tick = async () => {
      if (disposed || tickInFlight) {
        return;
      }

      tickInFlight = true;

      try {
        const isLeader = await window.habits.claimFocusTimerLeadership(
          instanceId,
          LEASE_TTL_MS
        );

        if (!isLeader || disposed) {
          return;
        }

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
            useFocusStore
              .getState()
              .setTimerState(
                createRunningBreakTimerState(
                  currentState.focusDurationMs,
                  new Date()
                )
              );

            const claimedCompletion =
              await window.habits.claimFocusTimerCycleCompletion(
                getCycleCompletionId(currentState)
              );

            if (claimedCompletion) {
              clearFocusSaveError();
              void notify(
                window.habits.showNotification,
                "Focus complete",
                "Time for a short break."
              );
              void recordFocusSession(
                createCompletedFocusSessionInput(
                  currentState.startedAt,
                  currentState.endsAt,
                  currentState.focusDurationMs
                )
              ).catch(() => {
                setFocusSaveErrorMessage(
                  "Could not save that focus session. New sessions will keep working."
                );
              });
            }

            return;
          }

          useFocusStore
            .getState()
            .setTimerState(
              createIdleFocusTimerState(now, currentState.focusDurationMs)
            );
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
      } finally {
        tickInFlight = false;
      }
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 1000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      void window.habits.releaseFocusTimerLeadership(instanceId);
    };
  }, [
    clearFocusSaveError,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerState.status,
  ]);
}
