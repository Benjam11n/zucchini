import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AppShell } from "@/renderer/features/app/app-shell";
import { getBootErrorDisplay } from "@/renderer/features/app/boot-errors";
import { useAppController } from "@/renderer/features/app/use-app-controller";
import { MASCOTS } from "@/renderer/lib/mascots";
import { TodayPage } from "@/renderer/pages/today-page";

const HistoryPage = lazy(async () => {
  const module = await import("@/renderer/pages/history-page");

  return { default: module.HistoryPage };
});
const SettingsPage = lazy(async () => {
  const module = await import("@/renderer/pages/settings-page");

  return { default: module.SettingsPage };
});
const OnboardingTakeover = lazy(async () => {
  const module =
    await import("@/renderer/features/onboarding/onboarding-takeover");

  return { default: module.OnboardingTakeover };
});
const WeeklyReviewSpotlightDialog = lazy(async () => {
  const module =
    await import("@/renderer/features/history/weekly-review-spotlight-dialog");

  return { default: module.WeeklyReviewSpotlightDialog };
});

function DeferredPageFallback({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div
      aria-busy="true"
      className="flex min-h-[320px] items-center justify-center px-6 py-10 text-foreground"
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 pt-8 pb-0">
          <Spinner className="size-8 text-primary/60" />
        </CardContent>
        <CardHeader className="items-center text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function App() {
  const { actions, state, tab } = useAppController();

  if (state.bootPhase === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
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
            <CardTitle>Loading</CardTitle>
            <CardDescription>
              Preparing your local habit dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
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
          <DeferredPageFallback
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
    renderedPage = (
      <Suspense
        fallback={
          <DeferredPageFallback
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

  if (tab === "settings") {
    renderedPage = (
      <Suspense
        fallback={
          <DeferredPageFallback
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
