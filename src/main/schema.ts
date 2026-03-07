import type Database from "better-sqlite3";

import { DEFAULT_HABIT_CATEGORY } from "@/shared/domain/habit";

function ensureHabitsCategoryColumn(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info(habits)").all() as {
    name: string;
  }[];

  if (columns.some((column) => column.name === "category")) {
    return;
  }

  db.prepare(
    `ALTER TABLE habits ADD COLUMN category TEXT NOT NULL DEFAULT '${DEFAULT_HABIT_CATEGORY}'`
  ).run();
}

function ensureDailyHabitStatusSnapshotColumns(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info(daily_habit_status)").all() as {
    name: string;
  }[];
  const columnNames = new Set(columns.map((column) => column.name));
  let addedSnapshotColumn = false;

  if (!columnNames.has("habit_name")) {
    db.prepare(
      "ALTER TABLE daily_habit_status ADD COLUMN habit_name TEXT"
    ).run();
    addedSnapshotColumn = true;
  }

  if (!columnNames.has("habit_category")) {
    db.prepare(
      `ALTER TABLE daily_habit_status ADD COLUMN habit_category TEXT NOT NULL DEFAULT '${DEFAULT_HABIT_CATEGORY}'`
    ).run();
    addedSnapshotColumn = true;
  }

  if (!columnNames.has("habit_sort_order")) {
    db.prepare(
      "ALTER TABLE daily_habit_status ADD COLUMN habit_sort_order INTEGER NOT NULL DEFAULT 0"
    ).run();
    addedSnapshotColumn = true;
  }

  if (!columnNames.has("habit_created_at")) {
    db.prepare(
      "ALTER TABLE daily_habit_status ADD COLUMN habit_created_at TEXT NOT NULL DEFAULT ''"
    ).run();
    addedSnapshotColumn = true;
  }

  if (!addedSnapshotColumn) {
    return;
  }

  db.prepare(`
    UPDATE daily_habit_status
    SET
      habit_name = COALESCE(
        (SELECT name FROM habits WHERE habits.id = daily_habit_status.habit_id),
        habit_name,
        ''
      ),
      habit_category = COALESCE(
        (SELECT category FROM habits WHERE habits.id = daily_habit_status.habit_id),
        habit_category,
        '${DEFAULT_HABIT_CATEGORY}'
      ),
      habit_sort_order = COALESCE(
        (SELECT sort_order FROM habits WHERE habits.id = daily_habit_status.habit_id),
        habit_sort_order,
        0
      ),
      habit_created_at = COALESCE(
        (SELECT created_at FROM habits WHERE habits.id = daily_habit_status.habit_id),
        habit_created_at,
        ''
      )
  `).run();
}

export function initializeSqliteSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '${DEFAULT_HABIT_CATEGORY}',
      sort_order INTEGER NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_habit_status (
      date TEXT NOT NULL,
      habit_id INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      habit_name TEXT NOT NULL,
      habit_category TEXT NOT NULL DEFAULT '${DEFAULT_HABIT_CATEGORY}',
      habit_sort_order INTEGER NOT NULL DEFAULT 0,
      habit_created_at TEXT NOT NULL,
      PRIMARY KEY (date, habit_id)
    );

    CREATE TABLE IF NOT EXISTS daily_summary (
      date TEXT PRIMARY KEY,
      all_completed INTEGER NOT NULL,
      streak_count_after_day INTEGER NOT NULL,
      freeze_used INTEGER NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS streak_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_streak INTEGER NOT NULL,
      best_streak INTEGER NOT NULL,
      available_freezes INTEGER NOT NULL,
      last_evaluated_date TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  ensureHabitsCategoryColumn(db);
  ensureDailyHabitStatusSnapshotColumns(db);
}
