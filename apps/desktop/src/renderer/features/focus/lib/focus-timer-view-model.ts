import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import { MS_PER_MINUTE } from "@/renderer/shared/lib/time";

export function getFocusTimerPhaseBadge(
  timerState: PersistedFocusTimerState,
  isBreak: boolean,
  isBreakFinalMinute: boolean
): {
  label: string;
  variant: "default" | "destructive" | "secondary";
} {
  if (isBreakFinalMinute) {
    return {
      label: "1 min left",
      variant: "destructive",
    };
  }

  if (timerState.breakVariant === "long") {
    return {
      label: "Long break",
      variant: "secondary",
    };
  }

  if (isBreak) {
    return {
      label: "Short break",
      variant: "secondary",
    };
  }

  return {
    label: "Focus",
    variant: "default",
  };
}

export function getNextBreakVariant(
  timerState: PersistedFocusTimerState,
  focusCyclesBeforeLongBreak: number
): "long" | "short" {
  if (timerState.phase === "break" && timerState.breakVariant === "long") {
    return "long";
  }

  return timerState.completedFocusCycles + 1 >= focusCyclesBeforeLongBreak
    ? "long"
    : "short";
}

export function getCycleChipLabel(focusCyclesBeforeLongBreak: number): string {
  return focusCyclesBeforeLongBreak === 1
    ? "Long break after 1 session"
    : `${focusCyclesBeforeLongBreak} sessions`;
}

export function getSkipBreakLabel(
  timerState: PersistedFocusTimerState
): string {
  return timerState.breakVariant === "long"
    ? "Skip long break"
    : "Skip short break";
}

export function getFocusTimerDisplay(timerState: PersistedFocusTimerState) {
  const isBreak = timerState.phase === "break";
  const isIdle = timerState.status === "idle";
  const isPaused = timerState.status === "paused";
  const isRunning = timerState.status === "running";
  const isLastMinute = isRunning && timerState.remainingMs <= MS_PER_MINUTE;
  const isBreakFinalMinute =
    isBreak && isRunning && timerState.remainingMs <= MS_PER_MINUTE;

  return {
    displayParts: formatTimerLabel(timerState.remainingMs).split(":"),
    isBreak,
    isBreakFinalMinute,
    isIdle,
    isLastMinute,
    isPaused,
    isRunning,
    timerDisplayColorClass: isLastMinute ? "text-amber-300" : "text-foreground",
  };
}
