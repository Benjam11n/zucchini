import { settings } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import {
  createDefaultAppSettings,
  isValidGlobalShortcutAccelerator,
  normalizeHabitCategoryPreferences,
} from "@/shared/domain/settings";
import type {
  AppSettings,
  HabitCategoryMetadata,
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
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    // CHECK: malformed stored category preferences are silently reset to
    // defaults. Do we want lightweight diagnostics here so corrupted user data
    // is easier to notice and debug?
    return defaults;
  }

  if (!parsed || typeof parsed !== "object") {
    return defaults;
  }

  // `0008_typed_settings` migrated legacy rows without category icons, so
  // current reads still need to normalize partial stored metadata.
  return normalizeHabitCategoryPreferences(
    parsed as Partial<
      Record<keyof HabitCategoryPreferences, Partial<HabitCategoryMetadata>>
    >
  );
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

      const needsLegacyShortcutRepair =
        !isValidGlobalShortcutAccelerator(row.resetFocusTimerShortcut) ||
        !isValidGlobalShortcutAccelerator(row.toggleFocusTimerShortcut);

      const candidateSettings: AppSettings = {
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
        resetFocusTimerShortcut: needsLegacyShortcutRepair
          ? defaults.resetFocusTimerShortcut
          : row.resetFocusTimerShortcut,
        themeMode: normalizeThemeMode(row.themeMode),
        timezone: row.timezone || defaults.timezone,
        toggleFocusTimerShortcut: needsLegacyShortcutRepair
          ? defaults.toggleFocusTimerShortcut
          : row.toggleFocusTimerShortcut,
        windDownTime: row.windDownTime,
      };

      const validationResult = appSettingsSchema.safeParse(candidateSettings);
      if (!validationResult.success) {
        return defaults;
      }

      if (needsLegacyShortcutRepair) {
        this.persistSettings(validationResult.data);
      }

      return validationResult.data;
    });
  }

  saveSettings(
    nextSettings: AppSettings,
    defaultTimezone: string
  ): AppSettings {
    this.client.run("saveSettings", () => {
      this.persistSettings(nextSettings);
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
}
