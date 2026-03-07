import type Database from "better-sqlite3";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { DEFAULT_HABIT_CATEGORY } from "../shared/domain/habit";

export const habits = sqliteTable("habits", {
  category: text().notNull().default(DEFAULT_HABIT_CATEGORY),
  createdAt: text("created_at").notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text().notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const dailyHabitStatus = sqliteTable(
  "daily_habit_status",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    date: text().notNull(),
    habitCategory: text("habit_category")
      .notNull()
      .default(DEFAULT_HABIT_CATEGORY),
    habitCreatedAt: text("habit_created_at").notNull(),
    habitId: integer("habit_id").notNull(),
    habitName: text("habit_name").notNull(),
    habitSortOrder: integer("habit_sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.date, table.habitId] })]
);

export const dailySummary = sqliteTable("daily_summary", {
  allCompleted: integer("all_completed", { mode: "boolean" }).notNull(),
  completedAt: text("completed_at"),
  date: text().primaryKey(),
  freezeUsed: integer("freeze_used", { mode: "boolean" }).notNull(),
  streakCountAfterDay: integer("streak_count_after_day").notNull(),
});

export const streakState = sqliteTable("streak_state", {
  availableFreezes: integer("available_freezes").notNull(),
  bestStreak: integer("best_streak").notNull(),
  currentStreak: integer("current_streak").notNull(),
  id: integer().primaryKey(),
  lastEvaluatedDate: text("last_evaluated_date"),
});

export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

export const schema = {
  dailyHabitStatus,
  dailySummary,
  habits,
  settings,
  streakState,
};

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

export function repairLegacySchema(db: Database.Database): void {
  ensureHabitsCategoryColumn(db);
  ensureDailyHabitStatusSnapshotColumns(db);
}
