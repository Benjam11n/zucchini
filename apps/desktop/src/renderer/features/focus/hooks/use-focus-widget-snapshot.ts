/* eslint-disable promise/prefer-await-to-then */

import { useEffect, useState } from "react";

import type { TodayState } from "@/shared/contracts/habits-ipc";

const SNAPSHOT_REFRESH_MS = 30 * 1000;

export function useFocusWidgetSnapshot() {
  const [todayState, setTodayState] = useState<TodayState | null>(null);

  useEffect(() => {
    let disposed = false;

    const loadSnapshot = async () => {
      try {
        const nextTodayState = await window.habits.getTodayState();
        if (!disposed) {
          setTodayState(nextTodayState);
        }
      } catch {
        if (!disposed) {
          setTodayState(null);
        }
      }
    };

    loadSnapshot().catch(() => {
      // `loadSnapshot` already applies the fallback state.
    });
    // CHECK: this hook polls the full today payload every 30s because the
    // widget has no narrower subscription source. If the widget grows, consider
    // a dedicated IPC snapshot/update channel instead of polling.
    const timer = window.setInterval(() => {
      loadSnapshot().catch(() => {
        // `loadSnapshot` already applies the fallback state.
      });
    }, SNAPSHOT_REFRESH_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  return todayState;
}
