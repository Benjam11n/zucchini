import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MASCOTS } from "@/renderer/lib/mascots";

import { AppShell } from "./features/app/app-shell";
import { useAppController } from "./features/app/use-app-controller";
import { HistoryPage } from "./pages/history-page";
import { SettingsPage } from "./pages/settings-page";
import { TodayPage } from "./pages/today-page";

export default function App() {
  const { actions, state, tab } = useAppController();

  if (!state.todayState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center px-6 pt-6 pb-0">
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
        habits={state.todayState.habits}
        settings={state.settingsDraft ?? state.todayState.settings}
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
