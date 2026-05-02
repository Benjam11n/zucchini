/**
 * App lifecycle React effects.
 *
 * Manages side effects that run during the app's lifecycle: initial boot,
 * weekly review overview loading, spotlight triggers, system theme syncing,
 * and the midnight rollover that refreshes data when the calendar day changes.
 */
/* eslint-disable promise/prefer-await-to-then */

import { useEffect } from "react";

import type { createAppActions } from "@/renderer/app/controller/app-actions";
import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
import { shouldOpenWeeklyReviewSpotlight } from "@/renderer/features/history/weekly-review/lib/weekly-review-spotlight";
import { readLastSeenWeeklyReviewStart } from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import { useApplyThemeMode } from "@/renderer/shared/hooks/use-apply-theme-mode";
import type { AppSettings } from "@/shared/domain/settings";
import { toDateKey } from "@/shared/utils/date";

function getMillisecondsUntilNextLocalDay(now = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(nextMidnight.getTime() - now.getTime(), 1);
}

function scheduleDeferredTask(task: () => void, timeout: number): () => void {
  const timeoutId = globalThis.setTimeout(task, timeout);
  return () => globalThis.clearTimeout(timeoutId);
}

export function useAppLifecycleEffects({
  bootApp,
  bootPhase,
  loadHistorySummary,
  loadTodayHabitStreaks,
  loadWeeklyReviewOverview,
  openWindDown,
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
  loadHistorySummary: ReturnType<typeof createAppActions>["loadHistorySummary"];
  loadTodayHabitStreaks: ReturnType<
    typeof createAppActions
  >["loadTodayHabitStreaks"];
  loadWeeklyReviewOverview: ReturnType<
    typeof createAppActions
  >["loadWeeklyReviewOverview"];
  openWindDown: ReturnType<typeof createAppActions>["handleOpenWindDown"];
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
  useEffect(() => {
    bootApp().catch(() => {
      // Boot failures are surfaced through controller state.
    });
  }, [bootApp]);

  useEffect(() => {
    const subscribeWindDownNavigation =
      "onWindDownNavigationRequested" in window.habits
        ? window.habits.onWindDownNavigationRequested.bind(window.habits)
        : null;

    if (!subscribeWindDownNavigation) {
      return;
    }

    const unsubscribe = subscribeWindDownNavigation(() => {
      openWindDown();
    });

    return unsubscribe;
  }, [openWindDown]);

  useEffect(() => {
    if (bootPhase !== "ready" || weeklyReviewPhase !== "idle") {
      return;
    }

    const cancelHistorySummary = scheduleDeferredTask(() => {
      loadHistorySummary().catch(() => {
        // History summary failures are surfaced through controller state.
      });
    }, 1800);

    const cancelHabitStreaks = scheduleDeferredTask(() => {
      loadTodayHabitStreaks().catch(() => {
        // Habit streak failures are surfaced through controller state.
      });
    }, 2400);

    const cancelWeeklyReview = scheduleDeferredTask(() => {
      loadWeeklyReviewOverview().catch(() => {
        // Weekly review failures are surfaced through controller state.
      });
    }, 3500);

    return () => {
      cancelHistorySummary();
      cancelHabitStreaks();
      cancelWeeklyReview();
    };
  }, [
    bootPhase,
    loadHistorySummary,
    loadTodayHabitStreaks,
    loadWeeklyReviewOverview,
    weeklyReviewPhase,
  ]);

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

      refreshForNewDay().catch(() => {
        // Refresh failures are surfaced through controller state.
      });
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

  useApplyThemeMode({
    systemTheme,
    themeMode: (settingsDraft ?? todayState?.settings)?.themeMode ?? "system",
  });
}
