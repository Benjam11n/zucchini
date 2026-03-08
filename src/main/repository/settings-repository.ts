import {
  DEFAULT_REMINDER_SNOOZE_MINUTES,
  DEFAULT_REMINDER_TIME,
} from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { settings } from "../schema";
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

      return {
        launchAtLogin: map.get("launchAtLogin") === "true",
        minimizeToTray: map.get("minimizeToTray") === "true",
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderSnoozeMinutes:
          Number(map.get("reminderSnoozeMinutes")) ||
          DEFAULT_REMINDER_SNOOZE_MINUTES,
        reminderTime: map.get("reminderTime") ?? DEFAULT_REMINDER_TIME,
        themeMode: normalizeThemeMode(map.get("themeMode")),
        timezone: map.get("timezone") ?? defaultTimezone,
      };
    });
  }

  saveSettings(
    nextSettings: AppSettings,
    defaultTimezone: string
  ): AppSettings {
    this.client.run("saveSettings", () => {
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
      this.upsertSetting("themeMode", nextSettings.themeMode);
      this.upsertSetting("timezone", nextSettings.timezone);
    });

    return this.getSettings(defaultTimezone);
  }

  seedDefaults(timezone: string): void {
    this.client.run("seedDefaultSettings", () => {
      this.upsertSetting("launchAtLogin", "false");
      this.upsertSetting("minimizeToTray", "false");
      this.upsertSetting("reminderEnabled", "true");
      this.upsertSetting(
        "reminderSnoozeMinutes",
        String(DEFAULT_REMINDER_SNOOZE_MINUTES)
      );
      this.upsertSetting("reminderTime", DEFAULT_REMINDER_TIME);
      this.upsertSetting("themeMode", "system");
      this.upsertSetting("timezone", timezone);
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
