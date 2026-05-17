import { eq } from "drizzle-orm";

import { settings } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type {
  AppSettings,
  HabitCategoryPreferences,
} from "@/shared/domain/settings";

import { normalizeThemeMode } from "./mappers";

const SETTINGS_ROW_ID = 1;

function serializeCategoryPreferences(
  categoryPreferences: HabitCategoryPreferences
): string {
  return JSON.stringify(categoryPreferences);
}

function deserializeCategoryPreferences(
  value: string,
  defaults: HabitCategoryPreferences
): HabitCategoryPreferences {
  try {
    return JSON.parse(value) as HabitCategoryPreferences;
  } catch {
    return defaults;
  }
}

function normalizeAutoBackupCadence(
  value: string | null | undefined,
  fallback: AppSettings["autoBackupCadence"]
): AppSettings["autoBackupCadence"] {
  if (value === "daily" || value === "off" || value === "weekly") {
    return value;
  }

  return fallback;
}

function normalizeAutoBackupLastRunAt(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  return appSettingsSchema.shape.autoBackupLastRunAt.safeParse(value).success
    ? value
    : null;
}

export class SqliteSettingsRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  private persistSettings(settingsToSave: AppSettings): void {
    this.client
      .getDrizzle()
      .insert(settings)
      .values({
        autoBackupCadence: settingsToSave.autoBackupCadence,
        autoBackupLastRunAt: settingsToSave.autoBackupLastRunAt,
        categoryPreferences: serializeCategoryPreferences(
          settingsToSave.categoryPreferences
        ),
        focusCyclesBeforeLongBreak: settingsToSave.focusCyclesBeforeLongBreak,
        focusDefaultDurationSeconds: settingsToSave.focusDefaultDurationSeconds,
        focusLongBreakSeconds: settingsToSave.focusLongBreakSeconds,
        focusShortBreakSeconds: settingsToSave.focusShortBreakSeconds,
        id: SETTINGS_ROW_ID,
        launchAtLogin: settingsToSave.launchAtLogin,
        minimizeToTray: settingsToSave.minimizeToTray,
        reminderEnabled: settingsToSave.reminderEnabled,
        reminderSnoozeMinutes: settingsToSave.reminderSnoozeMinutes,
        reminderTime: settingsToSave.reminderTime,
        resetFocusTimerShortcut: settingsToSave.resetFocusTimerShortcut,
        themeMode: settingsToSave.themeMode,
        timezone: settingsToSave.timezone,
        toggleFocusTimerShortcut: settingsToSave.toggleFocusTimerShortcut,
        windDownTime: settingsToSave.windDownTime,
      })
      .onConflictDoUpdate({
        set: {
          autoBackupCadence: settingsToSave.autoBackupCadence,
          autoBackupLastRunAt: settingsToSave.autoBackupLastRunAt,
          categoryPreferences: serializeCategoryPreferences(
            settingsToSave.categoryPreferences
          ),
          focusCyclesBeforeLongBreak: settingsToSave.focusCyclesBeforeLongBreak,
          focusDefaultDurationSeconds:
            settingsToSave.focusDefaultDurationSeconds,
          focusLongBreakSeconds: settingsToSave.focusLongBreakSeconds,
          focusShortBreakSeconds: settingsToSave.focusShortBreakSeconds,
          launchAtLogin: settingsToSave.launchAtLogin,
          minimizeToTray: settingsToSave.minimizeToTray,
          reminderEnabled: settingsToSave.reminderEnabled,
          reminderSnoozeMinutes: settingsToSave.reminderSnoozeMinutes,
          reminderTime: settingsToSave.reminderTime,
          resetFocusTimerShortcut: settingsToSave.resetFocusTimerShortcut,
          themeMode: settingsToSave.themeMode,
          timezone: settingsToSave.timezone,
          toggleFocusTimerShortcut: settingsToSave.toggleFocusTimerShortcut,
          windDownTime: settingsToSave.windDownTime,
        },
        target: settings.id,
      })
      .run();
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.client.run("getSettings", () => {
      const row = this.client.getDrizzle().select().from(settings).get();
      const defaults = createDefaultAppSettings(defaultTimezone);

      if (!row) {
        return defaults;
      }

      const candidateSettings: AppSettings = {
        autoBackupCadence: normalizeAutoBackupCadence(
          row.autoBackupCadence,
          defaults.autoBackupCadence
        ),
        autoBackupLastRunAt: normalizeAutoBackupLastRunAt(
          row.autoBackupLastRunAt
        ),
        categoryPreferences: deserializeCategoryPreferences(
          row.categoryPreferences,
          defaults.categoryPreferences
        ),
        focusCyclesBeforeLongBreak: row.focusCyclesBeforeLongBreak,
        focusDefaultDurationSeconds: row.focusDefaultDurationSeconds,
        focusLongBreakSeconds: row.focusLongBreakSeconds,
        focusShortBreakSeconds: row.focusShortBreakSeconds,
        launchAtLogin: row.launchAtLogin,
        minimizeToTray: row.minimizeToTray,
        reminderEnabled: row.reminderEnabled,
        reminderSnoozeMinutes: row.reminderSnoozeMinutes,
        reminderTime: row.reminderTime,
        resetFocusTimerShortcut: row.resetFocusTimerShortcut,
        themeMode: normalizeThemeMode(row.themeMode),
        timezone: defaults.timezone,
        toggleFocusTimerShortcut: row.toggleFocusTimerShortcut,
        windDownTime: row.windDownTime,
      };

      const validationResult = appSettingsSchema.safeParse(candidateSettings);
      if (!validationResult.success) {
        return defaults;
      }

      return validationResult.data;
    });
  }

  saveSettings(
    nextSettings: AppSettings,
    defaultTimezone: string
  ): AppSettings {
    this.client.run("saveSettings", () => {
      const existingRow = this.client
        .getDrizzle()
        .select()
        .from(settings)
        .get();
      this.persistSettings({
        ...nextSettings,
        autoBackupLastRunAt:
          normalizeAutoBackupLastRunAt(existingRow?.autoBackupLastRunAt) ??
          nextSettings.autoBackupLastRunAt,
        timezone: defaultTimezone,
      });
    });

    return this.getSettings(defaultTimezone);
  }

  seedDefaults(timezone: string): void {
    this.client.run("seedDefaultSettings", () => {
      const defaults = createDefaultAppSettings(timezone);

      this.client
        .getDrizzle()
        .insert(settings)
        .values({
          autoBackupCadence: defaults.autoBackupCadence,
          autoBackupLastRunAt: defaults.autoBackupLastRunAt,
          categoryPreferences: serializeCategoryPreferences(
            defaults.categoryPreferences
          ),
          focusCyclesBeforeLongBreak: defaults.focusCyclesBeforeLongBreak,
          focusDefaultDurationSeconds: defaults.focusDefaultDurationSeconds,
          focusLongBreakSeconds: defaults.focusLongBreakSeconds,
          focusShortBreakSeconds: defaults.focusShortBreakSeconds,
          id: SETTINGS_ROW_ID,
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
        })
        .onConflictDoNothing()
        .run();
    });
  }

  updateAutoBackupLastRunAt(timestamp: string): void {
    this.client.run("updateAutoBackupLastRunAt", () => {
      this.client
        .getDrizzle()
        .update(settings)
        .set({ autoBackupLastRunAt: timestamp })
        .where(eq(settings.id, SETTINGS_ROW_ID))
        .run();
    });
  }
}
