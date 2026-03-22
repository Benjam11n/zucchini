import { useEffect } from "react";

import type { createAppActions } from "@/renderer/app/controller/app-actions";
import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
import { writePomodoroTimerSettings } from "@/renderer/features/focus/lib/pomodoro-settings-storage";
import { shouldOpenWeeklyReviewSpotlight } from "@/renderer/features/history/weekly-review/lib/weekly-review-spotlight";
import { readLastSeenWeeklyReviewStart } from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import { useApplyThemeMode } from "@/renderer/shared/hooks/use-apply-theme-mode";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";
import { toDateKey } from "@/shared/utils/date";

function getMillisecondsUntilNextLocalDay(now = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(nextMidnight.getTime() - now.getTime(), 1);
}

export function useAppLifecycleEffects({
  bootApp,
  bootPhase,
  loadWeeklyReviewOverview,
  openWeeklyReviewSpotlight,
  refreshForNewDay,
  setSystemTheme,
  settingsDraft,
  systemTheme,
  todayState,
  weeklyReviewOverview,
  weeklyReviewPhase,
}: {
  bootApp: ReturnType<typeof createAppActions>["bootApp"];
  bootPhase: AppControllerState["bootPhase"];
  loadWeeklyReviewOverview: ReturnType<
    typeof createAppActions
  >["loadWeeklyReviewOverview"];
  openWeeklyReviewSpotlight: ReturnType<
    typeof createAppActions
  >["openWeeklyReviewSpotlight"];
  refreshForNewDay: ReturnType<typeof createAppActions>["refreshForNewDay"];
  setSystemTheme: ReturnType<typeof createAppActions>["setSystemTheme"];
  settingsDraft: AppSettings | null;
  systemTheme: "dark" | "light";
  todayState: AppControllerState["todayState"];
  weeklyReviewOverview: AppControllerState["weeklyReviewOverview"];
  weeklyReviewPhase: AppControllerState["weeklyReviewPhase"];
}) {
  const savedPomodoroSettings = todayState
    ? getPomodoroTimerSettings(todayState.settings)
    : null;

  useEffect(() => {
    void bootApp();
  }, [bootApp]);

  useEffect(() => {
    if (bootPhase !== "ready" || weeklyReviewPhase !== "idle") {
      return;
    }

    void loadWeeklyReviewOverview();
  }, [bootPhase, loadWeeklyReviewOverview, weeklyReviewPhase]);

  useEffect(() => {
    const latestReview = weeklyReviewOverview?.latestReview ?? null;
    if (
      !shouldOpenWeeklyReviewSpotlight({
        bootPhase,
        lastSeenWeeklyReviewStart: readLastSeenWeeklyReviewStart(),
        latestReview,
        todayKey: todayState?.date ?? null,
        weeklyReviewPhase,
      })
    ) {
      return;
    }

    openWeeklyReviewSpotlight();
  }, [
    bootPhase,
    openWeeklyReviewSpotlight,
    todayState?.date,
    weeklyReviewOverview?.latestReview,
    weeklyReviewPhase,
  ]);

  useEffect(() => {
    setSystemTheme(systemTheme);
  }, [setSystemTheme, systemTheme]);

  useEffect(() => {
    if (bootPhase !== "ready" || !todayState?.date) {
      return;
    }

    let midnightTimer: number | null = null;

    const maybeRefreshForNewDay = () => {
      if (todayState.date === toDateKey(new Date())) {
        return;
      }

      void refreshForNewDay();
    };

    const scheduleNextRefresh = () => {
      midnightTimer = window.setTimeout(() => {
        maybeRefreshForNewDay();
      }, getMillisecondsUntilNextLocalDay());
    };

    const handleWindowFocus = () => {
      maybeRefreshForNewDay();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        maybeRefreshForNewDay();
      }
    };

    maybeRefreshForNewDay();
    scheduleNextRefresh();
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (midnightTimer !== null) {
        window.clearTimeout(midnightTimer);
      }

      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bootPhase, refreshForNewDay, todayState?.date]);

  useEffect(() => {
    if (!savedPomodoroSettings) {
      return;
    }

    writePomodoroTimerSettings(savedPomodoroSettings);
  }, [
    savedPomodoroSettings,
    savedPomodoroSettings?.focusDefaultDurationSeconds,
    savedPomodoroSettings?.focusCyclesBeforeLongBreak,
    savedPomodoroSettings?.focusLongBreakSeconds,
    savedPomodoroSettings?.focusShortBreakSeconds,
  ]);

  useApplyThemeMode({
    systemTheme,
    themeMode: (settingsDraft ?? todayState?.settings)?.themeMode ?? "system",
  });
}
