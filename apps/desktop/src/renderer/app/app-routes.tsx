import { lazy, Suspense, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

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
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { HistoryPage } from "@/renderer/features/history/history-page";
import type { HistoryViewMode } from "@/renderer/features/history/history.types";
import type { HistoryViewModel } from "@/renderer/features/history/hooks/use-history-view-state";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useInsightsStore } from "@/renderer/features/insights/state/insights-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { TodayPage } from "@/renderer/features/today/today-page";
import { useWeeklyReviewStore } from "@/renderer/features/weekly-review/state/weekly-review-store";
import { WindDownPage } from "@/renderer/features/wind-down/wind-down-page";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";

const todayActions = buildTodayPageActions();
const windDownActions = buildWindDownPageActions();
const historyActions = buildHistoryPageActions();
const focusActions = buildFocusPageActions();
const settingsActions = buildSettingsPageActions();
const insightsActions = buildInsightsPageActions();

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

function TodayRoute({ state: controllerState }: ReadyAppController) {
  const todayState =
    useTodayStore((store) => store.todayState) ?? controllerState.todayState;
  const managedHabits = useTodayStore((store) => store.managedHabits);
  const history = useHistoryStore(
    useShallow((store) => ({
      hasLoadedHistorySummary: store.hasLoadedHistorySummary,
      historyDayByDate: store.historyDayByDate,
      historySummary: store.historySummary,
      isHistoryDayLoading: store.isHistoryDayLoading,
      loadingHistoryDayKey: store.loadingHistoryDayKey,
    }))
  );
  const viewModel = useMemo(
    () => ({ ...history, managedHabits, state: todayState }),
    [history, managedHabits, todayState]
  );

  return <TodayPage actions={todayActions} viewModel={viewModel} />;
}

function WindDownRoute({ state: controllerState }: ReadyAppController) {
  const todayState =
    useTodayStore((store) => store.todayState) ?? controllerState.todayState;
  const viewModel = useMemo(() => ({ state: todayState }), [todayState]);

  return <WindDownPage actions={windDownActions} viewModel={viewModel} />;
}

function HistoryRoute({
  historyMode,
  historyViewModel,
  onHistoryModeChange,
  state: controllerState,
}: ReadyAppController & {
  historyMode?: HistoryViewMode;
  historyViewModel?: HistoryViewModel;
  onHistoryModeChange?: (mode: HistoryViewMode) => void;
}) {
  const todayDate =
    useTodayStore((store) => store.todayState?.date) ??
    controllerState.todayState.date;
  const history = useHistoryStore(
    useShallow((store) => ({
      contributionHistory: store.contributionHistory,
      history: store.history,
      historyLoadError: store.historyLoadError,
      historyYears: store.historyYears,
      selectedHistoryYear: store.selectedHistoryYear,
    }))
  );
  const review = useWeeklyReviewStore(
    useShallow((store) => ({
      selectedWeeklyReview: store.selectedWeeklyReview,
      weeklyReviewError: store.weeklyReviewError,
      weeklyReviewOverview: store.weeklyReviewOverview,
      weeklyReviewPhase: store.weeklyReviewPhase,
    }))
  );
  const viewModel = useMemo(
    () => ({
      ...history,
      ...review,
      todayDate,
      ...(historyMode ? { historyMode } : {}),
      ...(onHistoryModeChange ? { onHistoryModeChange } : {}),
      ...(historyViewModel ? { viewModel: historyViewModel } : {}),
    }),
    [
      history,
      historyMode,
      historyViewModel,
      onHistoryModeChange,
      review,
      todayDate,
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
      <HistoryPage actions={historyActions} viewModel={viewModel} />
    </Suspense>
  );
}

function FocusRoute({ state: controllerState }: ReadyAppController) {
  const { date, focusQuotaGoals, settings } =
    useTodayStore((store) => store.todayState) ?? controllerState.todayState;
  const focus = useFocusStore(
    useShallow((store) => ({
      focusSaveErrorMessage: store.focusSaveErrorMessage,
      phase: store.focusSessionsPhase,
      sessions: store.focusSessions,
      sessionsLoadError: store.focusSessionsLoadError,
      timerState: store.timerState,
    }))
  );
  const settingsForm = useSettingsStore(
    useShallow((store) => ({
      fieldErrors: store.settingsFieldErrors,
      settingsDraft: store.settingsDraft,
      settingsSavePhase: store.settingsSavePhase,
    }))
  );
  const viewModel = useMemo(
    () => ({
      ...focus,
      fieldErrors: settingsForm.fieldErrors,
      focusQuotaGoals: focusQuotaGoals ?? EMPTY_FOCUS_QUOTA_GOALS,
      settings: settingsForm.settingsDraft ?? settings,
      settingsSavePhase: settingsForm.settingsSavePhase,
      todayDate: date,
    }),
    [date, focus, focusQuotaGoals, settings, settingsForm]
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
      <FocusPage actions={focusActions} viewModel={viewModel} />
    </Suspense>
  );
}

function SettingsRoute({ state: controllerState }: ReadyAppController) {
  const { focusQuotaGoals, settings } =
    useTodayStore((store) => store.todayState) ?? controllerState.todayState;
  const habits = useTodayStore((store) => store.managedHabits);
  const settingsForm = useSettingsStore(
    useShallow((store) => ({
      fieldErrors: store.settingsFieldErrors,
      saveErrorMessage: store.settingsSaveErrorMessage,
      savePhase: store.settingsSavePhase,
      settingsDraft: store.settingsDraft,
    }))
  );
  const viewModel = useMemo(
    () => ({
      fieldErrors: settingsForm.fieldErrors,
      focusQuotaGoals: focusQuotaGoals ?? EMPTY_FOCUS_QUOTA_GOALS,
      habits,
      saveErrorMessage: settingsForm.saveErrorMessage,
      savePhase: settingsForm.savePhase,
      settings: settingsForm.settingsDraft ?? settings,
    }),
    [focusQuotaGoals, habits, settings, settingsForm]
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
      <SettingsPage actions={settingsActions} viewModel={viewModel} />
    </Suspense>
  );
}

function InsightsRoute() {
  const viewModel = useInsightsStore(
    useShallow((store) => ({
      dashboard: store.dashboard,
      error: store.error,
      phase: store.phase,
      rangeDays: store.rangeDays,
    }))
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
      <InsightsPage actions={insightsActions} viewModel={viewModel} />
    </Suspense>
  );
}

export function CurrentRoute(
  controller: ReadyAppController & {
    historyMode?: HistoryViewMode;
    historyViewModel?: HistoryViewModel;
    onHistoryModeChange?: (mode: HistoryViewMode) => void;
  }
) {
  switch (controller.tab) {
    case "focus": {
      return <FocusRoute {...controller} />;
    }
    case "history": {
      return <HistoryRoute {...controller} />;
    }
    case "insights": {
      return <InsightsRoute />;
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
