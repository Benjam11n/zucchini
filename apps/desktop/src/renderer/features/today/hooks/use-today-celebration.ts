/**
 * Habit completion celebration hook.
 *
 * Triggers a timed celebration animation when all daily habits are completed.
 * Compares the current UI snapshot against the last-seen state to detect
 * fresh completions and prevents re-triggering on re-renders.
 */
import { useEffect, useRef, useState } from "react";

import type { TodayCelebration } from "@/renderer/features/today/lib/today-celebration";
import { resolveTodayCelebration } from "@/renderer/features/today/lib/today-celebration";
import { createTodayUiSnapshot } from "@/renderer/features/today/lib/today-ui-snapshot";
import { readLastUiState } from "@/renderer/features/today/lib/today-ui-storage";
import type { TodayState } from "@/shared/contracts/habits-ipc";

const CELEBRATION_DURATION_MS = 4200;

interface UseTodayCelebrationOptions {
  completedCount: number;
  dailyHabitCount: number;
  state: TodayState;
}

export function useTodayCelebration({
  completedCount,
  dailyHabitCount,
  state,
}: UseTodayCelebrationOptions): TodayCelebration | null {
  const [celebration, setCelebration] = useState<TodayCelebration | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const previousStateRef = useRef(readLastUiState());

  useEffect(() => {
    const nextCelebration = resolveTodayCelebration({
      completedCount,
      dailyHabitCount,
      date: state.date,
      lastUiState: previousStateRef.current,
      streak: state.streak,
    });

    previousStateRef.current = createTodayUiSnapshot(state, completedCount);

    if (!nextCelebration) {
      return;
    }

    setCelebration(nextCelebration);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCelebration((activeCelebration) =>
        activeCelebration?.id === nextCelebration.id ? null : activeCelebration
      );
      timeoutRef.current = null;
    }, CELEBRATION_DURATION_MS);
  }, [completedCount, dailyHabitCount, state]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return celebration;
}
