import { useEffect } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
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
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

const LEASE_TTL_MS = 2500;

interface TimerNotification {
  body: string;
  title: string;
}

type FocusTimerTickTransition =
  | { kind: "unchanged" }
  | { kind: "updated"; nextState: PersistedFocusTimerState }
  | {
      cycleCompletionId: string;
      focusSessionInput: CreateFocusSessionInput | null;
      kind: "focusCompleted";
      nextState: PersistedFocusTimerState;
      notification: TimerNotification;
    }
  | {
      kind: "breakCompleted";
      nextState: PersistedFocusTimerState;
      notification: TimerNotification;
    };

function getCycleCompletionId(timerState: PersistedFocusTimerState): string {
  return timerState.cycleId ?? timerState.startedAt ?? timerState.endsAt ?? "0";
}

async function notify(
  showNotification: (title: string, body: string) => Promise<void>,
  notification: TimerNotification
): Promise<void> {
  try {
    await showNotification(notification.title, notification.body);
  } catch {
    // Notifications are best effort for the focus timer.
  }
}

async function releaseLeadership(instanceId: string): Promise<void> {
  try {
    await window.habits.releaseFocusTimerLeadership(instanceId);
  } catch {
    // Leadership release is best-effort cleanup.
  }
}

function getFocusCompleteNotification(
  shouldStartLongBreak: boolean
): TimerNotification {
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

function getBreakCompleteNotification(isLongBreak: boolean): TimerNotification {
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

export function resolveFocusTimerTick(
  currentState: PersistedFocusTimerState,
  settings: PomodoroTimerSettings,
  now: Date
): FocusTimerTickTransition {
  if (currentState.status !== "running" || !currentState.endsAt) {
    return { kind: "unchanged" };
  }

  const remainingMs = Math.max(
    Date.parse(currentState.endsAt) - now.getTime(),
    0
  );

  if (remainingMs > 0) {
    return {
      kind: "updated",
      nextState: {
        ...currentState,
        lastUpdatedAt: now.toISOString(),
        remainingMs,
      },
    };
  }

  if (currentState.phase === "focus") {
    if (!currentState.startedAt) {
      return { kind: "unchanged" };
    }

    const completedFocusCycles = currentState.completedFocusCycles + 1;
    const shouldStartLongBreak =
      completedFocusCycles >= settings.focusCyclesBeforeLongBreak;
    const { timerSessionId } = currentState;

    return {
      cycleCompletionId: getCycleCompletionId(currentState),
      focusSessionInput: timerSessionId
        ? createCompletedFocusSessionInput(
            currentState.startedAt,
            currentState.endsAt,
            currentState.focusDurationMs,
            timerSessionId
          )
        : null,
      kind: "focusCompleted",
      nextState: createRunningBreakTimerState({
        breakDurationMs:
          (shouldStartLongBreak
            ? settings.focusLongBreakSeconds
            : settings.focusShortBreakSeconds) * MS_PER_SECOND,
        breakVariant: shouldStartLongBreak ? "long" : "short",
        completedFocusCycles,
        focusDurationMs: currentState.focusDurationMs,
        now,
        timerSessionId,
      }),
      notification: getFocusCompleteNotification(shouldStartLongBreak),
    };
  }

  const nextCompletedFocusCycles = getCompletedFocusCyclesAfterBreak(
    currentState.breakVariant,
    currentState.completedFocusCycles
  );
  const nextFocusDurationMs = getPomodoroFocusDurationMs(settings);
  const isLongBreak = currentState.breakVariant === "long";

  return {
    kind: "breakCompleted",
    nextState: isLongBreak
      ? createIdleFocusTimerState(
          now,
          nextFocusDurationMs,
          nextCompletedFocusCycles,
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
        ),
    notification: getBreakCompleteNotification(isLongBreak),
  };
}

export function useFocusTimerLeadershipLoop({
  clearFocusSaveError,
  instanceId,
  pomodoroSettingsRef,
  recordFocusSession,
  setFocusSaveErrorMessage,
  timerStatus,
}: {
  clearFocusSaveError: () => void;
  instanceId: string;
  pomodoroSettingsRef: { current: PomodoroTimerSettings };
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
  timerStatus: PersistedFocusTimerState["status"];
}) {
  useEffect(() => {
    if (timerStatus !== "running") {
      void releaseLeadership(instanceId);
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

        const transition = resolveFocusTimerTick(
          useFocusStore.getState().timerState,
          pomodoroSettingsRef.current,
          new Date()
        );

        if (transition.kind === "unchanged") {
          return;
        }

        useFocusStore.getState().setTimerState(transition.nextState);

        if (transition.kind === "updated") {
          return;
        }

        if (transition.kind === "breakCompleted") {
          await notify(window.habits.showNotification, transition.notification);
          return;
        }

        const claimedCompletion =
          await window.habits.claimFocusTimerCycleCompletion(
            transition.cycleCompletionId
          );

        if (!claimedCompletion) {
          return;
        }

        clearFocusSaveError();
        await notify(window.habits.showNotification, transition.notification);

        if (!transition.focusSessionInput) {
          return;
        }

        try {
          await recordFocusSession(transition.focusSessionInput);
        } catch {
          setFocusSaveErrorMessage(
            "Could not save that focus session. New sessions will keep working."
          );
        }
      } finally {
        tickInFlight = false;
      }
    };

    async function runTick() {
      try {
        await tick();
      } catch {
        // Tick failures are handled inside the timer workflow.
      }
    }

    void runTick();
    const timer = window.setInterval(() => {
      void runTick();
    }, 1000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      void releaseLeadership(instanceId);
    };
  }, [
    clearFocusSaveError,
    instanceId,
    pomodoroSettingsRef,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerStatus,
  ]);
}
