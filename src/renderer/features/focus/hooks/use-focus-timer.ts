import { useEffect, useRef } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import {
  createCompletedFocusSessionInput,
  createIdleFocusTimerState,
  createRunningBreakTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  readFocusTimerState,
  subscribeToFocusTimerState,
  writeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-storage";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";

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
