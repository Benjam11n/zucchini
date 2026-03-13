import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";
import { toDateKey } from "@/shared/utils/date";

import type {
  FocusBreakVariant,
  PersistedFocusTimerState,
} from "../focus.types";
import {
  clampFocusDurationMs,
  DEFAULT_FOCUS_DURATION_MS,
  focusDurationSecondsToMs,
} from "./focus-timer.constants";

function createCycleId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createIdleFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS,
  completedFocusCycles = 0
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
    breakVariant: null,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: null,
    endsAt: null,
    focusDurationMs: resolvedFocusDurationMs,
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: null,
    status: "idle",
  };
}

export function createRunningFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS,
  completedFocusCycles = 0
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
    breakVariant: null,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: createCycleId(),
    endsAt: new Date(now.getTime() + resolvedFocusDurationMs).toISOString(),
    focusDurationMs: resolvedFocusDurationMs,
    lastUpdatedAt: now.toISOString(),
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: now.toISOString(),
    status: "running",
  };
}

export function createRunningBreakTimerState({
  breakDurationMs,
  breakVariant,
  completedFocusCycles,
  focusDurationMs,
  now = new Date(),
}: {
  breakDurationMs: number;
  breakVariant: FocusBreakVariant;
  completedFocusCycles: number;
  focusDurationMs: number;
  now?: Date;
}): PersistedFocusTimerState {
  const resolvedBreakDurationMs = Math.max(1000, breakDurationMs);

  return {
    breakVariant,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: null,
    endsAt: new Date(now.getTime() + resolvedBreakDurationMs).toISOString(),
    focusDurationMs: clampFocusDurationMs(focusDurationMs),
    lastUpdatedAt: now.toISOString(),
    phase: "break",
    remainingMs: resolvedBreakDurationMs,
    startedAt: null,
    status: "running",
  };
}

export function getCompletedFocusCyclesAfterBreak(
  breakVariant: FocusBreakVariant | null,
  completedFocusCycles: number
): number {
  return breakVariant === "long" ? 0 : completedFocusCycles;
}

export function getPomodoroFocusDurationMs(
  settings: Pick<PomodoroTimerSettings, "focusDefaultDurationSeconds">
): number {
  return focusDurationSecondsToMs(settings.focusDefaultDurationSeconds);
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

export function createCompletedFocusSessionInput(
  startedAt: string,
  completedAt: string,
  durationMs: number
): CreateFocusSessionInput {
  return {
    completedAt,
    completedDate: toDateKey(new Date(completedAt)),
    durationSeconds: clampFocusDurationMs(durationMs) / 1000,
    startedAt,
  };
}

export function setFocusTimerDuration(
  timerState: PersistedFocusTimerState,
  focusDurationMs: number,
  now = new Date()
): PersistedFocusTimerState {
  if (timerState.status !== "idle" || timerState.phase !== "focus") {
    return timerState;
  }

  return createIdleFocusTimerState(
    now,
    focusDurationMs,
    timerState.completedFocusCycles
  );
}
