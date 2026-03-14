import { useEffect, useRef, useState } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import {
  createCompletedFocusSessionInput,
  createIdleFocusTimerState,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
  getCompletedFocusCyclesAfterBreak,
  getPomodoroFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  readFocusTimerState,
  subscribeToFocusTimerState,
  writeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-storage";
import {
  getDefaultPomodoroTimerSettings,
  readPomodoroTimerSettings,
  subscribeToPomodoroTimerSettings,
} from "@/renderer/features/focus/lib/pomodoro-settings-storage";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
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
  pomodoroSettings,
  recordFocusSession,
  setFocusSaveErrorMessage,
}: {
  clearFocusSaveError: () => void;
  pomodoroSettings: PomodoroTimerSettings | null;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<unknown>;
  setFocusSaveErrorMessage: (message: string | null) => void;
}) {
  const timerState = useFocusStore((state) => state.timerState);
  const setTimerState = useFocusStore((state) => state.setTimerState);
  const instanceIdRef = useRef(createCycleId());
  const [storedPomodoroSettings, setStoredPomodoroSettings] = useState(() =>
    readPomodoroTimerSettings()
  );
  const resolvedPomodoroSettings =
    pomodoroSettings ??
    storedPomodoroSettings ??
    getDefaultPomodoroTimerSettings();
  const pomodoroSettingsRef = useRef(resolvedPomodoroSettings);
  const hasSeenTimerStateRef = useRef(false);
  const previousTimerStateRef = useRef(timerState);
  const [hasHydrated, setHasHydrated] = useState(false);

  pomodoroSettingsRef.current = resolvedPomodoroSettings;

  useEffect(() => {
    const restored = readFocusTimerState();
    if (restored) {
      setTimerState(resolveRestoredTimerState(restored));
    }

    setHasHydrated(true);
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

  useEffect(
    () =>
      subscribeToPomodoroTimerSettings((nextPomodoroSettings) => {
        setStoredPomodoroSettings(nextPomodoroSettings);
      }),
    []
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    writeFocusTimerState(timerState);
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
            const completedFocusCycles = currentState.completedFocusCycles + 1;
            const shouldStartLongBreak =
              completedFocusCycles >=
              pomodoroSettingsRef.current.focusCyclesBeforeLongBreak;

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
                timerSessionId: currentState.timerSessionId,
              })
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
                shouldStartLongBreak
                  ? "Time for a long break."
                  : "Time for a short break."
              );
              void recordFocusSession(
                createCompletedFocusSessionInput(
                  currentState.startedAt,
                  currentState.endsAt,
                  currentState.focusDurationMs,
                  currentState.timerSessionId ?? createCycleId()
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
