import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import { createDefaultAppSettings } from "@/shared/domain/settings";
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
      const defaults = createDefaultAppSettings(defaultTimezone);
      const candidateSettings: AppSettings = {
        launchAtLogin: map.get("launchAtLogin") === "true",
        minimizeToTray: map.get("minimizeToTray") === "true",
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderSnoozeMinutes: Number(map.get("reminderSnoozeMinutes")),
        reminderTime: map.get("reminderTime") ?? defaults.reminderTime,
        themeMode: normalizeThemeMode(map.get("themeMode")),
        timezone: map.get("timezone") ?? defaults.timezone,
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
      const defaults = createDefaultAppSettings(timezone);
      this.upsertSetting("launchAtLogin", String(defaults.launchAtLogin));
      this.upsertSetting("minimizeToTray", String(defaults.minimizeToTray));
      this.upsertSetting("reminderEnabled", String(defaults.reminderEnabled));
      this.upsertSetting(
        "reminderSnoozeMinutes",
        String(defaults.reminderSnoozeMinutes)
      );
      this.upsertSetting("reminderTime", defaults.reminderTime);
      this.upsertSetting("themeMode", defaults.themeMode);
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
