import { useEffect, useState } from "react";
import type { ReminderSettings } from "../shared/domain/settings";
import type { DailySummary } from "../shared/domain/streak";
import type { TodayState } from "../shared/types/ipc";
import { TodayPage } from "./pages/TodayPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";

type Tab = "today" | "history" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [todayState, setTodayState] = useState<TodayState | null>(null);
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    void Promise.all([window.habits.getTodayState(), window.habits.getHistory()]).then(
      ([today, historyRows]) => {
        setTodayState(today);
        setHistory(historyRows);
        setSettingsDraft(today.settings);
      },
    );
  }, []);

  async function handleToggleHabit(habitId: number): Promise<void> {
    const nextState = await window.habits.toggleHabit(habitId);
    setTodayState(nextState);
    const historyRows = await window.habits.getHistory();
    setHistory(historyRows);
  }

  async function handleUpdateSettings(settings: ReminderSettings): Promise<void> {
    const nextSettings = await window.habits.updateReminderSettings(settings);
    setTodayState((current) =>
      current
        ? {
            ...current,
            settings: nextSettings,
          }
        : current,
    );
    setSettingsDraft(nextSettings);
  }

  if (!todayState) {
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
              setSettingsDraft(todayState.settings);
            }}
            type="button"
          >
            Settings
          </button>
        </nav>
      </aside>

      <section className="content">
        {tab === "today" ? (
          <TodayPage state={todayState} onToggleHabit={handleToggleHabit} />
        ) : null}
        {tab === "history" ? <HistoryPage history={history} /> : null}
        {tab === "settings" ? (
          <SettingsPage
            settings={settingsDraft ?? todayState.settings}
            onChange={setSettingsDraft}
            onSave={handleUpdateSettings}
          />
        ) : null}
      </section>
    </main>
  );
}
