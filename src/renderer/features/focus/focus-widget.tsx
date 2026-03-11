import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/store";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/ui/button";
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
const DRAG_REGION_STYLE = { WebkitAppRegion: "drag" } as CSSProperties;
const NO_DRAG_REGION_STYLE = {
  WebkitAppRegion: "no-drag",
} as CSSProperties;

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
  const widgetRef = useRef<HTMLElement | null>(null);
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

  const isBreak = timerState.phase === "break";
  const canStart =
    timerState.status === "idle" || timerState.status === "paused";
  const canStop = timerState.status !== "idle";

  useEffect(() => {
    const widgetElement = widgetRef.current;
    if (!widgetElement) {
      return;
    }

    let animationFrame = 0;

    const syncSize = () => {
      animationFrame = 0;
      const width = Math.ceil(widgetElement.getBoundingClientRect().width);
      const height = Math.ceil(widgetElement.getBoundingClientRect().height);
      void window.habits.resizeFocusWidget(width, height);
    };

    const scheduleSync = () => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(syncSize);
    };

    scheduleSync();

    const resizeObserver = new ResizeObserver(() => {
      scheduleSync();
    });
    resizeObserver.observe(widgetElement);

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
    };
  }, [canStart, canStop, categoryProgress, timerState.remainingMs]);

  useFocusTimer({
    clearFocusSaveError,
    recordFocusSession: window.habits.recordFocusSession,
    setFocusSaveErrorMessage,
  });

  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-background text-foreground">
      <section
        ref={widgetRef}
        className="grid min-w-max grid-cols-[auto_auto_auto] items-center gap-x-2 overflow-hidden px-2 py-1.5"
        style={DRAG_REGION_STYLE}
      >
        <p
          className={`w-[58px] justify-self-start text-left text-[1.05rem] leading-none font-black tracking-tight tabular-nums ${
            isBreak ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatTimerLabel(timerState.remainingMs)}
        </p>

        <div className="flex items-center justify-center gap-1.5 justify-self-center">
          {canStart ? (
            <Button
              className="h-6 px-2 leading-none"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(
                  timerState.status === "paused"
                    ? resumeFocusTimerState(timerState)
                    : createRunningFocusTimerState()
                );
              }}
              size="xs"
              style={NO_DRAG_REGION_STYLE}
            >
              Start
            </Button>
          ) : null}

          {canStop ? (
            <Button
              className="h-6 px-2 leading-none"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(createIdleFocusTimerState());
              }}
              size="xs"
              style={NO_DRAG_REGION_STYLE}
              variant="outline"
            >
              Stop
            </Button>
          ) : null}
        </div>

        <div className="justify-self-end">
          <HabitActivityRingGlyph
            categoryProgress={categoryProgress}
            size={30}
          />
        </div>
      </section>
    </main>
  );
}
