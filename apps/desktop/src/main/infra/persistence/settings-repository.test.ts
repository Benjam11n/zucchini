import type { AppSettings } from "@/shared/domain/settings";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { SqliteSettingsRepository } from "./settings-repository";

interface FakeSettingsRow {
  autoBackupCadence?: AppSettings["autoBackupCadence"];
  autoBackupLastRunAt?: string | null;
  categoryPreferences: string;
  focusCyclesBeforeLongBreak: number;
  focusDefaultDurationSeconds: number;
  focusLongBreakSeconds: number;
  focusShortBreakSeconds: number;
  id: number;
  launchAtLogin: boolean;
  minimizeToTray: boolean;
  reminderEnabled: boolean;
  reminderSnoozeMinutes: number;
  reminderTime: string;
  resetFocusTimerShortcut: string;
  themeMode: string;
  timezone: string;
  toggleFocusTimerShortcut: string;
  windDownTime: string;
}

function createFakeClient(initialRow?: FakeSettingsRow) {
  let row = initialRow ? { ...initialRow } : null;

  return {
    getDrizzle() {
      return {
        insert() {
          return {
            values(value: FakeSettingsRow) {
              return {
                onConflictDoNothing() {
                  return {
                    run() {
                      if (!row) {
                        row = { ...value };
                      }
                    },
                  };
                },
                onConflictDoUpdate() {
                  return {
                    run() {
                      row = { ...value };
                    },
                  };
                },
              };
            },
          };
        },
        select() {
          return {
            from() {
              return {
                get() {
                  return row;
                },
              };
            },
          };
        },
        update() {
          return {
            set(value: Partial<FakeSettingsRow>) {
              return {
                where() {
                  return {
                    run() {
                      row = row ? { ...row, ...value } : row;
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    peekRow() {
      return row;
    },
    run<T>(_label: string, execute: () => T): T {
      return execute();
    },
  };
}

describe("SqliteSettingsRepository", () => {
  it("falls back to default category preferences when category settings are invalid", () => {
    const defaults = createDefaultAppSettings("Asia/Singapore");
    const repository = new SqliteSettingsRepository(
      createFakeClient({
        autoBackupCadence: defaults.autoBackupCadence,
        autoBackupLastRunAt: defaults.autoBackupLastRunAt,
        categoryPreferences: "{not-json",
        focusCyclesBeforeLongBreak: defaults.focusCyclesBeforeLongBreak,
        focusDefaultDurationSeconds: defaults.focusDefaultDurationSeconds,
        focusLongBreakSeconds: defaults.focusLongBreakSeconds,
        focusShortBreakSeconds: defaults.focusShortBreakSeconds,
        id: 1,
        launchAtLogin: defaults.launchAtLogin,
        minimizeToTray: defaults.minimizeToTray,
        reminderEnabled: defaults.reminderEnabled,
        reminderSnoozeMinutes: defaults.reminderSnoozeMinutes,
        reminderTime: defaults.reminderTime,
        resetFocusTimerShortcut: defaults.resetFocusTimerShortcut,
        themeMode: defaults.themeMode,
        timezone: defaults.timezone,
        toggleFocusTimerShortcut: defaults.toggleFocusTimerShortcut,
        windDownTime: defaults.windDownTime,
      }) as never
    );

    expect(
      repository.getSettings("Asia/Singapore").categoryPreferences
    ).toStrictEqual(defaults.categoryPreferences);
  });

  it("round-trips category preferences through the settings row", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);
    const customSettings: AppSettings = {
      ...createDefaultAppSettings("Asia/Singapore"),
      categoryPreferences: {
        fitness: {
          color: "#CC3355",
          icon: "heartPulse",
          label: "Movement",
        },
        nutrition: {
          color: "#66CC22",
          icon: "apple",
          label: "Fuel",
        },
        productivity: {
          color: "#22BBDD",
          icon: "brain",
          label: "Work",
        },
      },
    };

    const savedSettings = repository.saveSettings(
      customSettings,
      "Asia/Singapore"
    );

    expect(savedSettings.categoryPreferences).toStrictEqual(
      customSettings.categoryPreferences
    );
  });

  it("round-trips auto backup settings through the settings row", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);
    const customSettings: AppSettings = {
      ...createDefaultAppSettings("Asia/Singapore"),
      autoBackupCadence: "daily",
      autoBackupLastRunAt: "2026-03-30T14:15:16.789Z",
    };

    const savedSettings = repository.saveSettings(
      customSettings,
      "Asia/Singapore"
    );

    expect(savedSettings).toMatchObject({
      autoBackupCadence: "daily",
      autoBackupLastRunAt: "2026-03-30T14:15:16.789Z",
    });
  });

  it("loads auto backup defaults from legacy settings rows", () => {
    const defaults = createDefaultAppSettings("Asia/Singapore");
    const repository = new SqliteSettingsRepository(
      createFakeClient({
        categoryPreferences: JSON.stringify(defaults.categoryPreferences),
        focusCyclesBeforeLongBreak: defaults.focusCyclesBeforeLongBreak,
        focusDefaultDurationSeconds: defaults.focusDefaultDurationSeconds,
        focusLongBreakSeconds: defaults.focusLongBreakSeconds,
        focusShortBreakSeconds: defaults.focusShortBreakSeconds,
        id: 1,
        launchAtLogin: defaults.launchAtLogin,
        minimizeToTray: defaults.minimizeToTray,
        reminderEnabled: defaults.reminderEnabled,
        reminderSnoozeMinutes: defaults.reminderSnoozeMinutes,
        reminderTime: defaults.reminderTime,
        resetFocusTimerShortcut: defaults.resetFocusTimerShortcut,
        themeMode: defaults.themeMode,
        timezone: defaults.timezone,
        toggleFocusTimerShortcut: defaults.toggleFocusTimerShortcut,
        windDownTime: defaults.windDownTime,
      }) as never
    );

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      autoBackupCadence: "off",
      autoBackupLastRunAt: null,
    });
  });

  it("normalizes invalid internal auto backup settings without resetting other settings", () => {
    const defaults = createDefaultAppSettings("Asia/Singapore");
    const repository = new SqliteSettingsRepository(
      createFakeClient({
        autoBackupCadence: "hourly" as never,
        autoBackupLastRunAt: "2026-03-30",
        categoryPreferences: JSON.stringify(defaults.categoryPreferences),
        focusCyclesBeforeLongBreak: 7,
        focusDefaultDurationSeconds: 33 * 60,
        focusLongBreakSeconds: defaults.focusLongBreakSeconds,
        focusShortBreakSeconds: defaults.focusShortBreakSeconds,
        id: 1,
        launchAtLogin: defaults.launchAtLogin,
        minimizeToTray: defaults.minimizeToTray,
        reminderEnabled: defaults.reminderEnabled,
        reminderSnoozeMinutes: defaults.reminderSnoozeMinutes,
        reminderTime: defaults.reminderTime,
        resetFocusTimerShortcut: defaults.resetFocusTimerShortcut,
        themeMode: defaults.themeMode,
        timezone: defaults.timezone,
        toggleFocusTimerShortcut: defaults.toggleFocusTimerShortcut,
        windDownTime: defaults.windDownTime,
      }) as never
    );

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      autoBackupCadence: "off",
      autoBackupLastRunAt: null,
      focusCyclesBeforeLongBreak: 7,
      focusDefaultDurationSeconds: 33 * 60,
    });
  });

  it("does not preserve invalid stored auto backup timestamps during settings saves", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);
    const settings = createDefaultAppSettings("Asia/Singapore");

    repository.saveSettings(
      {
        ...settings,
        autoBackupLastRunAt: "2026-03-30",
      },
      "Asia/Singapore"
    );
    repository.saveSettings(
      {
        ...settings,
        autoBackupCadence: "daily",
        autoBackupLastRunAt: null,
      },
      "Asia/Singapore"
    );

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      autoBackupCadence: "daily",
      autoBackupLastRunAt: null,
    });
  });

  it("preserves the stored auto backup last run timestamp during settings saves", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);
    const settings = createDefaultAppSettings("Asia/Singapore");

    repository.saveSettings(settings, "Asia/Singapore");
    repository.updateAutoBackupLastRunAt("2026-03-30T14:15:16.789Z");
    repository.saveSettings(
      {
        ...settings,
        autoBackupCadence: "weekly",
        autoBackupLastRunAt: null,
      },
      "Asia/Singapore"
    );

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      autoBackupCadence: "weekly",
      autoBackupLastRunAt: "2026-03-30T14:15:16.789Z",
    });
  });

  it("does not overwrite saved pomodoro settings when seeding defaults", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);

    repository.saveSettings(
      {
        ...createDefaultAppSettings("Asia/Singapore"),
        focusCyclesBeforeLongBreak: 7,
        focusDefaultDurationSeconds: 33 * 60,
        focusLongBreakSeconds: 22 * 60,
        focusShortBreakSeconds: 9 * 60,
      },
      "Asia/Singapore"
    );

    repository.seedDefaults("Asia/Singapore");

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      focusCyclesBeforeLongBreak: 7,
      focusDefaultDurationSeconds: 33 * 60,
      focusLongBreakSeconds: 22 * 60,
      focusShortBreakSeconds: 9 * 60,
    });
  });

  it("uses the OS timezone instead of a previously saved timezone", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);

    repository.saveSettings(
      createDefaultAppSettings("Pacific/Honolulu"),
      "Pacific/Honolulu"
    );

    expect(repository.getSettings("Asia/Singapore").timezone).toBe(
      "Asia/Singapore"
    );
  });
});
