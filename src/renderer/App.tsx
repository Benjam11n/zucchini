import { useEffect, useState } from "react";
import type { HabitWithStatus } from "../shared/domain/habit";
import type { ReminderSettings } from "../shared/domain/settings";
import type { DailySummary } from "../shared/domain/streak";
import type { TodayState } from "../shared/types/ipc";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayPage } from "./pages/TodayPage";

type Tab = "today" | "history" | "settings";

type AppState = {
  todayState: TodayState | null;
  history: DailySummary[];
  settingsDraft: ReminderSettings | null;
};

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [state, setState] = useState<AppState>({
    todayState: null,
    history: [],
    settingsDraft: null,
  });

  useEffect(() => {
    void reloadAll();
  }, []);

  async function reloadAll(nextTodayState?: TodayState): Promise<void> {
    const todayState = nextTodayState ?? (await window.habits.getTodayState());
    const history = await window.habits.getHistory();

    setState((current) => ({
      todayState,
      history,
      settingsDraft: current.settingsDraft ?? todayState.settings,
    }));
  }

  async function refreshToday(mutator: Promise<TodayState>): Promise<void> {
    const nextTodayState = await mutator;
    await reloadAll(nextTodayState);
  }

  async function handleToggleHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.toggleHabit(habitId));
  }

  async function handleUpdateSettings(settings: ReminderSettings): Promise<void> {
    const nextSettings = await window.habits.updateReminderSettings(settings);

    setState((current) => ({
      todayState: current.todayState
        ? {
            ...current.todayState,
            settings: nextSettings,
          }
        : current.todayState,
      history: current.history,
      settingsDraft: nextSettings,
    }));
  }

  async function handleCreateHabit(name: string): Promise<void> {
    await refreshToday(window.habits.createHabit(name));
    setState((current) => ({
      ...current,
      settingsDraft: current.todayState?.settings ?? current.settingsDraft,
    }));
  }

  async function handleRenameHabit(habitId: number, name: string): Promise<void> {
    await refreshToday(window.habits.renameHabit(habitId, name));
  }

  async function handleArchiveHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.archiveHabit(habitId));
  }

  async function handleReorderHabits(nextHabits: HabitWithStatus[]): Promise<void> {
    await refreshToday(window.habits.reorderHabits(nextHabits.map((habit) => habit.id)));
  }

  if (!state.todayState) {
    return <main className="shell loading">Loading...</main>;
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Habit tracker</p>
          <h1>Zucchini</h1>
          <p className="sidebar-copy">
            Local-first daily streaks with freezes, reminders, and history.
          </p>
        </div>

        <nav className="nav">
          <button
            className={tab === "today" ? "nav-button active" : "nav-button"}
            onClick={() => setTab("today")}
            type="button"
          >
            Today
          </button>
          <button
            className={tab === "history" ? "nav-button active" : "nav-button"}
            onClick={() => setTab("history")}
            type="button"
          >
            History
          </button>
          <button
            className={tab === "settings" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setTab("settings");
              setState((current) => ({
                ...current,
                settingsDraft: current.todayState?.settings ?? current.settingsDraft,
              }));
            }}
            type="button"
          >
            Settings
          </button>
        </nav>
      </aside>

      <section className="content">
        {tab === "today" ? (
          <TodayPage state={state.todayState} onToggleHabit={handleToggleHabit} />
        ) : null}
        {tab === "history" ? <HistoryPage history={state.history} /> : null}
        {tab === "settings" ? (
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
        ) : null}
      </section>
    </main>
  );
}
