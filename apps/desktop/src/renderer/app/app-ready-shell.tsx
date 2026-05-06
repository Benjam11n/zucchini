import type { ReadyAppController } from "@/renderer/app/app-root";
import { CurrentRoute } from "@/renderer/app/app-routes";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { WeeklyReviewSpotlightMount } from "@/renderer/app/weekly-review-spotlight-mount";
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
        onSetDayStatus={actions.handleSetDayStatus}
      />
    ) : undefined;

  return (
    <HabitCategoryPreferencesProvider
      preferences={
        (state.settingsDraft ?? state.todayState.settings).categoryPreferences
      }
    >
      <AppShell
        rightSidebar={rightSidebar}
        tab={tab}
        onTabChange={actions.handleTabChange}
      >
        <CurrentRoute {...controller} />
      </AppShell>
      <WeeklyReviewSpotlightMount {...controller} />
    </HabitCategoryPreferencesProvider>
  );
}
