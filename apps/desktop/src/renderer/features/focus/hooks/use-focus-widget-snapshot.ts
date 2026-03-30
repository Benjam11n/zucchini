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
