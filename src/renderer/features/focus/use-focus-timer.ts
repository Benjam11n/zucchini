import { useEffect, useRef } from "react";

import { useFocusStore } from "@/renderer/features/app/stores/focus-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import { toDateKey } from "@/shared/utils/date";

import {
  readFocusTimerState,
  subscribeToFocusTimerState,
  writeFocusTimerState,
} from "./focus-storage";
import type { PersistedFocusTimerState } from "./types";

const FOCUS_DURATION_MS = 25 * 60 * 1000;
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
  now = new Date()
): PersistedFocusTimerState {
  return {
    cycleId: null,
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
    cycleId: createCycleId(),
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
    cycleId: null,
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
  const instanceIdRef = useRef(createCycleId());

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
              .setTimerState(createRunningBreakTimerState(new Date()));

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
                  currentState.endsAt
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
            .setTimerState(createIdleFocusTimerState(now));
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
