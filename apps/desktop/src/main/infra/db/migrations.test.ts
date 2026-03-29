import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createDefaultAppSettings } from "@/shared/domain/settings";

import { runMigrations } from "./migrations";
import { SqliteDatabaseClient } from "./sqlite-client";

function createTempDbPath(name: string): string {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "zucchini-migrations-")
  );
  return path.join(tempDir, `${name}.sqlite`);
}

function canUseSqlite(): boolean {
  try {
    const sqlite = new Database(":memory:");
    sqlite.close();
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!canUseSqlite())("runMigrations", () => {
  it("migrates legacy key-value settings rows into a typed settings row", () => {
    const databasePath = createTempDbPath("legacy-settings");
    const sqlite = new Database(databasePath);
    const defaults = createDefaultAppSettings("Asia/Singapore");

    sqlite.exec(`
      CREATE TABLE settings (
        key text PRIMARY KEY NOT NULL,
        value text NOT NULL
      );
    `);

    const insertSetting = sqlite.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
    `);

    insertSetting.run("categoryColorFitness", "#CC3355");
    insertSetting.run("categoryLabelFitness", "Movement");
    insertSetting.run("focusCyclesBeforeLongBreak", "5");
    insertSetting.run("focusDefaultDurationSeconds", "3000");
    insertSetting.run("focusLongBreakSeconds", "1500");
    insertSetting.run("focusShortBreakSeconds", "600");
    insertSetting.run("launchAtLogin", "true");
    insertSetting.run("minimizeToTray", "true");
    insertSetting.run("reminderEnabled", "false");
    insertSetting.run("reminderSnoozeMinutes", "20");
    insertSetting.run("reminderTime", "09:45");
    insertSetting.run("themeMode", "dark");
    insertSetting.run("timezone", "America/Los_Angeles");
    sqlite.close();

    const client = new SqliteDatabaseClient({ databasePath });
    runMigrations(client);

    const row = client.getSqlite().prepare(`SELECT * FROM settings`).get() as {
      category_preferences: string;
      focus_cycles_before_long_break: number;
      focus_default_duration_seconds: number;
      focus_long_break_seconds: number;
      focus_short_break_seconds: number;
      id: number;
      launch_at_login: number;
      minimize_to_tray: number;
      reminder_enabled: number;
      reminder_snooze_minutes: number;
      reminder_time: string;
      reset_focus_timer_shortcut: string;
      theme_mode: string;
      timezone: string;
      toggle_focus_timer_shortcut: string;
    };

    expect(row).toMatchObject({
      focus_cycles_before_long_break: 5,
      focus_default_duration_seconds: 3000,
      focus_long_break_seconds: 1500,
      focus_short_break_seconds: 600,
      id: 1,
      launch_at_login: 1,
      minimize_to_tray: 1,
      reminder_enabled: 0,
      reminder_snooze_minutes: 20,
      reminder_time: "09:45",
      theme_mode: "dark",
      timezone: "America/Los_Angeles",
    });

    expect(JSON.parse(row.category_preferences)).toStrictEqual({
      fitness: {
        color: "#CC3355",
        label: "Movement",
      },
      nutrition: defaults.categoryPreferences.nutrition,
      productivity: defaults.categoryPreferences.productivity,
    });

    client.close();
  });
});
