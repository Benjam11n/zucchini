import { lazy, Suspense } from "react";

import type { ReadyAppController } from "@/renderer/app/app-root";
import { LoadingStateCard } from "@/renderer/app/loading-state-card";
import {
  buildFocusPageActions,
  buildHistoryPageActions,
  buildInsightsPageActions,
  buildSettingsPageActions,
  buildTodayPageActions,
  buildWindDownPageActions,
} from "@/renderer/app/route-page-props";
import { HistoryPage } from "@/renderer/features/history/history-page";
import type { HistoryViewModel } from "@/renderer/features/history/hooks/use-history-view-state";
import { TodayPage } from "@/renderer/features/today/today-page";
import { WindDownPage } from "@/renderer/features/wind-down/wind-down-page";

const FocusPage = lazy(async () => {
  const module = await import("@/renderer/features/focus/focus-page");

  return { default: module.FocusPage };
});
const SettingsPage = lazy(async () => {
  const module = await import("@/renderer/features/settings/settings-page");

  return { default: module.SettingsPage };
});
const InsightsPage = lazy(async () => {
  const module = await import("@/renderer/features/insights/insights-page");

  return { default: module.InsightsPage };
});

function TodayRoute({ actions, state }: ReadyAppController) {
  return (
    <TodayPage
      actions={buildTodayPageActions(actions)}
      viewModel={{
        hasLoadedHistorySummary: state.hasLoadedHistorySummary,
        historySummary: state.historySummary,
        managedHabits: state.managedHabits,
        state: state.todayState,
      }}
    />
  );
}

function WindDownRoute({ actions, state }: ReadyAppController) {
  return (
    <WindDownPage
      actions={buildWindDownPageActions(actions)}
      viewModel={{ state: state.todayState }}
    />
  );
}

function HistoryRoute({
  actions,
  historyViewModel,
  state,
}: ReadyAppController & { historyViewModel?: HistoryViewModel }) {
  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading history and weekly review charts."
          title="Loading history"
        />
      }
    >
      <HistoryPage
        actions={buildHistoryPageActions(actions)}
        viewModel={{
          contributionHistory: state.contributionHistory,
          history: state.history,
          historyLoadError: state.historyLoadError,
          historyYears: state.historyYears,
          selectedHistoryYear: state.selectedHistoryYear,
          selectedWeeklyReview: state.selectedWeeklyReview,
          todayDate: state.todayState.date,
          weeklyReviewError: state.weeklyReviewError,
          weeklyReviewOverview: state.weeklyReviewOverview,
          weeklyReviewPhase: state.weeklyReviewPhase,
          ...(historyViewModel ? { viewModel: historyViewModel } : {}),
        }}
      />
    </Suspense>
  );
}

function FocusRoute({ actions, state }: ReadyAppController) {
  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading your focus timer and recent sessions."
          title="Loading focus"
        />
      }
    >
      <FocusPage
        actions={buildFocusPageActions(actions)}
        viewModel={{
          fieldErrors: state.settingsFieldErrors,
          focusQuotaGoals: state.todayState.focusQuotaGoals ?? [],
          focusSaveErrorMessage: state.focusSaveErrorMessage,
          phase: state.focusSessionsPhase,
          sessions: state.focusSessions,
          sessionsLoadError: state.focusSessionsLoadError,
          settings: state.settingsDraft ?? state.todayState.settings,
          settingsSavePhase: state.settingsSavePhase,
          timerState: state.timerState,
          todayDate: state.todayState.date,
        }}
      />
    </Suspense>
  );
}

function SettingsRoute({ actions, state }: ReadyAppController) {
  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading settings and habit management tools."
          title="Loading settings"
        />
      }
    >
      <SettingsPage
        actions={buildSettingsPageActions(actions)}
        viewModel={{
          fieldErrors: state.settingsFieldErrors,
          focusQuotaGoals: state.todayState.focusQuotaGoals ?? [],
          habits: state.managedHabits,
          saveErrorMessage: state.settingsSaveErrorMessage,
          savePhase: state.settingsSavePhase,
          settings: state.settingsDraft ?? state.todayState.settings,
        }}
      />
    </Suspense>
  );
}

function InsightsRoute({ actions, state }: ReadyAppController) {
  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading your habit and focus insights."
          title="Loading insights"
        />
      }
    >
      <InsightsPage
        actions={buildInsightsPageActions(actions)}
        viewModel={{
          dashboard: state.insightsDashboard,
          error: state.insightsError,
          phase: state.insightsPhase,
          rangeDays: state.insightsRangeDays,
        }}
      />
    </Suspense>
  );
}

export function CurrentRoute(
  controller: ReadyAppController & { historyViewModel?: HistoryViewModel }
) {
  switch (controller.tab) {
    case "focus": {
      return <FocusRoute {...controller} />;
    }
    case "history": {
      return <HistoryRoute {...controller} />;
    }
    case "insights": {
      return <InsightsRoute {...controller} />;
    }
    case "settings": {
      return <SettingsRoute {...controller} />;
    }
    case "windDown": {
      return <WindDownRoute {...controller} />;
    }
    default: {
      return <TodayRoute {...controller} />;
    }
  }
}
