import { settings } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import {
  createDefaultAppSettings,
  isValidGlobalShortcutAccelerator,
  normalizeHabitCategoryColor,
  normalizeHabitCategoryIcon,
  normalizeHabitCategoryLabel,
} from "@/shared/domain/settings";
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

function parseCategoryMetadata(
  value: unknown,
  defaults: HabitCategoryPreferences[keyof HabitCategoryPreferences]
): HabitCategoryPreferences[keyof HabitCategoryPreferences] {
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<Record<"color" | "icon" | "label", unknown>>)
      : null;

  return {
    color: normalizeHabitCategoryColor(
      typeof candidate?.color === "string" ? candidate.color : undefined,
      defaults.color
    ),
    icon: normalizeHabitCategoryIcon(
      typeof candidate?.icon === "string" ? candidate.icon : undefined,
      defaults.icon
    ),
    label: normalizeHabitCategoryLabel(
      typeof candidate?.label === "string" ? candidate.label : undefined,
      defaults.label
    ),
  };
}

function parseCategoryPreferences(
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

  const candidate = parsed as Partial<
    Record<keyof HabitCategoryPreferences, unknown>
  >;

  return {
    fitness: parseCategoryMetadata(candidate.fitness, defaults.fitness),
    nutrition: parseCategoryMetadata(candidate.nutrition, defaults.nutrition),
    productivity: parseCategoryMetadata(
      candidate.productivity,
      defaults.productivity
    ),
  };
}

export class SqliteSettingsRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.client.run("getSettings", () => {
      const row = this.client.getDrizzle().select().from(settings).get();
      const defaults = createDefaultAppSettings(defaultTimezone);

      if (!row) {
        return defaults;
      }

      const candidateSettings: AppSettings = {
        categoryPreferences: parseCategoryPreferences(
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
        resetFocusTimerShortcut: isValidGlobalShortcutAccelerator(
          row.resetFocusTimerShortcut
        )
          ? row.resetFocusTimerShortcut
          : defaults.resetFocusTimerShortcut,
        themeMode: normalizeThemeMode(row.themeMode),
        timezone: row.timezone || defaults.timezone,
        toggleFocusTimerShortcut: isValidGlobalShortcutAccelerator(
          row.toggleFocusTimerShortcut
        )
          ? row.toggleFocusTimerShortcut
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
      this.client
        .getDrizzle()
        .insert(settings)
        .values({
          categoryPreferences: serializeCategoryPreferences(
            nextSettings.categoryPreferences
          ),
          focusCyclesBeforeLongBreak: nextSettings.focusCyclesBeforeLongBreak,
          focusDefaultDurationSeconds: nextSettings.focusDefaultDurationSeconds,
          focusLongBreakSeconds: nextSettings.focusLongBreakSeconds,
          focusShortBreakSeconds: nextSettings.focusShortBreakSeconds,
          id: SETTINGS_ROW_ID,
          launchAtLogin: nextSettings.launchAtLogin,
          minimizeToTray: nextSettings.minimizeToTray,
          reminderEnabled: nextSettings.reminderEnabled,
          reminderSnoozeMinutes: nextSettings.reminderSnoozeMinutes,
          reminderTime: nextSettings.reminderTime,
          resetFocusTimerShortcut: nextSettings.resetFocusTimerShortcut,
          themeMode: nextSettings.themeMode,
          timezone: nextSettings.timezone,
          toggleFocusTimerShortcut: nextSettings.toggleFocusTimerShortcut,
        })
        .onConflictDoUpdate({
          set: {
            categoryPreferences: serializeCategoryPreferences(
              nextSettings.categoryPreferences
            ),
            focusCyclesBeforeLongBreak: nextSettings.focusCyclesBeforeLongBreak,
            focusDefaultDurationSeconds:
              nextSettings.focusDefaultDurationSeconds,
            focusLongBreakSeconds: nextSettings.focusLongBreakSeconds,
            focusShortBreakSeconds: nextSettings.focusShortBreakSeconds,
            launchAtLogin: nextSettings.launchAtLogin,
            minimizeToTray: nextSettings.minimizeToTray,
            reminderEnabled: nextSettings.reminderEnabled,
            reminderSnoozeMinutes: nextSettings.reminderSnoozeMinutes,
            reminderTime: nextSettings.reminderTime,
            resetFocusTimerShortcut: nextSettings.resetFocusTimerShortcut,
            themeMode: nextSettings.themeMode,
            timezone: nextSettings.timezone,
            toggleFocusTimerShortcut: nextSettings.toggleFocusTimerShortcut,
          },
          target: settings.id,
        })
        .run();
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
        })
        .onConflictDoNothing()
        .run();
    });
  }
}
