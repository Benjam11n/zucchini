import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AppShell } from "@/renderer/features/app/app-shell";
import { useAppController } from "@/renderer/features/app/use-app-controller";
import { MASCOTS } from "@/renderer/lib/mascots";
import { HistoryPage } from "@/renderer/pages/history-page";
import { SettingsPage } from "@/renderer/pages/settings-page";
import { TodayPage } from "@/renderer/pages/today-page";

export default function App() {
  const { actions, state, tab } = useAppController();

  if (!state.todayState) {
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

  let renderedPage = (
    <TodayPage
      state={state.todayState}
      onToggleHabit={actions.handleToggleHabit}
    />
  );

  if (tab === "history") {
    renderedPage = <HistoryPage history={state.history} />;
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
    <AppShell tab={tab} onTabChange={actions.handleTabChange}>
      {renderedPage}
    </AppShell>
  );
}
