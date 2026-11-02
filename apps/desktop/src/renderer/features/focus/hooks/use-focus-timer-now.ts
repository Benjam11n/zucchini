import { useEffect, useState } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { msUntil } from "@/shared/domain/date-time";

export function useFocusTimerNow(timerState: PersistedFocusTimerState) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (timerState.status !== "running") {
      return;
    }
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [timerState.status, timerState.endsAt]);

  return timerState.status === "running" && timerState.endsAt
    ? { ...timerState, remainingMs: msUntil(timerState.endsAt, now) }
    : timerState;
}
