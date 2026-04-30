/**
 * Focus timer composition hook.
 *
 * Wires smaller timer concerns together: persistence sync, external IPC
 * events, idle-duration updates, and the leadership tick loop.
 */
/* eslint-disable promise/prefer-await-to-then */

import { useEffect, useRef } from "react";

import {
  createIdleFocusTimerState,
  getPomodoroFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import { createDefaultPomodoroTimerSettings } from "@/shared/domain/settings";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

import { useFocusTimerEvents } from "./use-focus-timer-events";
import { useFocusTimerLeadershipLoop } from "./use-focus-timer-loop";
import { useFocusTimerPersistence } from "./use-focus-timer-persistence";

function createInstanceId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useFocusTimer({
  clearFocusSaveError,
  pomodoroSettings,
  recordFocusSession,
  setFocusSaveErrorMessage,
}: {
  clearFocusSaveError: () => void;
  pomodoroSettings: PomodoroTimerSettings | null;
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  setFocusSaveErrorMessage: (message: string | null) => void;
}) {
  const timerState = useFocusStore((state) => state.timerState);
  const setTimerState = useFocusStore((state) => state.setTimerState);
  const instanceIdRef = useRef(createInstanceId());
  const resolvedPomodoroSettings =
    pomodoroSettings ?? createDefaultPomodoroTimerSettings();
  const pomodoroSettingsRef = useRef(resolvedPomodoroSettings);

  pomodoroSettingsRef.current = resolvedPomodoroSettings;

  const hasHydrated = useFocusTimerPersistence({
    setTimerState,
    timerState,
  });

  useEffect(() => {
    if (
      !hasHydrated ||
      timerState.status !== "idle" ||
      timerState.phase !== "focus"
    ) {
      return;
    }

    const nextFocusDurationMs = getPomodoroFocusDurationMs(
      resolvedPomodoroSettings
    );

    if (timerState.focusDurationMs === nextFocusDurationMs) {
      return;
    }

    setTimerState(
      createIdleFocusTimerState(
        new Date(),
        nextFocusDurationMs,
        timerState.completedFocusCycles
      )
    );
  }, [
    hasHydrated,
    resolvedPomodoroSettings,
    setTimerState,
    timerState.completedFocusCycles,
    timerState.focusDurationMs,
    timerState.phase,
    timerState.status,
  ]);

  useFocusTimerEvents({
    clearFocusSaveError,
    pomodoroSettingsRef,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerState,
  });

  useFocusTimerLeadershipLoop({
    clearFocusSaveError,
    instanceId: instanceIdRef.current,
    pomodoroSettingsRef,
    recordFocusSession,
    setFocusSaveErrorMessage,
    timerStatus: timerState.status,
  });
}
