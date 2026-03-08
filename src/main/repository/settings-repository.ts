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
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderTime: map.get("reminderTime") ?? "20:30",
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
      this.upsertSetting(
        "reminderEnabled",
        String(nextSettings.reminderEnabled)
      );
      this.upsertSetting("reminderTime", nextSettings.reminderTime);
      this.upsertSetting("themeMode", nextSettings.themeMode);
      this.upsertSetting("timezone", nextSettings.timezone);
    });

    return this.getSettings(defaultTimezone);
  }

  seedDefaults(timezone: string): void {
    this.client.run("seedDefaultSettings", () => {
      this.upsertSetting("reminderEnabled", "true");
      this.upsertSetting("reminderTime", "20:30");
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
