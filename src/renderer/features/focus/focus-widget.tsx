import { useEffect, useState } from "react";

import { HabitActivityRingGlyph } from "@/components/custom/apple-activity-ring";
import { Button } from "@/components/ui/button";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/app/stores/focus-store";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress } from "@/shared/domain/habit";

import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  formatTimerLabel,
  resumeFocusTimerState,
  useFocusTimer,
} from "./use-focus-timer";

const SNAPSHOT_REFRESH_MS = 30 * 1000;

function useFocusWidgetSnapshot() {
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

    void loadSnapshot();
    const timer = window.setInterval(() => {
      void loadSnapshot();
    }, SNAPSHOT_REFRESH_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  return todayState;
}

export function FocusWidget() {
  const timerState = useFocusStore((state) => state.timerState);
  const clearFocusSaveError = useFocusStore(
    (state) => state.clearFocusSaveError
  );
  const setFocusSaveErrorMessage = useFocusStore(
    (state) => state.setFocusSaveErrorMessage
  );
  const setTimerState = useFocusStore((state) => state.setTimerState);
  const todayState = useFocusWidgetSnapshot();
  const categoryProgress = getHabitCategoryProgress(todayState?.habits ?? []);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    resetFocusStore();
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    const preferredTheme = todayState?.settings.themeMode ?? "system";
    const resolvedTheme =
      preferredTheme === "system" ? systemTheme : preferredTheme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [systemTheme, todayState?.settings.themeMode]);

  useFocusTimer({
    clearFocusSaveError,
    recordFocusSession: window.habits.recordFocusSession,
    setFocusSaveErrorMessage,
  });

  const isBreak = timerState.phase === "break";
  const canStart =
    timerState.status === "idle" || timerState.status === "paused";
  const canStop = timerState.status !== "idle";

  return (
    <main className="w-full overflow-hidden bg-background px-2 py-1.5 text-foreground">
      <section className="flex w-full items-center gap-2 overflow-hidden">
        <p
          className={`min-w-[64px] text-xl font-black tracking-tight tabular-nums ${
            isBreak ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatTimerLabel(timerState.remainingMs)}
        </p>

        <div className="flex flex-1 items-center gap-2">
          {canStart ? (
            <Button
              className="px-2"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(
                  timerState.status === "paused"
                    ? resumeFocusTimerState(timerState)
                    : createRunningFocusTimerState()
                );
              }}
              size="xs"
            >
              Start
            </Button>
          ) : null}

          {canStop ? (
            <Button
              className="px-2"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(createIdleFocusTimerState());
              }}
              size="xs"
              variant="outline"
            >
              Stop
            </Button>
          ) : null}
        </div>

        <HabitActivityRingGlyph categoryProgress={categoryProgress} size={36} />
      </section>
    </main>
  );
}
