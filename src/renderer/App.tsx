import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { HabitWithStatus } from "../shared/domain/habit";
import type { ReminderSettings } from "../shared/domain/settings";
import type { DailySummary } from "../shared/domain/streak";
import type { TodayState } from "../shared/types/ipc";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayPage } from "./pages/TodayPage";

type Tab = "today" | "history" | "settings";

interface AppState {
  todayState: TodayState | null;
  history: DailySummary[];
  settingsDraft: ReminderSettings | null;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [state, setState] = useState<AppState>({
    history: [],
    settingsDraft: null,
    todayState: null,
  });

  async function reloadAll(nextTodayState?: TodayState): Promise<void> {
    const todayState = nextTodayState ?? (await window.habits.getTodayState());
    const history = await window.habits.getHistory();

    setState((current) => ({
      history,
      settingsDraft: current.settingsDraft ?? todayState.settings,
      todayState,
    }));
  }

  async function refreshToday(mutator: Promise<TodayState>): Promise<void> {
    const nextTodayState = await mutator;
    await reloadAll(nextTodayState);
  }

  async function handleToggleHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.toggleHabit(habitId));
  }

  async function handleUpdateSettings(
    settings: ReminderSettings
  ): Promise<void> {
    const nextSettings = await window.habits.updateReminderSettings(settings);

    setState((current) => ({
      history: current.history,
      settingsDraft: nextSettings,
      todayState: current.todayState
        ? {
            ...current.todayState,
            settings: nextSettings,
          }
        : current.todayState,
    }));
  }

  async function handleCreateHabit(name: string): Promise<void> {
    await refreshToday(window.habits.createHabit(name));
    setState((current) => ({
      ...current,
      settingsDraft: current.todayState?.settings ?? current.settingsDraft,
    }));
  }

  async function handleRenameHabit(
    habitId: number,
    name: string
  ): Promise<void> {
    await refreshToday(window.habits.renameHabit(habitId, name));
  }

  async function handleArchiveHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.archiveHabit(habitId));
  }

  async function handleReorderHabits(
    nextHabits: HabitWithStatus[]
  ): Promise<void> {
    await refreshToday(
      window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
    );
  }

  useEffect(() => {
    void reloadAll();
  }, []);

  if (!state.todayState) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>
              Preparing your local habit dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Tabs
        className="grid min-h-screen lg:grid-cols-[280px_1fr]"
        onValueChange={(value) => {
          const nextTab = value as Tab;
          setTab(nextTab);

          if (nextTab === "settings") {
            setState((current) => ({
              ...current,
              settingsDraft:
                current.todayState?.settings ?? current.settingsDraft,
            }));
          }
        }}
        value={tab}
      >
        <aside className="border-b px-4 py-4 lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-medium tracking-[0.24em] uppercase">
                Habit tracker
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Zucchini
              </CardTitle>
              <CardDescription className="max-w-xs text-sm leading-6">
                Local-first daily streaks with freezes, reminders, and history.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button
                className={cn("justify-start", tab === "today" && "shadow-sm")}
                onClick={() => setTab("today")}
                type="button"
                variant={tab === "today" ? "default" : "ghost"}
              >
                Today
              </Button>
              <Button
                className={cn(
                  "justify-start",
                  tab === "history" && "shadow-sm"
                )}
                onClick={() => setTab("history")}
                type="button"
                variant={tab === "history" ? "default" : "ghost"}
              >
                History
              </Button>
              <Button
                className={cn(
                  "justify-start",
                  tab === "settings" && "shadow-sm"
                )}
                onClick={() => {
                  setTab("settings");
                  setState((current) => ({
                    ...current,
                    settingsDraft:
                      current.todayState?.settings ?? current.settingsDraft,
                  }));
                }}
                type="button"
                variant={tab === "settings" ? "default" : "ghost"}
              >
                Settings
              </Button>
            </CardContent>
          </Card>
        </aside>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <TabsContent className="mt-0" value="today">
              <TodayPage
                state={state.todayState}
                onToggleHabit={handleToggleHabit}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="history">
              <HistoryPage history={state.history} />
            </TabsContent>
            <TabsContent className="mt-0" value="settings">
              <SettingsPage
                habits={state.todayState.habits}
                settings={state.settingsDraft ?? state.todayState.settings}
                onArchiveHabit={handleArchiveHabit}
                onChange={(settingsDraft) =>
                  setState((current) => ({
                    ...current,
                    settingsDraft,
                  }))
                }
                onCreateHabit={handleCreateHabit}
                onRenameHabit={handleRenameHabit}
                onReorderHabits={handleReorderHabits}
                onSave={handleUpdateSettings}
              />
            </TabsContent>
          </div>
        </section>
      </Tabs>
    </main>
  );
}
