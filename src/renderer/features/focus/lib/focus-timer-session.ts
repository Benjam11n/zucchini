import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";

import {
  createIdleFocusTimerState,
  createPartialFocusSessionInput,
} from "./focus-timer-state";

const FOCUS_SAVE_ERROR_MESSAGE =
  "Could not save that focus session. New sessions will keep working.";

export async function resetFocusTimerSession({
  clearFocusSaveError,
  focusDurationMs,
  now = new Date(),
  recordFocusSession,
  setFocusSaveErrorMessage,
  setTimerState,
  timerState,
}: {
  clearFocusSaveError: () => void;
  focusDurationMs: number;
  now?: Date;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
  setTimerState: (timerState: PersistedFocusTimerState) => void;
  timerState: PersistedFocusTimerState;
}): Promise<void> {
  clearFocusSaveError();

  const partialFocusSessionInput = createPartialFocusSessionInput(
    timerState,
    now
  );

  if (partialFocusSessionInput) {
    try {
      await recordFocusSession(partialFocusSessionInput);
    } catch {
      setFocusSaveErrorMessage(FOCUS_SAVE_ERROR_MESSAGE);
    }
  }

  setTimerState(createIdleFocusTimerState(now, focusDurationMs));
}
