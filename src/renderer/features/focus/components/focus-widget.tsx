import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { FocusWidgetControls } from "@/renderer/features/focus/components/focus-widget-controls";
import { useFocusWidgetSizeSync } from "@/renderer/features/focus/components/use-focus-widget-size-sync";
import { useFocusWidgetSnapshot } from "@/renderer/features/focus/components/use-focus-widget-snapshot";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { resetFocusTimerSession } from "@/renderer/features/focus/lib/focus-timer-session";
import {
  createRunningFocusTimerState,
  formatTimerLabel,
  getPomodoroFocusDurationMs,
  pauseFocusTimerState,
  resumeFocusTimerState,
  skipBreakFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  getDefaultPomodoroTimerSettings,
  readPomodoroTimerSettings,
  subscribeToPomodoroTimerSettings,
} from "@/renderer/features/focus/lib/pomodoro-settings-storage";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useApplyThemeMode } from "@/renderer/shared/hooks/use-apply-theme-mode";
import { useKeyboardShortcut } from "@/renderer/shared/hooks/use-keyboard-shortcut";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import { MS_PER_MINUTE } from "@/renderer/shared/lib/time";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";

const DRAG_REGION_STYLE = { WebkitAppRegion: "drag" } as CSSProperties;

function getSkipBreakLabel(isLongBreak: boolean): string {
  return isLongBreak ? "Skip long break" : "Skip short break";
}

function getTimerLabelColorClass({
  isBreak,
  isLastMinute,
}: {
  isBreak: boolean;
  isLastMinute: boolean;
}): string {
  if (isLastMinute) {
    return "text-amber-300";
  }

  if (isBreak) {
    return "text-white/80";
  }

  return "text-foreground";
}

function handleClose() {
  window.close();
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
  const systemTheme = useSystemTheme();
  const [storedPomodoroSettings, setStoredPomodoroSettings] = useState(() =>
    readPomodoroTimerSettings()
  );
  const resolvedPomodoroSettings =
    storedPomodoroSettings ??
    (todayState ? getPomodoroTimerSettings(todayState.settings) : null) ??
    getDefaultPomodoroTimerSettings();

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

  useEffect(
    () =>
      subscribeToPomodoroTimerSettings((nextPomodoroSettings) => {
        setStoredPomodoroSettings(nextPomodoroSettings);
      }),
    []
  );

  useApplyThemeMode({
    systemTheme,
    themeMode: todayState?.settings.themeMode ?? "system",
  });

  const isBreak = timerState.phase === "break";
  const isIdle = timerState.status === "idle";
  const isPaused = timerState.status === "paused";
  const isRunning = timerState.status === "running";
  const isLastMinute = isRunning && timerState.remainingMs <= MS_PER_MINUTE;
  const canStart = isIdle || isPaused;
  const canReset = !isIdle;
  const canSkipBreak = isBreak;
  const skipBreakLabel = getSkipBreakLabel(timerState.breakVariant === "long");
  const timerLabelColorClass = getTimerLabelColorClass({
    isBreak,
    isLastMinute,
  });

  function handleStartOrResume() {
    clearFocusSaveError();
    setTimerState(
      isPaused
        ? resumeFocusTimerState(timerState)
        : createRunningFocusTimerState(
            new Date(),
            getPomodoroFocusDurationMs(resolvedPomodoroSettings),
            timerState.completedFocusCycles
          )
    );
  }

  function handlePause() {
    setTimerState(pauseFocusTimerState(timerState));
  }

  async function handleReset() {
    await resetFocusTimerSession({
      clearFocusSaveError,
      focusDurationMs: getPomodoroFocusDurationMs(resolvedPomodoroSettings),
      recordFocusSession: window.habits.recordFocusSession,
      setFocusSaveErrorMessage,
      setTimerState,
      timerState,
    });
  }

  function handleSkipBreak() {
    clearFocusSaveError();
    setTimerState(
      skipBreakFocusTimerState(
        timerState,
        getPomodoroFocusDurationMs(resolvedPomodoroSettings),
        new Date()
      )
    );
  }

  useFocusWidgetSizeSync(widgetRef.current);

  useKeyboardShortcut({
    code: "Space",
    enabled: canStart || isRunning,
    handler: () => {
      if (canStart) {
        handleStartOrResume();
        return;
      }

      if (isRunning) {
        handlePause();
      }
    },
  });

  useKeyboardShortcut({
    code: "KeyR",
    enabled: canReset,
    handler: handleReset,
  });

  useFocusTimer({
    clearFocusSaveError,
    pomodoroSettings: resolvedPomodoroSettings,
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
        <FocusWidgetControls
          canReset={canReset}
          canSkipBreak={canSkipBreak}
          canStart={canStart}
          categoryProgress={categoryProgress}
          isBreak={isBreak}
          isPaused={isPaused}
          isRunning={isRunning}
          onClose={handleClose}
          onPause={handlePause}
          onReset={handleReset}
          onSkipBreak={handleSkipBreak}
          onStartOrResume={handleStartOrResume}
          skipBreakLabel={skipBreakLabel}
          timerLabel={formatTimerLabel(timerState.remainingMs)}
          timerLabelColorClass={timerLabelColorClass}
        />
      </section>
    </main>
  );
}
