/**
 * Focus timer logic hook.
 *
 * Manages the full Pomodoro timer lifecycle: start, pause, resume, tick,
 * cycle transitions, and break handling. Syncs state with the main process
 * via IPC broadcast listeners and persists timer state on meaningful
 * transitions. Records completed focus sessions when cycles finish.
 */
/* eslint-disable promise/prefer-await-to-then */

import { useEffect, useRef, useState } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { performFocusTimerAction } from "@/renderer/features/focus/lib/focus-timer-actions";
import {
  createCompletedFocusSessionInput,
  createIdleFocusTimerState,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
  getCompletedFocusCyclesAfterBreak,
  getPomodoroFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import { arePersistedFocusTimerStatesEqual } from "@/shared/domain/focus-timer";
import { createDefaultPomodoroTimerSettings } from "@/shared/domain/settings";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

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

// CHECK if a function like this is needed?
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

function getFocusCompleteNotification(shouldStartLongBreak: boolean): {
  body: string;
  title: string;
} {
  return shouldStartLongBreak
    ? {
        body: "Time for a long break.",
        title: "Focus set complete",
      }
    : {
        body: "Time for a short break.",
        title: "Focus complete",
      };
}

function getBreakCompleteNotification(isLongBreak: boolean): {
  body: string;
  title: string;
} {
  return isLongBreak
    ? {
        body: "Pomodoro set finished.",
        title: "Long break complete",
      }
    : {
        body: "Back to focused work.",
        title: "Break complete",
      };
}

export function useFocusTimer({
  clearFocusSaveError,
  pomodoroSettings,
  recordFocusSession,
  setFocusSaveErrorMessage,
}: {
  clearFocusSaveError: () => void;
  pomodoroSettings: PomodoroTimerSettings | null;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
}) {
  const timerState = useFocusStore((state) => state.timerState);
  const setTimerState = useFocusStore((state) => state.setTimerState);
  const instanceIdRef = useRef(createCycleId());
  const resolvedPomodoroSettings =
    pomodoroSettings ?? createDefaultPomodoroTimerSettings();
  const pomodoroSettingsRef = useRef(resolvedPomodoroSettings);
  const hasSeenTimerStateRef = useRef(false);
  const previousTimerStateRef = useRef(timerState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const persistedTimerStateRef = useRef<PersistedFocusTimerState | null>(null);
  const latestSaveRequestIdRef = useRef(0);

  pomodoroSettingsRef.current = resolvedPomodoroSettings;

  useEffect(() => {
    let cancelled = false;

    window.habits
      .getFocusTimerState()
      .then((restored) => {
        if (cancelled) {
          return;
        }

        const nextTimerState = restored
          ? resolveRestoredTimerState(restored)
          : null;
        persistedTimerStateRef.current = nextTimerState;

        if (
          nextTimerState &&
          !arePersistedFocusTimerStatesEqual(
            useFocusStore.getState().timerState,
            nextTimerState
          )
        ) {
          setTimerState(nextTimerState);
        }
      })
      .catch(() => {
        // Timer restore is best effort; fall back to the in-memory default.
      })
      .finally(() => {
        if (!cancelled) {
          setHasHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setTimerState]);

  useEffect(
    () =>
      window.habits.onFocusTimerStateChanged((nextTimerState) => {
        const resolvedTimerState = resolveRestoredTimerState(nextTimerState);
        persistedTimerStateRef.current = resolvedTimerState;

        if (
          arePersistedFocusTimerStatesEqual(
            useFocusStore.getState().timerState,
            resolvedTimerState
          )
        ) {
          return;
        }

        useFocusStore.getState().setTimerState(resolvedTimerState);
      }),
    []
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (
      arePersistedFocusTimerStatesEqual(
        persistedTimerStateRef.current,
        timerState
      )
    ) {
      return;
    }

    const requestId = latestSaveRequestIdRef.current + 1;
    latestSaveRequestIdRef.current = requestId;
    let cancelled = false;

    window.habits
      .saveFocusTimerState(timerState)
      .then((savedTimerState) => {
        if (cancelled || latestSaveRequestIdRef.current !== requestId) {
          return;
        }

        persistedTimerStateRef.current = savedTimerState;
      })
      .catch(() => {
        // Timer persistence is best effort; keep the in-memory state.
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, timerState]);

  useEffect(() => {
    if (
      !hasHydrated ||
      timerState.status !== "idle" ||
      timerState.phase !== "focus"
    ) {
      return;
    }

    const nextFocusDurationMs = getPomodoroFocusDurationMs(
      resolvedPomodoroSettings
    );

    if (timerState.focusDurationMs === nextFocusDurationMs) {
      return;
    }

    setTimerState(
      createIdleFocusTimerState(
        new Date(),
        nextFocusDurationMs,
        timerState.completedFocusCycles
      )
    );
  }, [
    hasHydrated,
    resolvedPomodoroSettings,
    setTimerState,
    timerState.completedFocusCycles,
    timerState.focusDurationMs,
    timerState.phase,
    timerState.status,
  ]);

  useEffect(
    () =>
      window.habits.onFocusSessionRecorded((focusSession) => {
        useFocusStore.getState().prependFocusSession(focusSession);
      }),
    []
  );

  useEffect(
    () =>
      window.habits.onFocusTimerActionRequested((request) => {
        const currentTimerState = useFocusStore.getState().timerState;

        performFocusTimerAction({
          action: request.action,
          dependencies: {
            clearFocusSaveError,
            pomodoroSettings: pomodoroSettingsRef.current,
            recordFocusSession,
            setFocusSaveErrorMessage,
            setTimerState: useFocusStore.getState().setTimerState,
            timerState: currentTimerState,
          },
        }).catch(() => {
          // Action failures are already routed through focus timer state.
        });
      }),
    [clearFocusSaveError, recordFocusSession, setFocusSaveErrorMessage]
  );

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

    window.habits.showFocusWidget().catch(() => {
      // Re-opening the widget is best effort UI behavior.
    });
  }, [timerState]);

  useEffect(() => {
    const instanceId = instanceIdRef.current;

    if (timerState.status !== "running") {
      window.habits.releaseFocusTimerLeadership(instanceId).catch(() => {
        // Leadership release is best-effort cleanup.
      });
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
            const completedFocusCycles = currentState.completedFocusCycles + 1;
            const shouldStartLongBreak =
              completedFocusCycles >=
              pomodoroSettingsRef.current.focusCyclesBeforeLongBreak;
            const { timerSessionId } = currentState;

            useFocusStore.getState().setTimerState(
              createRunningBreakTimerState({
                breakDurationMs:
                  (shouldStartLongBreak
                    ? pomodoroSettingsRef.current.focusLongBreakSeconds
                    : pomodoroSettingsRef.current.focusShortBreakSeconds) *
                  MS_PER_SECOND,
                breakVariant: shouldStartLongBreak ? "long" : "short",
                completedFocusCycles,
                focusDurationMs: currentState.focusDurationMs,
                now: new Date(),
                timerSessionId,
              })
            );

            const claimedCompletion =
              await window.habits.claimFocusTimerCycleCompletion(
                getCycleCompletionId(currentState)
              );

            if (claimedCompletion) {
              const notification =
                getFocusCompleteNotification(shouldStartLongBreak);

              clearFocusSaveError();
              notify(
                window.habits.showNotification,
                notification.title,
                notification.body
              );
              if (!timerSessionId) {
                return;
              }
              recordFocusSession(
                createCompletedFocusSessionInput(
                  currentState.startedAt,
                  currentState.endsAt,
                  currentState.focusDurationMs,
                  timerSessionId
                )
              ).catch(() => {
                setFocusSaveErrorMessage(
                  "Could not save that focus session. New sessions will keep working."
                );
              });
            }

            return;
          }

          const nextCompletedFocusCycles = getCompletedFocusCyclesAfterBreak(
            currentState.breakVariant,
            currentState.completedFocusCycles
          );
          const nextFocusDurationMs = getPomodoroFocusDurationMs(
            pomodoroSettingsRef.current
          );
          const notification = getBreakCompleteNotification(
            currentState.breakVariant === "long"
          );

          useFocusStore.getState().setTimerState(
            currentState.breakVariant === "long"
              ? createIdleFocusTimerState(
                  now,
                  nextFocusDurationMs,
                  nextCompletedFocusCycles,
                  currentState.breakVariant === "long" &&
                    currentState.timerSessionId
                    ? {
                        completedAt: now.toISOString(),
                        timerSessionId: currentState.timerSessionId,
                        variant: "long",
                      }
                    : null
                )
              : createRunningFocusTimerState(
                  now,
                  nextFocusDurationMs,
                  nextCompletedFocusCycles,
                  currentState.timerSessionId
                )
          );
          notify(
            window.habits.showNotification,
            notification.title,
            notification.body
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

    tick().catch(() => {
      // Tick failures are handled inside the timer workflow.
    });
    const timer = window.setInterval(() => {
      tick().catch(() => {
        // Tick failures are handled inside the timer workflow.
      });
    }, 1000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.habits.releaseFocusTimerLeadership(instanceId).catch(() => {
        // Leadership release is best-effort cleanup.
      });
    };
  }, [
    clearFocusSaveError,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerState.status,
  ]);
}
