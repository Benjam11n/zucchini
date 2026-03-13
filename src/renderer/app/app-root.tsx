/**
 * Top-level React application composition.
 *
 * This file decides which major screen to show, lazy-loads heavier tabs, and
 * turns controller state into the app shell, onboarding takeover, and loading
 * or error states.
 */
import { lazy, Suspense } from "react";

import { useAppController } from "@/renderer/app/controller/use-app-controller";
import { getBootErrorDisplay } from "@/renderer/app/lib/boot-errors";
import { AppShell } from "@/renderer/app/shell/app-shell";
import { TodayPage } from "@/renderer/features/today/today-page";
import { MASCOTS } from "@/renderer/shared/assets/mascots";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import { Spinner } from "@/renderer/shared/ui/spinner";

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
const OnboardingTakeover = lazy(async () => {
  const module =
    await import("@/renderer/features/onboarding/onboarding-takeover");

  return { default: module.OnboardingTakeover };
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
            <Button
              className="w-full"
              onClick={() => {
                void actions.handleRetryBoot();
              }}
            >
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

  if (state.isOnboardingOpen) {
    return (
      <Suspense
        fallback={
          <LoadingStateCard
            description="Preparing your onboarding flow."
            title="Loading setup"
          />
        }
      >
        <OnboardingTakeover
          baseSettings={state.todayState.settings}
          error={state.onboardingError}
          phase={state.onboardingPhase}
          onComplete={actions.handleCompleteOnboarding}
          onSkip={actions.handleSkipOnboarding}
        />
      </Suspense>
    );
  }

  let renderedPage = (
    <TodayPage
      history={state.history}
      state={state.todayState}
      onToggleHabit={actions.handleToggleHabit}
    />
  );

  if (tab === "history") {
    if (state.isHistoryLoading && state.historyScope !== "full") {
      renderedPage = (
        <LoadingStateCard
          description="Loading your full history timeline."
          title="Loading history"
        />
      );
    } else if (state.historyLoadError && state.historyScope !== "full") {
      renderedPage = (
        <div className="flex min-h-[320px] items-center justify-center bg-background px-6 text-foreground">
          <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
              <CardTitle>Could not load history</CardTitle>
              <CardDescription>
                {state.historyLoadError.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <Button
                className="w-full"
                onClick={() => {
                  void actions.handleRetryHistoryLoad();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    } else {
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
            todayDate={state.todayState.date}
            onSelectWeeklyReview={(weekStart) => {
              void actions.handleWeeklyReviewSelect(weekStart);
            }}
            selectedWeeklyReview={state.selectedWeeklyReview}
            weeklyReviewError={state.weeklyReviewError}
            weeklyReviewOverview={state.weeklyReviewOverview}
            weeklyReviewPhase={state.weeklyReviewPhase}
          />
        </Suspense>
      );
    }
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
          phase={state.focusSessionsPhase}
          sessions={state.focusSessions}
          sessionsLoadError={state.focusSessionsLoadError}
          settings={state.settingsDraft ?? state.todayState.settings}
          settingsSavePhase={state.settingsSavePhase}
          timerState={state.timerState}
          todayDate={state.todayState.date}
          onChangeSettings={actions.handleSettingsDraftChange}
          onShowWidget={actions.handleShowFocusWidget}
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
          habits={state.todayState.habits}
          settings={state.settingsDraft ?? state.todayState.settings}
          saveErrorMessage={state.settingsSaveErrorMessage}
          savePhase={state.settingsSavePhase}
          onArchiveHabit={actions.handleArchiveHabit}
          onApplyStarterPack={actions.handleApplyStarterPack}
          onChange={actions.handleSettingsDraftChange}
          onCreateHabit={actions.handleCreateHabit}
          onRenameHabit={actions.handleRenameHabit}
          onReorderHabits={actions.handleReorderHabits}
          onUpdateHabitCategory={actions.handleUpdateHabitCategory}
          onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
        />
      </Suspense>
    );
  }

  return (
    <>
      <AppShell tab={tab} onTabChange={actions.handleTabChange}>
        {renderedPage}
      </AppShell>
      {state.isWeeklyReviewSpotlightOpen &&
      state.weeklyReviewOverview?.latestReview ? (
        <Suspense fallback={null}>
          <WeeklyReviewSpotlightDialog
            onDismiss={actions.handleDismissWeeklyReviewSpotlight}
            onOpenReview={() => {
              void actions.handleWeeklyReviewOpen();
            }}
            open={state.isWeeklyReviewSpotlightOpen}
            review={state.weeklyReviewOverview.latestReview}
            trend={state.weeklyReviewOverview.trend}
          />
        </Suspense>
      ) : null}
    </>
  );
}

export default function App() {
  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "widget") {
    return (
      <Suspense
        fallback={
          <LoadingStateCard
            description="Preparing your focus widget."
            fullscreen
            title="Loading widget"
          />
        }
      >
        <FocusWidget />
      </Suspense>
    );
  }

  return <MainApp />;
}
