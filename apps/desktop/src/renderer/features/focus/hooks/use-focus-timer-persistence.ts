import { useEffect, useRef, useState } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { arePersistedFocusTimerStatesEqual } from "@/shared/domain/focus-timer";

function resolveRestoredTimerState(
  timerState: PersistedFocusTimerState
): PersistedFocusTimerState {
  if (timerState.status !== "running" || !timerState.endsAt) {
    return timerState;
  }

  return {
    ...timerState,
    remainingMs: Math.max(Date.parse(timerState.endsAt) - Date.now(), 0),
  };
}

export function useFocusTimerPersistence({
  setTimerState,
  timerState,
}: {
  setTimerState: (timerState: PersistedFocusTimerState) => void;
  timerState: PersistedFocusTimerState;
}): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);
  const persistedTimerStateRef = useRef<PersistedFocusTimerState | null>(null);
  const latestSaveRequestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function restoreTimerState() {
      try {
        const restored = await habitsClient.getFocusTimerState();
        if (cancelled) {
          return;
        }

        const nextTimerState = restored
          ? resolveRestoredTimerState(restored)
          : null;
        persistedTimerStateRef.current = nextTimerState;

        if (
          nextTimerState &&
          !arePersistedFocusTimerStatesEqual(
            useFocusStore.getState().timerState,
            nextTimerState
          )
        ) {
          setTimerState(nextTimerState);
        }
      } catch {
        // Timer restore is best effort; fall back to the in-memory default.
      } finally {
        if (!cancelled) {
          setHasHydrated(true);
        }
      }
    }

    void restoreTimerState();

    return () => {
      cancelled = true;
    };
  }, [setTimerState]);

  useEffect(
    () =>
      window.habits.onFocusTimerStateChanged((nextTimerState) => {
        const resolvedTimerState = resolveRestoredTimerState(nextTimerState);
        persistedTimerStateRef.current = resolvedTimerState;

        if (
          arePersistedFocusTimerStatesEqual(
            useFocusStore.getState().timerState,
            resolvedTimerState
          )
        ) {
          return;
        }

        useFocusStore.getState().setTimerState(resolvedTimerState);
      }),
    []
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (
      arePersistedFocusTimerStatesEqual(
        persistedTimerStateRef.current,
        timerState
      )
    ) {
      return;
    }

    const requestId = latestSaveRequestIdRef.current + 1;
    latestSaveRequestIdRef.current = requestId;
    let cancelled = false;

    async function saveTimerState() {
      try {
        const savedTimerState =
          await habitsClient.saveFocusTimerState(timerState);
        if (cancelled || latestSaveRequestIdRef.current !== requestId) {
          return;
        }

        persistedTimerStateRef.current = savedTimerState;
      } catch {
        // Timer persistence is best effort; keep the in-memory state.
      }
    }

    void saveTimerState();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, timerState]);

  return hasHydrated;
}
