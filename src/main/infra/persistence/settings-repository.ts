import { settings } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import {
  createDefaultAppSettings,
  isValidGlobalShortcutAccelerator,
} from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { normalizeThemeMode } from "./mappers";

export class SqliteSettingsRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.client.run("getSettings", () => {
      const rows = this.client.getDrizzle().select().from(settings).all();
      const map = new Map(rows.map((row) => [row.key, row.value]));
      const defaults = createDefaultAppSettings(defaultTimezone);
      const savedLongBreakSeconds = map.get("focusLongBreakSeconds");
      const savedShortBreakSeconds = map.get("focusShortBreakSeconds");
      const candidateSettings: AppSettings = {
        focusCyclesBeforeLongBreak: Number(
          map.get("focusCyclesBeforeLongBreak")
        ),
        focusDefaultDurationSeconds: Number(
          map.get("focusDefaultDurationSeconds")
        ),
        focusLongBreakSeconds:
          savedLongBreakSeconds === undefined
            ? Number(map.get("focusLongBreakMinutes")) * 60
            : Number(savedLongBreakSeconds),
        focusShortBreakSeconds:
          savedShortBreakSeconds === undefined
            ? Number(map.get("focusShortBreakMinutes")) * 60
            : Number(savedShortBreakSeconds),
        launchAtLogin: map.get("launchAtLogin") === "true",
        minimizeToTray: map.get("minimizeToTray") === "true",
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderSnoozeMinutes: Number(map.get("reminderSnoozeMinutes")),
        reminderTime: map.get("reminderTime") ?? defaults.reminderTime,
        resetFocusTimerShortcut: isValidGlobalShortcutAccelerator(
          map.get("resetFocusTimerShortcut") ?? ""
        )
          ? (map.get("resetFocusTimerShortcut") as string)
          : defaults.resetFocusTimerShortcut,
        themeMode: normalizeThemeMode(map.get("themeMode")),
        timezone: map.get("timezone") ?? defaults.timezone,
        toggleFocusTimerShortcut: isValidGlobalShortcutAccelerator(
          map.get("toggleFocusTimerShortcut") ?? ""
        )
          ? (map.get("toggleFocusTimerShortcut") as string)
          : defaults.toggleFocusTimerShortcut,
      };

      const validationResult = appSettingsSchema.safeParse(candidateSettings);
      return validationResult.success ? validationResult.data : defaults;
    });
  }

  saveSettings(
    nextSettings: AppSettings,
    defaultTimezone: string
  ): AppSettings {
    this.client.run("saveSettings", () => {
      this.upsertSetting(
        "focusDefaultDurationSeconds",
        String(nextSettings.focusDefaultDurationSeconds)
      );
      this.upsertSetting(
        "focusCyclesBeforeLongBreak",
        String(nextSettings.focusCyclesBeforeLongBreak)
      );
      this.upsertSetting(
        "focusLongBreakSeconds",
        String(nextSettings.focusLongBreakSeconds)
      );
      this.upsertSetting(
        "focusShortBreakSeconds",
        String(nextSettings.focusShortBreakSeconds)
      );
      this.upsertSetting("launchAtLogin", String(nextSettings.launchAtLogin));
      this.upsertSetting("minimizeToTray", String(nextSettings.minimizeToTray));
      this.upsertSetting(
        "reminderEnabled",
        String(nextSettings.reminderEnabled)
      );
      this.upsertSetting(
        "reminderSnoozeMinutes",
        String(nextSettings.reminderSnoozeMinutes)
      );
      this.upsertSetting("reminderTime", nextSettings.reminderTime);
      this.upsertSetting(
        "resetFocusTimerShortcut",
        nextSettings.resetFocusTimerShortcut
      );
      this.upsertSetting("themeMode", nextSettings.themeMode);
      this.upsertSetting(
        "toggleFocusTimerShortcut",
        nextSettings.toggleFocusTimerShortcut
      );
      this.upsertSetting("timezone", nextSettings.timezone);
    });

    return this.getSettings(defaultTimezone);
  }

  seedDefaults(timezone: string): void {
    this.client.run("seedDefaultSettings", () => {
      const defaults = createDefaultAppSettings(timezone);
      this.upsertSetting(
        "focusDefaultDurationSeconds",
        String(defaults.focusDefaultDurationSeconds)
      );
      this.upsertSetting(
        "focusCyclesBeforeLongBreak",
        String(defaults.focusCyclesBeforeLongBreak)
      );
      this.upsertSetting(
        "focusLongBreakSeconds",
        String(defaults.focusLongBreakSeconds)
      );
      this.upsertSetting(
        "focusShortBreakSeconds",
        String(defaults.focusShortBreakSeconds)
      );
      this.upsertSetting("launchAtLogin", String(defaults.launchAtLogin));
      this.upsertSetting("minimizeToTray", String(defaults.minimizeToTray));
      this.upsertSetting("reminderEnabled", String(defaults.reminderEnabled));
      this.upsertSetting(
        "reminderSnoozeMinutes",
        String(defaults.reminderSnoozeMinutes)
      );
      this.upsertSetting("reminderTime", defaults.reminderTime);
      this.upsertSetting(
        "resetFocusTimerShortcut",
        defaults.resetFocusTimerShortcut
      );
      this.upsertSetting("themeMode", defaults.themeMode);
      this.upsertSetting(
        "toggleFocusTimerShortcut",
        defaults.toggleFocusTimerShortcut
      );
      this.upsertSetting("timezone", defaults.timezone);
    });
  }

  private upsertSetting(key: string, value: string): void {
    this.client
      .getDrizzle()
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        set: { value },
        target: settings.key,
      })
      .run();
  }
}
