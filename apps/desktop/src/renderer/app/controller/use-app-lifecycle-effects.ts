/**
 * App lifecycle React effects.
 *
 * Manages side effects that run during the app's lifecycle: initial boot,
 * lightweight history loading, spotlight triggers, system theme syncing, and
 * the midnight rollover that refreshes data when the calendar day changes.
 */
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
  loadHistoryYears,
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
  loadHistoryYears: ReturnType<typeof createAppActions>["loadHistoryYears"];
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
    void bootApp();
  }, [bootApp]);

  useEffect(() => {
    if (!window.habits) {
      return;
    }

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
    if (bootPhase !== "ready") {
      return;
    }

    const cancelHistoryYearsPreload = scheduleDeferredTask(() => {
      void loadHistoryYears();
    }, 1200);
    const cancelHistorySummary = scheduleDeferredTask(() => {
      void loadHistorySummary();
    }, 1800);

    return () => {
      cancelHistoryYearsPreload();
      cancelHistorySummary();
    };
  }, [bootPhase, loadHistorySummary, loadHistoryYears]);

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

  useApplyThemeMode({
    systemTheme,
    themeMode: (settingsDraft ?? todayState?.settings)?.themeMode ?? "system",
  });
}
