import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { HistorySidebar } from "@/renderer/features/history/components/history-sidebar";
import { useHistoryViewState } from "@/renderer/features/history/use-history-view-state";
import { WeeklyReviewSpotlightBanner } from "@/renderer/features/history/weekly-review/components/weekly-review-spotlight-banner";
import { TodaySidebar } from "@/renderer/features/today/components/today-sidebar";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";

function HistoryReadyShell({ controller }: { controller: ReadyAppController }) {
  const { actions, state, tab } = controller;
  const historyViewModel = useHistoryViewState({
    history: state.history,
    historyYears: state.historyYears,
    selectedHistoryYear: state.selectedHistoryYear,
    todayDate: state.todayState.date,
  });
  const handleSelectHistoryDate = historyViewModel.selectDateKey;
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
    <AppShell
      rightSidebar={
        <HistorySidebar
          monthStats={historyViewModel.monthStats}
          nextDateKey={historyViewModel.nextDateKey}
          previousDateKey={historyViewModel.previousDateKey}
          selectedDay={historyViewModel.selectedDay}
          todayDate={state.todayState.date}
          trendPoints={historyViewModel.trendPoints}
          onSelectDate={handleSelectHistoryDate}
        />
      }
      tab={tab}
      topBanner={weeklyReviewBanner}
      onTabChange={actions.handleTabChange}
    >
      <CurrentRoute {...controller} historyViewModel={historyViewModel} />
    </AppShell>
  );
}

export function AppReadyShell({
  controller,
}: {
  controller: ReadyAppController;
}) {
  const { actions, state, tab } = controller;
  if (tab === "history") {
    return (
      <HabitCategoryPreferencesProvider
        preferences={
          (state.settingsDraft ?? state.todayState.settings).categoryPreferences
        }
      >
        <HistoryReadyShell controller={controller} />
      </HabitCategoryPreferencesProvider>
    );
  }

  const rightSidebar =
    tab === "today" ? (
      <TodaySidebar
        history={state.history}
        state={state.todayState}
        onMoveUnfinishedHabitsToTomorrow={
          actions.handleMoveUnfinishedHabitsToTomorrow
        }
        onSetDayStatus={actions.handleSetDayStatus}
      />
    ) : undefined;
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
        <CurrentRoute {...controller} />
      </AppShell>
    </HabitCategoryPreferencesProvider>
  );
}
