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
import { WeeklyReviewSpotlightDialog } from "@/renderer/features/history/weekly-review-spotlight-dialog";
import { MASCOTS } from "@/renderer/lib/mascots";
import { HistoryPage } from "@/renderer/pages/history-page";
import { SettingsPage } from "@/renderer/pages/settings-page";
import { TodayPage } from "@/renderer/pages/today-page";

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

  let renderedPage = (
    <TodayPage
      history={state.history}
      state={state.todayState}
      onToggleHabit={actions.handleToggleHabit}
    />
  );

  if (tab === "history") {
    renderedPage = (
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
    );
  }

  if (tab === "settings") {
    renderedPage = (
      <SettingsPage
        fieldErrors={state.settingsFieldErrors}
        habits={state.todayState.habits}
        settings={state.settingsDraft ?? state.todayState.settings}
        saveErrorMessage={state.settingsSaveErrorMessage}
        savePhase={state.settingsSavePhase}
        onArchiveHabit={actions.handleArchiveHabit}
        onChange={actions.handleSettingsDraftChange}
        onCreateHabit={actions.handleCreateHabit}
        onRenameHabit={actions.handleRenameHabit}
        onReorderHabits={actions.handleReorderHabits}
        onUpdateHabitCategory={actions.handleUpdateHabitCategory}
        onUpdateHabitFrequency={actions.handleUpdateHabitFrequency}
      />
    );
  }

  return (
    <>
      <AppShell tab={tab} onTabChange={actions.handleTabChange}>
        {renderedPage}
      </AppShell>
      {state.isWeeklyReviewSpotlightOpen &&
      state.weeklyReviewOverview?.latestReview ? (
        <WeeklyReviewSpotlightDialog
          onDismiss={actions.handleDismissWeeklyReviewSpotlight}
          onOpenReview={() => {
            void actions.handleWeeklyReviewOpen();
          }}
          open={state.isWeeklyReviewSpotlightOpen}
          review={state.weeklyReviewOverview.latestReview}
          trend={state.weeklyReviewOverview.trend}
        />
      ) : null}
    </>
  );
}
