import {
  readJsonStorage,
  STORAGE_KEYS,
  subscribeToStorageKey,
  writeJsonStorage,
} from "@/renderer/shared/lib/storage";

import type { PersistedFocusTimerState } from "../focus.types";
import {
  clampFocusDurationMs,
  DEFAULT_FOCUS_DURATION_MS,
} from "./focus-timer.constants";

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isPersistedBreakVariant(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "short" ||
    value === "long"
  );
}

function isPersistedFocusTimerPhase(
  value: unknown
): value is "focus" | "break" {
  return value === "focus" || value === "break";
}

function isPersistedFocusTimerStatus(
  value: unknown
): value is "idle" | "running" | "paused" {
  return value === "idle" || value === "running" || value === "paused";
}

function getPersistedFocusDurationMs(
  candidate: Partial<PersistedFocusTimerState>
): number {
  return typeof candidate.focusDurationMs === "number" &&
    Number.isFinite(candidate.focusDurationMs)
    ? clampFocusDurationMs(candidate.focusDurationMs)
    : DEFAULT_FOCUS_DURATION_MS;
}

function getCompletedFocusCycles(
  candidate: Partial<PersistedFocusTimerState>
): number {
  return typeof candidate.completedFocusCycles === "number" &&
    Number.isInteger(candidate.completedFocusCycles) &&
    candidate.completedFocusCycles >= 0
    ? candidate.completedFocusCycles
    : 0;
}

function isValidPersistedFocusTimerState(
  candidate: Partial<PersistedFocusTimerState>
): candidate is PersistedFocusTimerState {
  return (
    isPersistedBreakVariant(candidate.breakVariant) &&
    isNullableString(candidate.cycleId) &&
    isPersistedFocusTimerPhase(candidate.phase) &&
    isPersistedFocusTimerStatus(candidate.status) &&
    isNullableString(candidate.startedAt) &&
    isNullableString(candidate.endsAt) &&
    typeof candidate.remainingMs === "number" &&
    Number.isFinite(candidate.remainingMs) &&
    candidate.remainingMs >= 0 &&
    typeof candidate.lastUpdatedAt === "string"
  );
}

function parsePersistedFocusTimerState(
  value: unknown
): PersistedFocusTimerState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PersistedFocusTimerState>;
  if (!isValidPersistedFocusTimerState(candidate)) {
    return null;
  }

  let breakVariant: PersistedFocusTimerState["breakVariant"] = null;
  if (candidate.phase === "break") {
    breakVariant = candidate.breakVariant === "long" ? "long" : "short";
  }

  return {
    breakVariant,
    completedFocusCycles: getCompletedFocusCycles(candidate),
    cycleId: candidate.cycleId,
    endsAt: candidate.endsAt,
    focusDurationMs: getPersistedFocusDurationMs(candidate),
    lastUpdatedAt: candidate.lastUpdatedAt,
    phase: candidate.phase,
    remainingMs: candidate.remainingMs,
    startedAt: candidate.startedAt,
    status: candidate.status,
  };
}

export function isPersistedFocusTimerState(
  value: unknown
): value is PersistedFocusTimerState {
  const candidate = parsePersistedFocusTimerState(value);

  return candidate !== null;
}

export function readFocusTimerState(): PersistedFocusTimerState | null {
  return parsePersistedFocusTimerState(
    readJsonStorage(STORAGE_KEYS.focusTimer)
  );
}

export function writeFocusTimerState(value: PersistedFocusTimerState): void {
  if (!writeJsonStorage(STORAGE_KEYS.focusTimer, value)) {
    // Ignore storage failures; timer restore is best effort UI state.
  }
}

export function subscribeToFocusTimerState(
  onChange: (value: PersistedFocusTimerState | null) => void
): () => void {
  return subscribeToStorageKey(STORAGE_KEYS.focusTimer, (value) => {
    onChange(parsePersistedFocusTimerState(value));
  });
}
