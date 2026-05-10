import { lazy, Suspense } from "react";

import type { ReadyAppController } from "@/renderer/app/app-root";
import { LoadingStateCard } from "@/renderer/app/loading-state-card";
import { HistoryPage } from "@/renderer/features/history/history-page";
import type { HistoryViewModel } from "@/renderer/features/history/use-history-view-state";
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
      hasLoadedHistorySummary={state.hasLoadedHistorySummary}
      historySummary={state.historySummary}
      managedHabits={state.managedHabits}
      onArchiveHabit={actions.handleArchiveHabit}
      onCreateHabit={actions.handleCreateHabit}
      onDecrementHabitProgress={actions.handleDecrementHabitProgress}
      onIncrementHabitProgress={actions.handleIncrementHabitProgress}
      onRenameHabit={actions.handleRenameHabit}
      onReorderHabits={actions.handleReorderHabits}
      onUnarchiveHabit={actions.handleUnarchiveHabit}
      state={state.todayState}
      onToggleHabitCarryover={actions.handleToggleHabitCarryover}
      onToggleHabit={actions.handleToggleHabit}
      onUpdateHabitCategory={actions.handleUpdateHabitCategory}
      onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
      onUpdateHabitTargetCount={actions.handleUpdateHabitTargetCount}
      onUpdateHabitWeekdays={actions.handleUpdateHabitWeekdays}
    />
  );
}

function WindDownRoute({ actions, state }: ReadyAppController) {
  return (
    <WindDownPage
      onCreateAction={actions.handleCreateWindDownAction}
      onDeleteAction={actions.handleDeleteWindDownAction}
      onRenameAction={actions.handleRenameWindDownAction}
      onToggleAction={actions.handleToggleWindDownAction}
      state={state.todayState}
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
        history={state.history}
        contributionHistory={state.contributionHistory}
        historyYears={state.historyYears}
        historyLoadError={state.historyLoadError}
        onLoadWeeklyReviewOverview={actions.handleLoadWeeklyReviewOverview}
        onLoadHistoryYears={actions.handleLoadHistoryYears}
        onNavigateToToday={() => actions.handleTabChange("today")}
        onSelectHistoryMonth={actions.handleSelectHistoryMonth}
        todayDate={state.todayState.date}
        selectedHistoryYear={state.selectedHistoryYear}
        onSelectWeeklyReview={actions.handleWeeklyReviewSelect}
        selectedWeeklyReview={state.selectedWeeklyReview}
        weeklyReviewError={state.weeklyReviewError}
        weeklyReviewOverview={state.weeklyReviewOverview}
        weeklyReviewPhase={state.weeklyReviewPhase}
        {...(historyViewModel ? { viewModel: historyViewModel } : {})}
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
        fieldErrors={state.settingsFieldErrors}
        focusSaveErrorMessage={state.focusSaveErrorMessage}
        focusQuotaGoals={state.todayState.focusQuotaGoals ?? []}
        phase={state.focusSessionsPhase}
        sessions={state.focusSessions}
        sessionsLoadError={state.focusSessionsLoadError}
        settings={state.settingsDraft ?? state.todayState.settings}
        settingsSavePhase={state.settingsSavePhase}
        timerState={state.timerState}
        todayDate={state.todayState.date}
        onArchiveFocusQuotaGoal={actions.handleArchiveFocusQuotaGoal}
        onChangeSettings={actions.handleSettingsDraftChange}
        onShowWidget={actions.handleShowFocusWidget}
        onUpsertFocusQuotaGoal={actions.handleUpsertFocusQuotaGoal}
        onRetryLoad={actions.handleRetryFocusLoad}
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
        fieldErrors={state.settingsFieldErrors}
        focusQuotaGoals={state.todayState.focusQuotaGoals ?? []}
        habits={state.managedHabits}
        settings={state.settingsDraft ?? state.todayState.settings}
        saveErrorMessage={state.settingsSaveErrorMessage}
        savePhase={state.settingsSavePhase}
        onArchiveHabit={actions.handleArchiveHabit}
        onArchiveFocusQuotaGoal={actions.handleArchiveFocusQuotaGoal}
        onChange={actions.handleSettingsDraftChange}
        onCreateHabit={actions.handleCreateHabit}
        onOpenWindDown={actions.handleOpenWindDown}
        onRenameHabit={actions.handleRenameHabit}
        onReorderHabits={actions.handleReorderHabits}
        onUpsertFocusQuotaGoal={actions.handleUpsertFocusQuotaGoal}
        onUnarchiveHabit={actions.handleUnarchiveHabit}
        onUnarchiveFocusQuotaGoal={actions.handleUnarchiveFocusQuotaGoal}
        onUpdateHabitCategory={actions.handleUpdateHabitCategory}
        onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
        onUpdateHabitTargetCount={actions.handleUpdateHabitTargetCount}
        onUpdateHabitWeekdays={actions.handleUpdateHabitWeekdays}
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
        dashboard={state.insightsDashboard}
        error={state.insightsError}
        phase={state.insightsPhase}
        onRetryLoad={actions.handleRetryInsightsLoad}
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
