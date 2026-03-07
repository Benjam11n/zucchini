import { BarChart3, CalendarDays, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { HabitCategory, HabitWithStatus } from "../shared/domain/habit";
import type { HistoryDay } from "../shared/domain/history";
import type { AppSettings, ThemeMode } from "../shared/domain/settings";
import type { TodayState } from "../shared/types/ipc";
import { HistoryPage } from "./pages/history-page";
import { SettingsPage } from "./pages/settings-page";
import { TodayPage } from "./pages/today-page";

type Tab = "today" | "history" | "settings";

interface AppState {
  todayState: TodayState | null;
  history: HistoryDay[];
  settingsDraft: AppSettings | null;
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme);
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

  async function handleUpdateSettings(settings: AppSettings): Promise<void> {
    const nextSettings = await window.habits.updateSettings(settings);

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

  async function handleCreateHabit(
    name: string,
    category: HabitCategory
  ): Promise<void> {
    await refreshToday(window.habits.createHabit(name, category));
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

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory
  ): Promise<void> {
    await refreshToday(window.habits.updateHabitCategory(habitId, category));
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

  function handleTabChange(nextTab: Tab): void {
    setTab(nextTab);

    if (nextTab !== "settings") {
      return;
    }

    setState((current) => ({
      ...current,
      settingsDraft: current.todayState?.settings ?? current.settingsDraft,
    }));
  }

  useEffect(() => {
    void reloadAll();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    const preferredTheme =
      (state.settingsDraft ?? state.todayState?.settings)?.themeMode ??
      "system";
    const resolvedTheme =
      preferredTheme === "system" ? systemTheme : preferredTheme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [state.settingsDraft, state.todayState, systemTheme]);

  if (!state.todayState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
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
        className="grid min-h-screen lg:grid-cols-[96px_1fr]"
        onValueChange={(value) => handleTabChange(value as Tab)}
        value={tab}
      >
        <aside className="border-b border-border/70 bg-card px-4 py-4 lg:border-r lg:border-b-0 lg:px-3 lg:py-6">
          <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-6">
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
              <div className="flex size-12 items-center justify-center bg-primary text-lg font-black text-primary-foreground shadow-sm">
                Z
              </div>
              <span className="text-[0.68rem] font-bold tracking-[0.24em] uppercase text-foreground/55">
                Zucchini
              </span>
            </div>

            <TabsList className="hidden flex-col gap-2 rounded-none bg-transparent p-0 lg:flex">
              <TabsTrigger
                aria-label="Today"
                className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                value="today"
              >
                <span className="sr-only">Today</span>
                <CalendarDays className="size-5" />
              </TabsTrigger>
              <TabsTrigger
                aria-label="History"
                className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                value="history"
              >
                <span className="sr-only">History</span>
                <BarChart3 className="size-5" />
              </TabsTrigger>
              <TabsTrigger
                aria-label="Settings"
                className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                value="settings"
              >
                <span className="sr-only">Settings</span>
                <Settings2 className="size-5" />
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-1 items-center gap-3 lg:hidden">
              <TabsList className="grid flex-1 grid-cols-3 rounded-2xl bg-muted/80 p-1">
                <TabsTrigger className="px-4" value="today">
                  Today
                </TabsTrigger>
                <TabsTrigger className="px-4" value="history">
                  History
                </TabsTrigger>
                <TabsTrigger className="px-4" value="settings">
                  Settings
                </TabsTrigger>
              </TabsList>

              <Card>
                <CardHeader className="px-0 py-0 text-right">
                  <CardTitle className="text-base font-black tracking-tight text-foreground">
                    Zucchini
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Keep the streak alive
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </aside>

        <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
                onUpdateHabitCategory={handleUpdateHabitCategory}
              />
            </TabsContent>
          </div>
        </section>
      </Tabs>
    </main>
  );
}
