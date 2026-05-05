import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import {
  createCompletedFocusSessionInput,
  createIdleFocusTimerState,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
  getCompletedFocusCyclesAfterBreak,
  getPomodoroFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

export interface TimerNotification {
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
