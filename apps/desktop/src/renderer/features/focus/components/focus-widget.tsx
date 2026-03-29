import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

import { FocusWidgetControls } from "@/renderer/features/focus/components/focus-widget-controls";
import { useFocusWidgetSizeSync } from "@/renderer/features/focus/components/use-focus-widget-size-sync";
import { useFocusWidgetSnapshot } from "@/renderer/features/focus/components/use-focus-widget-snapshot";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import {
  resetFocusTimer,
  toggleFocusTimer,
} from "@/renderer/features/focus/lib/focus-timer-actions";
import {
  formatTimerLabel,
  getPomodoroFocusDurationMs,
  skipBreakFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useApplyThemeMode } from "@/renderer/shared/hooks/use-apply-theme-mode";
import { useKeyboardShortcut } from "@/renderer/shared/hooks/use-keyboard-shortcut";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import {
  HabitCategoryPreferencesProvider,
  getDefaultHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { MS_PER_MINUTE } from "@/renderer/shared/lib/time";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import {
  createDefaultPomodoroTimerSettings,
  getPomodoroTimerSettings,
} from "@/shared/domain/settings";

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
  const resolvedPomodoroSettings =
    (todayState ? getPomodoroTimerSettings(todayState.settings) : null) ??
    createDefaultPomodoroTimerSettings();

  useEffect(() => {
    const previousBodyView = document.body.dataset["view"];
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.dataset["view"] = "widget";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      if (previousBodyView) {
        document.body.dataset["view"] = previousBodyView;
      } else {
        delete document.body.dataset["view"];
      }
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

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
    toggleFocusTimer({
      clearFocusSaveError,
      pomodoroSettings: resolvedPomodoroSettings,
      setTimerState,
      timerState,
    });
  }

  function handlePause() {
    toggleFocusTimer({
      clearFocusSaveError,
      pomodoroSettings: resolvedPomodoroSettings,
      setTimerState,
      timerState,
    });
  }

  async function handleReset() {
    await resetFocusTimer({
      clearFocusSaveError,
      pomodoroSettings: resolvedPomodoroSettings,
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
    <HabitCategoryPreferencesProvider
      preferences={
        todayState?.settings.categoryPreferences ??
        getDefaultHabitCategoryPreferences()
      }
    >
      <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-transparent text-foreground">
        <section
          ref={widgetRef}
          className="flex min-w-max items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.28)]"
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
    </HabitCategoryPreferencesProvider>
  );
}
