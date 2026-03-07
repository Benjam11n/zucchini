import type { ReminderSettings } from "../../shared/domain/settings";

type SettingsPageProps = {
  settings: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
  onSave: (settings: ReminderSettings) => Promise<void>;
};

export function SettingsPage({ settings, onChange, onSave }: SettingsPageProps) {
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
    </div>
  );
}
