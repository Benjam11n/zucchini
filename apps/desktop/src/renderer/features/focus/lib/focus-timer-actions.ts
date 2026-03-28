import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { resetFocusTimerSession } from "@/renderer/features/focus/lib/focus-timer-session";
import {
  createRunningFocusTimerState,
  getPomodoroFocusDurationMs,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import type { FocusTimerAction } from "@/shared/contracts/habits-ipc";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface FocusTimerActionDependencies {
  clearFocusSaveError: () => void;
  pomodoroSettings: PomodoroTimerSettings;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
  setTimerState: (timerState: PersistedFocusTimerState) => void;
  timerState: PersistedFocusTimerState;
}

export function toggleFocusTimer({
  clearFocusSaveError,
  pomodoroSettings,
  setTimerState,
  timerState,
}: Pick<
  FocusTimerActionDependencies,
  "clearFocusSaveError" | "pomodoroSettings" | "setTimerState" | "timerState"
>) {
  clearFocusSaveError();

  if (timerState.status === "running") {
    setTimerState(pauseFocusTimerState(timerState));
    return;
  }

  setTimerState(
    timerState.status === "paused"
      ? resumeFocusTimerState(timerState)
      : createRunningFocusTimerState(
          new Date(),
          getPomodoroFocusDurationMs(pomodoroSettings),
          timerState.completedFocusCycles
        )
  );
}

export async function resetFocusTimer({
  clearFocusSaveError,
  pomodoroSettings,
  recordFocusSession,
  setFocusSaveErrorMessage,
  setTimerState,
  timerState,
}: FocusTimerActionDependencies): Promise<void> {
  await resetFocusTimerSession({
    clearFocusSaveError,
    focusDurationMs: getPomodoroFocusDurationMs(pomodoroSettings),
    recordFocusSession,
    setFocusSaveErrorMessage,
    setTimerState,
    timerState,
  });
}

export async function performFocusTimerAction({
  action,
  dependencies,
}: {
  action: FocusTimerAction;
  dependencies: FocusTimerActionDependencies;
}): Promise<void> {
  if (action === "toggle") {
    toggleFocusTimer(dependencies);
    return;
  }

  await resetFocusTimer(dependencies);
}
