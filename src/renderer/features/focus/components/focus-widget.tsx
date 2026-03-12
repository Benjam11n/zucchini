import { Pause, Play, RotateCcw, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  formatTimerLabel,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/ui/button";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress } from "@/shared/domain/habit";

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
  const isIdle = timerState.status === "idle";
  const isPaused = timerState.status === "paused";
  const isRunning = timerState.status === "running";
  const canStart = isIdle || isPaused;
  const canReset = !isIdle;

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
  }, [canReset, canStart, timerState.remainingMs]);

  useFocusTimer({
    clearFocusSaveError,
    recordFocusSession: window.habits.recordFocusSession,
    setFocusSaveErrorMessage,
  });

  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-background text-foreground">
      <section
        ref={widgetRef}
        className="flex min-w-max items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,10,0.96),rgba(3,7,5,0.96))] px-2 py-1.5 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.85)]"
        style={DRAG_REGION_STYLE}
      >
        <p
          className={`min-w-[64px] pl-1 text-left text-[1.12rem] leading-none font-black tracking-tight tabular-nums ${
            isBreak ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatTimerLabel(timerState.remainingMs)}
        </p>

        <div
          className="flex items-center gap-1 rounded-full border border-white/8 bg-white/3 p-1"
          style={NO_DRAG_REGION_STYLE}
        >
          {canStart ? (
            <Button
              aria-label={isPaused ? "Resume timer" : "Start timer"}
              className="rounded-full"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(
                  isPaused
                    ? resumeFocusTimerState(timerState)
                    : createRunningFocusTimerState(
                        new Date(),
                        timerState.focusDurationMs
                      )
                );
              }}
              size="icon-xs"
            >
              <Play className="size-3.5" />
            </Button>
          ) : null}

          {isRunning ? (
            <Button
              aria-label="Pause timer"
              className="rounded-full"
              onClick={() => {
                setTimerState(pauseFocusTimerState(timerState));
              }}
              size="icon-xs"
              variant="secondary"
            >
              <Pause className="size-3.5" />
            </Button>
          ) : null}

          {canReset ? (
            <Button
              aria-label="Reset timer"
              className="rounded-full"
              onClick={() => {
                clearFocusSaveError();
                setTimerState(
                  createIdleFocusTimerState(
                    new Date(),
                    timerState.focusDurationMs
                  )
                );
              }}
              size="icon-xs"
              variant="ghost"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="px-0.5" style={NO_DRAG_REGION_STYLE}>
          <HabitActivityRingGlyph
            categoryProgress={categoryProgress}
            size={28}
          />
        </div>

        <Button
          aria-label="Close widget"
          className="rounded-full"
          onClick={() => {
            window.close();
          }}
          size="icon-xs"
          style={NO_DRAG_REGION_STYLE}
          variant="ghost"
        >
          <X className="size-3.5" />
        </Button>
      </section>
    </main>
  );
}
