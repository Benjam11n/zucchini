import { useState } from "react";
import type { HabitWithStatus } from "../../shared/domain/habit";
import type { ReminderSettings } from "../../shared/domain/settings";

type SettingsPageProps = {
  habits: HabitWithStatus[];
  settings: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
  onSave: (settings: ReminderSettings) => Promise<void>;
  onCreateHabit: (name: string) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
};

function reorderHabitList(
  habits: HabitWithStatus[],
  habitId: number,
  direction: -1 | 1,
): HabitWithStatus[] {
  const index = habits.findIndex((habit) => habit.id === habitId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= habits.length) {
    return habits;
  }

  const nextHabits = [...habits];
  const [movedHabit] = nextHabits.splice(index, 1);
  nextHabits.splice(targetIndex, 0, movedHabit);
  return nextHabits;
}

export function SettingsPage({
  habits,
  settings,
  onChange,
  onSave,
  onCreateHabit,
  onRenameHabit,
  onArchiveHabit,
  onReorderHabits,
}: SettingsPageProps) {
  const [newHabitName, setNewHabitName] = useState("");

  return (
    <div className="page">
      <header className="panel">
        <p className="eyebrow">Settings</p>
        <h2>Reminders</h2>
      </header>

      <section className="panel settings-form">
        <label className="field">
          <span>Enable reminder</span>
          <input
            checked={settings.reminderEnabled}
            onChange={(event) =>
              onChange({
                ...settings,
                reminderEnabled: event.target.checked,
              })
            }
            type="checkbox"
          />
        </label>

        <label className="field">
          <span>Reminder time</span>
          <input
            onChange={(event) =>
              onChange({
                ...settings,
                reminderTime: event.target.value,
              })
            }
            type="time"
            value={settings.reminderTime}
          />
        </label>

        <label className="field">
          <span>Timezone</span>
          <input
            onChange={(event) =>
              onChange({
                ...settings,
                timezone: event.target.value,
              })
            }
            type="text"
            value={settings.timezone}
          />
        </label>

        <button
          className="primary-button"
          onClick={() => {
            void onSave(settings);
          }}
          type="button"
        >
          Save settings
        </button>
      </section>

      <section className="panel settings-form">
        <div className="settings-header">
          <div>
            <p className="eyebrow">Habits</p>
            <h2>Manage checklist</h2>
          </div>
        </div>

        <div className="habit-settings-list">
          {habits.map((habit, index) => (
            <div className="habit-settings-item" key={habit.id}>
              <input
                className="habit-name-input"
                defaultValue={habit.name}
                onBlur={(event) => {
                  void onRenameHabit(habit.id, event.target.value);
                }}
                type="text"
              />

              <div className="habit-actions">
                <button
                  className="secondary-button"
                  disabled={index === 0}
                  onClick={() => {
                    void onReorderHabits(reorderHabitList(habits, habit.id, -1));
                  }}
                  type="button"
                >
                  Up
                </button>
                <button
                  className="secondary-button"
                  disabled={index === habits.length - 1}
                  onClick={() => {
                    void onReorderHabits(reorderHabitList(habits, habit.id, 1));
                  }}
                  type="button"
                >
                  Down
                </button>
                <button
                  className="secondary-button danger"
                  onClick={() => {
                    void onArchiveHabit(habit.id);
                  }}
                  type="button"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="habit-create-row">
          <input
            className="habit-name-input"
            onChange={(event) => setNewHabitName(event.target.value)}
            placeholder="Add a new habit"
            type="text"
            value={newHabitName}
          />
          <button
            className="primary-button"
            onClick={() => {
              if (!newHabitName.trim()) {
                return;
              }

              void onCreateHabit(newHabitName).then(() => {
                setNewHabitName("");
              });
            }}
            type="button"
          >
            Add habit
          </button>
        </div>
      </section>
    </div>
  );
}
