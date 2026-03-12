import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import { toDateKey } from "@/shared/utils/date";

import type { PersistedFocusTimerState } from "../focus.types";
import {
  clampFocusDurationMs,
  DEFAULT_FOCUS_DURATION_MS,
} from "./focus-timer.constants";

const BREAK_DURATION_MS = 5 * 60 * 1000;

function createCycleId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createIdleFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
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
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);

  return {
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

export function createRunningBreakTimerState(
  focusDurationMs: number,
  now = new Date()
): PersistedFocusTimerState {
  return {
    cycleId: null,
    endsAt: new Date(now.getTime() + BREAK_DURATION_MS).toISOString(),
    focusDurationMs: clampFocusDurationMs(focusDurationMs),
    lastUpdatedAt: now.toISOString(),
    phase: "break",
    remainingMs: BREAK_DURATION_MS,
    startedAt: null,
    status: "running",
  };
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

  return createIdleFocusTimerState(now, focusDurationMs);
}
