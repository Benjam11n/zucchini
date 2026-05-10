import { useEffect } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import type { TimerNotification } from "@/renderer/features/focus/lib/focus-timer-tick";
import { resolveFocusTimerTick } from "@/renderer/features/focus/lib/focus-timer-tick";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

const LEASE_TTL_MS = 2500;

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
  if (!window.habits) {
    return;
  }

  try {
    await window.habits.releaseFocusTimerLeadership(instanceId);
  } catch {
    // Leadership release is best-effort cleanup.
  }
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
    if (!window.habits) {
      return;
    }

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
