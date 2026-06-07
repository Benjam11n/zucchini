import type {
  FocusBreakVariant,
  PersistedCompletedBreakState,
  PersistedFocusTimerState,
} from "@/renderer/features/focus/focus.types";
import { toDateKey } from "@/shared/domain/date-key";
import { addMsIso, msUntil, toIsoTimestamp } from "@/shared/domain/date-time";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

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

function resolveTimerSessionId(timerSessionId: string | null): string {
  return timerSessionId ?? createCycleId();
}

export function createIdleFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS,
  completedFocusCycles = 0,
  lastCompletedBreak: PersistedCompletedBreakState | null = null
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);
  const nowIso = toIsoTimestamp(now);

  return {
    breakVariant: null,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: null,
    endsAt: null,
    focusDurationMs: resolvedFocusDurationMs,
    lastCompletedBreak,
    lastUpdatedAt: nowIso,
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: null,
    status: "idle",
    timerSessionId: null,
  };
}

export function createRunningFocusTimerState(
  now = new Date(),
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS,
  completedFocusCycles = 0,
  timerSessionId: string | null = null
): PersistedFocusTimerState {
  const resolvedFocusDurationMs = clampFocusDurationMs(focusDurationMs);
  const nowIso = toIsoTimestamp(now);

  return {
    breakVariant: null,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: createCycleId(),
    endsAt: addMsIso(now, resolvedFocusDurationMs),
    focusDurationMs: resolvedFocusDurationMs,
    lastCompletedBreak: null,
    lastUpdatedAt: nowIso,
    phase: "focus",
    remainingMs: resolvedFocusDurationMs,
    startedAt: nowIso,
    status: "running",
    timerSessionId: resolveTimerSessionId(timerSessionId),
  };
}

export function createRunningBreakTimerState({
  breakDurationMs,
  breakVariant,
  completedFocusCycles,
  focusDurationMs,
  now = new Date(),
  timerSessionId,
}: {
  breakDurationMs: number;
  breakVariant: FocusBreakVariant;
  completedFocusCycles: number;
  focusDurationMs: number;
  now?: Date;
  timerSessionId: string | null;
}): PersistedFocusTimerState {
  const resolvedBreakDurationMs = Math.max(1000, breakDurationMs);
  const nowIso = toIsoTimestamp(now);

  return {
    breakVariant,
    completedFocusCycles: Math.max(0, completedFocusCycles),
    cycleId: null,
    endsAt: addMsIso(now, resolvedBreakDurationMs),
    focusDurationMs: clampFocusDurationMs(focusDurationMs),
    lastCompletedBreak: null,
    lastUpdatedAt: nowIso,
    phase: "break",
    remainingMs: resolvedBreakDurationMs,
    startedAt: null,
    status: "running",
    timerSessionId,
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
    lastUpdatedAt: toIsoTimestamp(now),
    remainingMs: msUntil(timerState.endsAt, now),
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
    endsAt: addMsIso(now, timerState.remainingMs),
    lastUpdatedAt: toIsoTimestamp(now),
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
  durationMs: number,
  timerSessionId: string
): CreateFocusSessionInput {
  return {
    completedAt,
    completedDate: toDateKey(new Date(completedAt)),
    durationSeconds: clampFocusDurationMs(durationMs) / 1000,
    entryKind: "completed",
    startedAt,
    timerSessionId,
  };
}

function getRemainingFocusTimerMs(
  timerState: PersistedFocusTimerState,
  now = new Date()
): number {
  if (timerState.status === "running" && timerState.endsAt) {
    return msUntil(timerState.endsAt, now);
  }

  return Math.max(timerState.remainingMs, 0);
}

export function createPartialFocusSessionInput(
  timerState: PersistedFocusTimerState,
  now = new Date()
): CreateFocusSessionInput | null {
  if (
    timerState.phase !== "focus" ||
    !timerState.startedAt ||
    !timerState.timerSessionId
  ) {
    return null;
  }

  const remainingMs = getRemainingFocusTimerMs(timerState, now);
  const elapsedSeconds = Math.floor(
    Math.max(timerState.focusDurationMs - remainingMs, 0) / 1000
  );

  if (elapsedSeconds < 1) {
    return null;
  }

  return {
    completedAt: toIsoTimestamp(now),
    completedDate: toDateKey(now),
    durationSeconds: elapsedSeconds,
    entryKind: "partial",
    startedAt: timerState.startedAt,
    timerSessionId: timerState.timerSessionId,
  };
}

export function skipBreakFocusTimerState(
  timerState: PersistedFocusTimerState,
  focusDurationMs: number,
  now = new Date()
): PersistedFocusTimerState {
  if (timerState.breakVariant === "long") {
    return createIdleFocusTimerState(now, focusDurationMs);
  }

  return createRunningFocusTimerState(
    now,
    focusDurationMs,
    getCompletedFocusCyclesAfterBreak(
      timerState.breakVariant,
      timerState.completedFocusCycles
    ),
    timerState.timerSessionId
  );
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
