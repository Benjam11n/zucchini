import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { HistorySidebar } from "@/renderer/features/history/components/history-sidebar";
import { useHistoryViewState } from "@/renderer/features/history/use-history-view-state";
import type { HistoryViewModel } from "@/renderer/features/history/use-history-view-state";
import { WeeklyReviewSpotlightBanner } from "@/renderer/features/history/weekly-review/components/weekly-review-spotlight-banner";
import { TodaySidebar } from "@/renderer/features/today/components/today-sidebar";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";

function getRightSidebar({
  actions,
  historyViewModel,
  state,
  tab,
}: ReadyAppController & { historyViewModel: HistoryViewModel }) {
  const handleSelectHistoryDate = historyViewModel.selectDateKey;

  if (tab === "history") {
    return (
      <HistorySidebar
        monthStats={historyViewModel.monthStats}
        nextDateKey={historyViewModel.nextDateKey}
        previousDateKey={historyViewModel.previousDateKey}
        selectedDay={historyViewModel.selectedDay}
        todayDate={state.todayState.date}
        trendPoints={historyViewModel.trendPoints}
        onSelectDate={handleSelectHistoryDate}
      />
    );
  }

  if (tab === "today") {
    return (
      <TodaySidebar
        history={state.historySummary}
        state={state.todayState}
        onMoveUnfinishedHabitsToTomorrow={
          actions.handleMoveUnfinishedHabitsToTomorrow
        }
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
        />
      </AppShell>
    </HabitCategoryPreferencesProvider>
  );
}
