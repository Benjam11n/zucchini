import { eq } from "drizzle-orm";

import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { OnboardingStatus } from "@/shared/domain/onboarding";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { settings } from "../db/schema";
import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { normalizeThemeMode } from "./mappers";

const ONBOARDING_COMPLETED_AT_KEY = "onboarding_completed_at";

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
        focusCyclesBeforeLongBreak: Number(
          map.get("focusCyclesBeforeLongBreak")
        ),
        focusDefaultDurationSeconds: Number(
          map.get("focusDefaultDurationSeconds")
        ),
        focusLongBreakMinutes: Number(map.get("focusLongBreakMinutes")),
        focusShortBreakMinutes: Number(map.get("focusShortBreakMinutes")),
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

  getOnboardingStatus(): OnboardingStatus {
    return this.client.run("getOnboardingStatus", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(settings)
        .where(eq(settings.key, ONBOARDING_COMPLETED_AT_KEY))
        .get();
      const completedAt = row?.value?.trim() ? row.value : null;

      return {
        completedAt,
        isComplete: completedAt !== null,
      };
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
        "focusLongBreakMinutes",
        String(nextSettings.focusLongBreakMinutes)
      );
      this.upsertSetting(
        "focusShortBreakMinutes",
        String(nextSettings.focusShortBreakMinutes)
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
      this.upsertSetting("themeMode", nextSettings.themeMode);
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
        "focusLongBreakMinutes",
        String(defaults.focusLongBreakMinutes)
      );
      this.upsertSetting(
        "focusShortBreakMinutes",
        String(defaults.focusShortBreakMinutes)
      );
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

  markOnboardingComplete(completedAt: string): OnboardingStatus {
    this.client.run("markOnboardingComplete", () => {
      this.upsertSetting(ONBOARDING_COMPLETED_AT_KEY, completedAt);
    });

    return this.getOnboardingStatus();
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
