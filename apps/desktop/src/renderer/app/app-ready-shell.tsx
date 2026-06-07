import { useState } from "react";

import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { HistorySidebar } from "@/renderer/features/history/components/history-sidebar";
import type { HistoryViewMode } from "@/renderer/features/history/history.types";
import { useHistoryViewState } from "@/renderer/features/history/hooks/use-history-view-state";
import type { HistoryViewModel } from "@/renderer/features/history/hooks/use-history-view-state";
import {
  getHistoryMonthDays,
  getHistoryMonthStats,
  getHistoryTrendPoints,
} from "@/renderer/features/history/lib/history-timeline";
import { TodaySidebar } from "@/renderer/features/today/components/today-sidebar";
import { WeeklyReviewSpotlightBanner } from "@/renderer/features/weekly-review/components/weekly-review-spotlight-banner";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";
import type { HistoryDailyCountDay } from "@/renderer/shared/lib/history-daily-counts";
import { getHistoryDayLookup } from "@/renderer/shared/lib/history-summary";
import { formatDate } from "@/shared/domain/date-format";
import { getMonthRange, parseDateKey } from "@/shared/domain/date-key";

function getRightSidebar({
  actions,
  historyMode,
  historyViewHistory,
  historyViewModel,
  state,
  tab,
}: ReadyAppController & {
  historyMode: HistoryViewMode;
  historyViewHistory: HistoryDailyCountDay[];
  historyViewModel: HistoryViewModel;
}) {
  if (tab === "history") {
    const activeReview =
      state.selectedWeeklyReview ?? state.weeklyReviewOverview?.latestReview;
    const reviewMonth =
      historyMode === "review" && activeReview
        ? parseDateKey(activeReview.weekStart)
        : null;
    const reviewMonthRange = reviewMonth ? getMonthRange(reviewMonth) : null;
    const reviewMonthHistory = reviewMonthRange
      ? historyViewHistory.filter(
          (day) =>
            day.date >= reviewMonthRange.startDate &&
            day.date <= reviewMonthRange.endDate
        )
      : [];
    const reviewSelectedDay =
      activeReview && reviewMonthHistory.length > 0
        ? (getHistoryDayLookup(reviewMonthHistory).get(
            activeReview.weekStart
          ) ??
          reviewMonthHistory[0] ??
          null)
        : null;
    const sidebarMonthStats = reviewMonth
      ? getHistoryMonthStats(getHistoryMonthDays(reviewMonthHistory, null))
      : historyViewModel.monthStats;
    const sidebarTrendPoints = reviewMonth
      ? getHistoryTrendPoints(reviewMonthHistory)
      : historyViewModel.trendPoints;
    const sidebarSelectedDay = reviewMonth
      ? reviewSelectedDay
      : historyViewModel.selectedDay;
    const monthLabel = formatDate(
      reviewMonth ??
        historyViewModel.viewState.visibleMonth ??
        new Date(`${historyViewModel.viewState.selectedYear}-01-01T00:00:00`),
      "monthYear"
    );

    return (
      <HistorySidebar
        monthStats={sidebarMonthStats}
        monthLabel={monthLabel}
        selectedDay={sidebarSelectedDay}
        todayDate={state.todayState.date}
        trendPoints={sidebarTrendPoints}
      />
    );
  }

  if (tab === "today") {
    return (
      <TodaySidebar
        history={state.historySummary}
        state={state.todayState}
        onSetDayStatus={actions.handleSetDayStatus}
      />
    );
  }
}

export function AppReadyShell({
  controller,
}: {
  controller: ReadyAppController;
}) {
  const { actions, state, tab } = controller;
  const [historyMode, setHistoryMode] = useState<HistoryViewMode>("timeline");
  const historyViewHistory =
    state.contributionHistory.length > 0
      ? state.contributionHistory
      : state.history;
  const historyViewModel = useHistoryViewState({
    history: historyViewHistory,
    historyYears: state.historyYears,
    selectedHistoryYear: state.selectedHistoryYear,
    todayDate: state.todayState.date,
  });
  const rightSidebar = getRightSidebar({
    ...controller,
    historyMode,
    historyViewHistory,
    historyViewModel,
  });
  const weeklyReviewBanner =
    state.isWeeklyReviewSpotlightOpen &&
    state.weeklyReviewOverview?.latestReview ? (
      <WeeklyReviewSpotlightBanner
        onDismiss={actions.handleDismissWeeklyReviewSpotlight}
        onOpenReview={actions.handleWeeklyReviewOpen}
        review={state.weeklyReviewOverview.latestReview}
      />
    ) : null;

  return (
    <HabitCategoryPreferencesProvider
      preferences={
        (state.settingsDraft ?? state.todayState.settings).categoryPreferences
      }
    >
      <AppShell
        rightSidebar={rightSidebar}
        tab={tab}
        topBanner={weeklyReviewBanner}
        onTabChange={actions.handleTabChange}
      >
        <CurrentRoute
          {...controller}
          {...(tab === "history" ? { historyViewModel } : {})}
          {...(tab === "history"
            ? { historyMode, onHistoryModeChange: setHistoryMode }
            : {})}
        />
      </AppShell>
    </HabitCategoryPreferencesProvider>
  );
}
