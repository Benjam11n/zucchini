import { useEffect, useRef } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { performFocusTimerAction } from "@/renderer/features/focus/lib/focus-timer-actions";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

export function useFocusTimerEvents({
  clearFocusSaveError,
  pomodoroSettingsRef,
  recordFocusSession,
  setFocusSaveErrorMessage,
  timerState,
}: {
  clearFocusSaveError: () => void;
  pomodoroSettingsRef: { current: PomodoroTimerSettings };
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
  timerState: PersistedFocusTimerState;
}) {
  const hasSeenTimerStateRef = useRef(false);
  const previousTimerStateRef = useRef(timerState);

  useEffect(() => {
    if (!window.habits) {
      return;
    }

    return window.habits.onFocusSessionRecorded((focusSession) => {
      useFocusStore.getState().prependFocusSession(focusSession);
    });
  }, []);

  useEffect(() => {
    if (!window.habits) {
      return;
    }

    return window.habits.onFocusTimerActionRequested((request) => {
      const currentTimerState = useFocusStore.getState().timerState;

      async function performRequestedAction() {
        try {
          await performFocusTimerAction({
            action: request.action,
            dependencies: {
              clearFocusSaveError,
              pomodoroSettings: pomodoroSettingsRef.current,
              recordFocusSession,
              setFocusSaveErrorMessage,
              setTimerState: useFocusStore.getState().setTimerState,
              timerState: currentTimerState,
            },
          });
        } catch {
          // Action failures are already routed through focus timer state.
        }
      }

      void performRequestedAction();
    });
  }, [
    clearFocusSaveError,
    pomodoroSettingsRef,
    recordFocusSession,
    setFocusSaveErrorMessage,
  ]);

  useEffect(() => {
    if (!hasSeenTimerStateRef.current) {
      hasSeenTimerStateRef.current = true;
      previousTimerStateRef.current = timerState;
      return;
    }

    const previousTimerState = previousTimerStateRef.current;
    previousTimerStateRef.current = timerState;

    if (!window.habits) {
      return;
    }

    const startedFocusTimer =
      previousTimerState.status !== "running" &&
      timerState.status === "running" &&
      timerState.phase === "focus";

    if (!startedFocusTimer) {
      return;
    }

    async function showFocusWidget() {
      try {
        await window.habits.showFocusWidget();
      } catch {
        // Re-opening the widget is best effort UI behavior.
      }
    }

    void showFocusWidget();
  }, [timerState]);
}
