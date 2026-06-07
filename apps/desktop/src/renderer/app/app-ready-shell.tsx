import { useState } from "react";

import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { HistorySidebar } from "@/renderer/features/history/components/history-sidebar";
import type { HistoryViewMode } from "@/renderer/features/history/history.types";
import { useHistoryViewState } from "@/renderer/features/history/hooks/use-history-view-state";
import type { HistoryViewModel } from "@/renderer/features/history/hooks/use-history-view-state";
import { TodaySidebar } from "@/renderer/features/today/components/today-sidebar";
import { WeeklyReviewSpotlightBanner } from "@/renderer/features/weekly-review/components/weekly-review-spotlight-banner";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";
import { formatDate } from "@/shared/domain/date-key";

function getRightSidebar({
  actions,
  historyMode,
  historyViewModel,
  state,
  tab,
}: ReadyAppController & {
  historyMode: HistoryViewMode;
  historyViewModel: HistoryViewModel;
}) {
  if (tab === "history") {
    const activeReview =
      state.selectedWeeklyReview ?? state.weeklyReviewOverview?.latestReview;
    const monthLabel =
      historyMode === "review" && activeReview
        ? formatDate(
            new Date(`${activeReview.weekStart}T00:00:00`),
            "monthYear"
          )
        : formatDate(
            historyViewModel.viewState.visibleMonth ??
              new Date(
                `${historyViewModel.viewState.selectedYear}-01-01T00:00:00`
              ),
            "monthYear"
          );

    return (
      <HistorySidebar
        monthStats={historyViewModel.monthStats}
        monthLabel={monthLabel}
        selectedDay={historyViewModel.selectedDay}
        todayDate={state.todayState.date}
        trendPoints={historyViewModel.trendPoints}
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
