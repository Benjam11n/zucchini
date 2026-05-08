import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { WeeklyReviewSpotlightBanner } from "@/renderer/features/history/weekly-review/components/weekly-review-spotlight-banner";
import { TodaySidebar } from "@/renderer/features/today/components/today-sidebar";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";

export function AppReadyShell({
  controller,
}: {
  controller: ReadyAppController;
}) {
  const { actions, state, tab } = controller;
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
