/**
 * Top-level React application composition.
 *
 * This file decides which major screen to show, lazy-loads heavier tabs, and
 * turns controller state into the app shell plus loading or error states.
 */
import { lazy, Suspense } from "react";

import { AppErrorBoundary } from "@/renderer/app/app-error-boundary";
import { getBootErrorDisplay } from "@/renderer/app/boot/boot-errors";
import { useAppController } from "@/renderer/app/controller/use-app-controller";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { MASCOTS } from "@/renderer/assets/mascots";
import { TodayPage } from "@/renderer/features/today/today-page";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Toaster } from "@/renderer/shared/components/ui/sonner";
import { Spinner } from "@/renderer/shared/components/ui/spinner";
import { HabitCategoryPreferencesProvider } from "@/renderer/shared/lib/habit-category-presentation";

const FocusWidget = lazy(async () => {
  const module =
    await import("@/renderer/features/focus/components/focus-widget");

  return { default: module.FocusWidget };
});
const HistoryPage = lazy(async () => {
  const module = await import("@/renderer/features/history/history-page");

  return { default: module.HistoryPage };
});
const FocusPage = lazy(async () => {
  const module = await import("@/renderer/features/focus/focus-page");

  return { default: module.FocusPage };
});
const SettingsPage = lazy(async () => {
  const module = await import("@/renderer/features/settings/settings-page");

  return { default: module.SettingsPage };
});
const WeeklyReviewSpotlightDialog = lazy(async () => {
  const module =
    await import("@/renderer/features/history/weekly-review/components/weekly-review-spotlight-dialog");

  return { default: module.WeeklyReviewSpotlightDialog };
});

function LoadingStateCard({
  description,
  fullscreen = false,
  title,
}: {
  description: string;
  fullscreen?: boolean;
  title: string;
}) {
  return (
    <div
      aria-busy="true"
      className={
        fullscreen
          ? "flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
          : "flex min-h-[320px] items-center justify-center px-6 py-10 text-foreground"
      }
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-6 px-6 pt-10 pb-0">
          <Spinner className="size-8 text-primary/60" />
          <img
            alt="Loading Zucchini mascot"
            className="size-28 object-contain"
            src={MASCOTS.loading}
          />
        </CardContent>
        <CardHeader className="items-center text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function MainApp() {
  const { actions, state, tab } = useAppController();

  if (state.bootPhase === "loading") {
    return (
      <LoadingStateCard
        description="Preparing your local habit dashboard."
        fullscreen
        title="Loading"
      />
    );
  }

  if (state.bootPhase === "error") {
    const errorDisplay = getBootErrorDisplay(state.bootError);

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center gap-6 px-6 pt-10 pb-0">
            <img
              alt="Sad Zucchini mascot"
              className="size-28 object-contain"
              src={MASCOTS.sad}
            />
          </CardContent>
          <CardHeader className="items-center text-center">
            <CardTitle>{errorDisplay.title}</CardTitle>
            <CardDescription>{errorDisplay.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-6">
            <Button className="w-full" onClick={actions.handleRetryBoot}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!state.todayState) {
    return null;
  }

  let renderedPage = (
    <TodayPage
      history={state.history}
      managedHabits={state.managedHabits}
      onArchiveHabit={actions.handleArchiveHabit}
      onCreateHabit={actions.handleCreateHabit}
      onDecrementHabitProgress={actions.handleDecrementHabitProgress}
      onIncrementHabitProgress={actions.handleIncrementHabitProgress}
      onRenameHabit={actions.handleRenameHabit}
      onReorderHabits={actions.handleReorderHabits}
      onUnarchiveHabit={actions.handleUnarchiveHabit}
      state={state.todayState}
      onToggleHabit={actions.handleToggleHabit}
      onUpdateHabitCategory={actions.handleUpdateHabitCategory}
      onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
      onUpdateHabitTargetCount={actions.handleUpdateHabitTargetCount}
      onUpdateHabitWeekdays={actions.handleUpdateHabitWeekdays}
    />
  );

  if (tab === "history") {
    renderedPage = (
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
          historyLoadError={state.historyLoadError}
          historyScope={state.historyScope}
          isHistoryLoading={state.isHistoryLoading}
          onLoadOlderHistory={actions.handleLoadOlderHistory}
          onNavigateToToday={() => actions.handleTabChange("today")}
          todayDate={state.todayState.date}
          onSelectWeeklyReview={actions.handleWeeklyReviewSelect}
          selectedWeeklyReview={state.selectedWeeklyReview}
          weeklyReviewError={state.weeklyReviewError}
          weeklyReviewOverview={state.weeklyReviewOverview}
          weeklyReviewPhase={state.weeklyReviewPhase}
        />
      </Suspense>
    );
  }

  if (tab === "focus") {
    renderedPage = (
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

  if (tab === "settings") {
    renderedPage = (
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
          onRenameHabit={actions.handleRenameHabit}
          onReorderHabits={actions.handleReorderHabits}
          onUpsertFocusQuotaGoal={actions.handleUpsertFocusQuotaGoal}
          onUnarchiveHabit={actions.handleUnarchiveHabit}
          onUpdateHabitCategory={actions.handleUpdateHabitCategory}
          onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
          onUpdateHabitTargetCount={actions.handleUpdateHabitTargetCount}
          onUpdateHabitWeekdays={actions.handleUpdateHabitWeekdays}
        />
      </Suspense>
    );
  }

  return (
    <HabitCategoryPreferencesProvider
      preferences={
        (state.settingsDraft ?? state.todayState.settings).categoryPreferences
      }
    >
      <>
        <AppShell tab={tab} onTabChange={actions.handleTabChange}>
          {renderedPage}
        </AppShell>
        {state.isWeeklyReviewSpotlightOpen &&
        state.weeklyReviewOverview?.latestReview ? (
          <Suspense fallback={null}>
            <WeeklyReviewSpotlightDialog
              onDismiss={actions.handleDismissWeeklyReviewSpotlight}
              onOpenReview={actions.handleWeeklyReviewOpen}
              open={state.isWeeklyReviewSpotlightOpen}
              review={state.weeklyReviewOverview.latestReview}
            />
          </Suspense>
        ) : null}
      </>
    </HabitCategoryPreferencesProvider>
  );
}

export default function App() {
  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "widget") {
    return (
      <AppErrorBoundary
        description="The focus widget hit an unexpected error. Reload Zucchini to continue your session."
        title="Widget error"
      >
        <Suspense
          fallback={<div className="h-screen w-screen bg-transparent" />}
        >
          <FocusWidget />
        </Suspense>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary
      description="The app hit an unexpected error. Reload Zucchini to continue."
      title="Unexpected app error"
    >
      <>
        <MainApp />
        <Toaster />
      </>
    </AppErrorBoundary>
  );
}
