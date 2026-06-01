import { lazy, Suspense, useMemo } from "react";

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
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";

const EMPTY_FOCUS_QUOTA_GOALS: FocusQuotaGoalWithStatus[] = [];

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
  const pageActions = useMemo(() => buildTodayPageActions(actions), [actions]);
  const viewModel = useMemo(
    () => ({
      hasLoadedHistorySummary: state.hasLoadedHistorySummary,
      historyDayByDate: state.historyDayByDate,
      historySummary: state.historySummary,
      isHistoryDayLoading: state.isHistoryDayLoading,
      loadingHistoryDayKey: state.loadingHistoryDayKey,
      managedHabits: state.managedHabits,
      state: state.todayState,
    }),
    [
      state.hasLoadedHistorySummary,
      state.historyDayByDate,
      state.historySummary,
      state.isHistoryDayLoading,
      state.loadingHistoryDayKey,
      state.managedHabits,
      state.todayState,
    ]
  );

  return <TodayPage actions={pageActions} viewModel={viewModel} />;
}

function WindDownRoute({ actions, state }: ReadyAppController) {
  const pageActions = useMemo(
    () => buildWindDownPageActions(actions),
    [actions]
  );
  const viewModel = useMemo(
    () => ({
      state: state.todayState,
    }),
    [state.todayState]
  );

  return <WindDownPage actions={pageActions} viewModel={viewModel} />;
}

function HistoryRoute({
  actions,
  historyViewModel,
  state,
}: ReadyAppController & { historyViewModel?: HistoryViewModel }) {
  const pageActions = useMemo(
    () => buildHistoryPageActions(actions),
    [actions]
  );
  const viewModel = useMemo(
    () => ({
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
    }),
    [
      historyViewModel,
      state.contributionHistory,
      state.history,
      state.historyLoadError,
      state.historyYears,
      state.selectedHistoryYear,
      state.selectedWeeklyReview,
      state.todayState.date,
      state.weeklyReviewError,
      state.weeklyReviewOverview,
      state.weeklyReviewPhase,
    ]
  );

  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading history and weekly review charts."
          title="Loading history"
        />
      }
    >
      <HistoryPage actions={pageActions} viewModel={viewModel} />
    </Suspense>
  );
}

function FocusRoute({ actions, state }: ReadyAppController) {
  const pageActions = useMemo(() => buildFocusPageActions(actions), [actions]);
  const viewModel = useMemo(
    () => ({
      fieldErrors: state.settingsFieldErrors,
      focusQuotaGoals:
        state.todayState.focusQuotaGoals ?? EMPTY_FOCUS_QUOTA_GOALS,
      focusSaveErrorMessage: state.focusSaveErrorMessage,
      phase: state.focusSessionsPhase,
      sessions: state.focusSessions,
      sessionsLoadError: state.focusSessionsLoadError,
      settings: state.settingsDraft ?? state.todayState.settings,
      settingsSavePhase: state.settingsSavePhase,
      timerState: state.timerState,
      todayDate: state.todayState.date,
    }),
    [
      state.focusSaveErrorMessage,
      state.focusSessions,
      state.focusSessionsLoadError,
      state.focusSessionsPhase,
      state.settingsDraft,
      state.settingsFieldErrors,
      state.settingsSavePhase,
      state.timerState,
      state.todayState.date,
      state.todayState.focusQuotaGoals,
      state.todayState.settings,
    ]
  );

  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading your focus timer and recent sessions."
          title="Loading focus"
        />
      }
    >
      <FocusPage actions={pageActions} viewModel={viewModel} />
    </Suspense>
  );
}

function SettingsRoute({ actions, state }: ReadyAppController) {
  const pageActions = useMemo(
    () => buildSettingsPageActions(actions),
    [actions]
  );
  const viewModel = useMemo(
    () => ({
      fieldErrors: state.settingsFieldErrors,
      focusQuotaGoals:
        state.todayState.focusQuotaGoals ?? EMPTY_FOCUS_QUOTA_GOALS,
      habits: state.managedHabits,
      saveErrorMessage: state.settingsSaveErrorMessage,
      savePhase: state.settingsSavePhase,
      settings: state.settingsDraft ?? state.todayState.settings,
    }),
    [
      state.managedHabits,
      state.settingsDraft,
      state.settingsFieldErrors,
      state.settingsSaveErrorMessage,
      state.settingsSavePhase,
      state.todayState.focusQuotaGoals,
      state.todayState.settings,
    ]
  );

  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading settings and habit management tools."
          title="Loading settings"
        />
      }
    >
      <SettingsPage actions={pageActions} viewModel={viewModel} />
    </Suspense>
  );
}

function InsightsRoute({ actions, state }: ReadyAppController) {
  const pageActions = useMemo(
    () => buildInsightsPageActions(actions),
    [actions]
  );
  const viewModel = useMemo(
    () => ({
      dashboard: state.insightsDashboard,
      error: state.insightsError,
      phase: state.insightsPhase,
      rangeDays: state.insightsRangeDays,
    }),
    [
      state.insightsDashboard,
      state.insightsError,
      state.insightsPhase,
      state.insightsRangeDays,
    ]
  );

  return (
    <Suspense
      fallback={
        <LoadingStateCard
          description="Loading your habit and focus insights."
          title="Loading insights"
        />
      }
    >
      <InsightsPage actions={pageActions} viewModel={viewModel} />
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
