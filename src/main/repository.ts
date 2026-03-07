import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { Effect } from "effect";
import { app } from "electron";

import {
  DEFAULT_HABIT_CATEGORY,
  normalizeHabitCategory,
} from "../shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitWithStatus,
} from "../shared/domain/habit";
import type { AppSettings, ThemeMode } from "../shared/domain/settings";
import type { DailySummary, StreakState } from "../shared/domain/streak";

interface SettingRow {
  key: string;
  value: string;
}

interface HistoryRow {
  date: string;
  allCompleted: number;
  streakCountAfterDay: number;
  freezeUsed: number;
  completedAt: string | null;
}

interface HabitRow {
  category: string;
  id: number;
  name: string;
  sortOrder: number;
  isArchived: number;
  createdAt: string;
}

type HabitWithStatusRow = HabitRow & {
  completed: number;
};

class DatabaseError extends Error {
  override cause: unknown;

  constructor(message: string, cause: unknown) {
    super(
      cause instanceof Error && cause.message
        ? `${message}: ${cause.message}`
        : message
    );
    this.cause = cause;
    this.name = "DatabaseError";
  }
}

export interface HabitRepository {
  initializeSchema(): void;
  seedDefaults(nowIso: string, timezone: string): void;
  getHabits(): Habit[];
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[];
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  toggleHabit(date: string, habitId: number): void;
  getSettledHistory(limit?: number): DailySummary[];
  getPersistedStreakState(): StreakState;
  savePersistedStreakState(state: StreakState): void;
  getSettings(defaultTimezone: string): AppSettings;
  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings;
  getFirstTrackedDate(): string | null;
  getExistingCompletedAt(date: string): string | null;
  saveDailySummary(summary: DailySummary): void;
  getMaxSortOrder(): number;
  insertHabit(
    name: string,
    category: HabitCategory,
    sortOrder: number,
    createdAt: string
  ): number;
  renameHabit(habitId: number, name: string): void;
  updateHabitCategory(habitId: number, category: HabitCategory): void;
  archiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}

export class SqliteHabitRepository implements HabitRepository {
  private database: Database.Database | null = null;

  private runDb<A>(label: string, execute: () => A): A {
    return Effect.runSync(
      Effect.try({
        catch: (cause) => new DatabaseError(label, cause),
        try: execute,
      })
    );
  }

  private getDbPath(): string {
    const userData = app.getPath("userData");
    fs.mkdirSync(userData, { recursive: true });
    return path.join(userData, "zucchini.db");
  }

  private getDb(): Database.Database {
    if (!this.database) {
      this.database = new Database(this.getDbPath());
    }

    return this.database;
  }

  initializeSchema(): void {
    this.runDb("initializeSchema", () => {
      this.getDb().exec(`
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

      this.ensureHabitsCategoryColumn();
    });
  }

  seedDefaults(nowIso: string, timezone: string): void {
    this.runDb("seedDefaults", () => {
      const db = this.getDb();
      const habitCount = db
        .prepare("SELECT COUNT(*) as count FROM habits WHERE is_archived = 0")
        .get() as { count: number };

      if (habitCount.count === 0) {
        const insertHabit = db.prepare(`
          INSERT INTO habits (name, category, sort_order, is_archived, created_at)
          VALUES (@name, @category, @sortOrder, 0, @createdAt)
        `);

        insertHabit.run({
          category: "nutrition",
          createdAt: nowIso,
          name: "Eat a whole food meal",
          sortOrder: 0,
        });
        insertHabit.run({
          category: "productivity",
          createdAt: nowIso,
          name: "Deep work block",
          sortOrder: 1,
        });
        insertHabit.run({
          category: "fitness",
          createdAt: nowIso,
          name: "Move for 20 minutes",
          sortOrder: 2,
        });
      }

      db.prepare(`
        INSERT INTO streak_state (id, current_streak, best_streak, available_freezes, last_evaluated_date)
        VALUES (1, 0, 0, 1, NULL)
        ON CONFLICT(id) DO NOTHING
      `).run();

      this.upsertSetting("reminderEnabled", "true");
      this.upsertSetting("reminderTime", "20:30");
      this.upsertSetting("themeMode", "system");
      this.upsertSetting("timezone", timezone);
    });
  }

  getHabits(): Habit[] {
    return this.runDb("getHabits", () =>
      (
        this.getDb()
          .prepare(`
          SELECT
            id,
            name,
            category,
            sort_order AS sortOrder,
            is_archived AS isArchived,
            created_at AS createdAt
          FROM habits
          WHERE is_archived = 0
          ORDER BY sort_order ASC, id ASC
        `)
          .all() as HabitRow[]
      ).map((row) => ({
        category: normalizeHabitCategory(row.category),
        createdAt: row.createdAt,
        id: row.id,
        isArchived: Boolean(row.isArchived),
        name: row.name,
        sortOrder: row.sortOrder,
      }))
    );
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.runDb("getHabitsWithStatus", () =>
      (
        this.getDb()
          .prepare(`
          SELECT
            h.id,
            h.name,
            h.category AS category,
            h.sort_order AS sortOrder,
            h.is_archived AS isArchived,
            h.created_at AS createdAt,
            COALESCE(dhs.completed, 0) AS completed
          FROM habits h
          LEFT JOIN daily_habit_status dhs
            ON dhs.habit_id = h.id AND dhs.date = ?
          WHERE h.is_archived = 0
          ORDER BY h.sort_order ASC, h.id ASC
        `)
          .all(date) as HabitWithStatusRow[]
      ).map((row) => ({
        category: normalizeHabitCategory(row.category),
        completed: Boolean(row.completed),
        createdAt: row.createdAt,
        id: row.id,
        isArchived: Boolean(row.isArchived),
        name: row.name,
        sortOrder: row.sortOrder,
      }))
    );
  }

  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.runDb("getHistoricalHabitsWithStatus", () =>
      (
        this.getDb()
          .prepare(`
          SELECT
            h.id,
            h.name,
            h.category AS category,
            h.sort_order AS sortOrder,
            h.is_archived AS isArchived,
            h.created_at AS createdAt,
            dhs.completed AS completed
          FROM daily_habit_status dhs
          INNER JOIN habits h
            ON h.id = dhs.habit_id
          WHERE dhs.date = ?
          ORDER BY h.sort_order ASC, h.id ASC
        `)
          .all(date) as HabitWithStatusRow[]
      ).map((row) => ({
        category: normalizeHabitCategory(row.category),
        completed: Boolean(row.completed),
        createdAt: row.createdAt,
        id: row.id,
        isArchived: Boolean(row.isArchived),
        name: row.name,
        sortOrder: row.sortOrder,
      }))
    );
  }

  ensureStatusRowsForDate(date: string): void {
    this.runDb("ensureStatusRowsForDate", () => {
      const insert = this.getDb().prepare(`
        INSERT INTO daily_habit_status (date, habit_id, completed)
        VALUES (?, ?, 0)
        ON CONFLICT(date, habit_id) DO NOTHING
      `);

      this.getHabits().forEach((habit) => {
        insert.run(date, habit.id);
      });
    });
  }

  ensureStatusRow(date: string, habitId: number): void {
    this.runDb("ensureStatusRow", () => {
      this.getDb()
        .prepare(`
          INSERT INTO daily_habit_status (date, habit_id, completed)
          VALUES (?, ?, 0)
          ON CONFLICT(date, habit_id) DO NOTHING
        `)
        .run(date, habitId);
    });
  }

  toggleHabit(date: string, habitId: number): void {
    this.runDb("toggleHabit", () => {
      this.getDb()
        .prepare(`
          UPDATE daily_habit_status
          SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END
          WHERE date = ? AND habit_id = ?
        `)
        .run(date, habitId);
    });
  }

  getSettledHistory(limit?: number): DailySummary[] {
    return this.runDb("getSettledHistory", () => {
      const baseQuery = `
          SELECT
            date,
            all_completed AS allCompleted,
            streak_count_after_day AS streakCountAfterDay,
            freeze_used AS freezeUsed,
            completed_at AS completedAt
          FROM daily_summary
          ORDER BY date DESC
        `;

      const rows =
        limit === undefined
          ? (this.getDb().prepare(baseQuery).all() as HistoryRow[])
          : (this.getDb()
              .prepare(`${baseQuery}\nLIMIT ?`)
              .all(limit) as HistoryRow[]);

      return rows.map((row) => ({
        allCompleted: Boolean(row.allCompleted),
        completedAt: row.completedAt,
        date: row.date,
        freezeUsed: Boolean(row.freezeUsed),
        streakCountAfterDay: row.streakCountAfterDay,
      }));
    });
  }

  getPersistedStreakState(): StreakState {
    return this.runDb(
      "getPersistedStreakState",
      () =>
        this.getDb()
          .prepare(`
          SELECT
            current_streak AS currentStreak,
            best_streak AS bestStreak,
            available_freezes AS availableFreezes,
            last_evaluated_date AS lastEvaluatedDate
          FROM streak_state
          WHERE id = 1
        `)
          .get() as StreakState
    );
  }

  savePersistedStreakState(state: StreakState): void {
    this.runDb("savePersistedStreakState", () => {
      this.getDb()
        .prepare(`
          UPDATE streak_state
          SET current_streak = ?, best_streak = ?, available_freezes = ?, last_evaluated_date = ?
          WHERE id = 1
        `)
        .run(
          state.currentStreak,
          state.bestStreak,
          state.availableFreezes,
          state.lastEvaluatedDate
        );
    });
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.runDb("getSettings", () => {
      const rows = this.getDb()
        .prepare("SELECT key, value FROM settings")
        .all() as SettingRow[];
      const map = new Map(rows.map((row) => [row.key, row.value]));

      return {
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderTime: map.get("reminderTime") ?? "20:30",
        themeMode: this.getThemeMode(map.get("themeMode")),
        timezone: map.get("timezone") ?? defaultTimezone,
      };
    });
  }

  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings {
    this.runDb("saveSettings", () => {
      this.upsertSetting("reminderEnabled", String(settings.reminderEnabled));
      this.upsertSetting("reminderTime", settings.reminderTime);
      this.upsertSetting("themeMode", settings.themeMode);
      this.upsertSetting("timezone", settings.timezone);
    });

    return this.getSettings(defaultTimezone);
  }

  getFirstTrackedDate(): string | null {
    return this.runDb("getFirstTrackedDate", () => {
      const row = this.getDb()
        .prepare(`
          SELECT MIN(date) as firstDate
          FROM (
            SELECT date FROM daily_habit_status
            UNION ALL
            SELECT date FROM daily_summary
          )
        `)
        .get() as { firstDate: string | null };

      return row.firstDate;
    });
  }

  getExistingCompletedAt(date: string): string | null {
    return this.runDb("getExistingCompletedAt", () => {
      const row = this.getDb()
        .prepare(
          "SELECT completed_at as completedAt FROM daily_summary WHERE date = ?"
        )
        .get(date) as { completedAt: string | null } | undefined;

      return row?.completedAt ?? null;
    });
  }

  saveDailySummary(summary: DailySummary): void {
    this.runDb("saveDailySummary", () => {
      this.getDb()
        .prepare(`
          INSERT INTO daily_summary (date, all_completed, streak_count_after_day, freeze_used, completed_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            all_completed = excluded.all_completed,
            streak_count_after_day = excluded.streak_count_after_day,
            freeze_used = excluded.freeze_used,
            completed_at = excluded.completed_at
        `)
        .run(
          summary.date,
          Number(summary.allCompleted),
          summary.streakCountAfterDay,
          Number(summary.freezeUsed),
          summary.completedAt
        );
    });
  }

  getMaxSortOrder(): number {
    return this.runDb("getMaxSortOrder", () => {
      const row = this.getDb()
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) as maxSortOrder FROM habits WHERE is_archived = 0"
        )
        .get() as { maxSortOrder: number };

      return row.maxSortOrder;
    });
  }

  insertHabit(
    name: string,
    category: HabitCategory,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.runDb("insertHabit", () => {
      const result = this.getDb()
        .prepare(`
          INSERT INTO habits (name, category, sort_order, is_archived, created_at)
          VALUES (?, ?, ?, 0, ?)
        `)
        .run(name, category, sortOrder, createdAt);

      return Number(result.lastInsertRowid);
    });
  }

  renameHabit(habitId: number, name: string): void {
    this.runDb("renameHabit", () => {
      this.getDb()
        .prepare("UPDATE habits SET name = ? WHERE id = ? AND is_archived = 0")
        .run(name, habitId);
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): void {
    this.runDb("updateHabitCategory", () => {
      this.getDb()
        .prepare(
          "UPDATE habits SET category = ? WHERE id = ? AND is_archived = 0"
        )
        .run(category, habitId);
    });
  }

  archiveHabit(habitId: number): void {
    this.runDb("archiveHabit", () => {
      this.getDb()
        .prepare("UPDATE habits SET is_archived = 1 WHERE id = ?")
        .run(habitId);
    });
  }

  normalizeHabitOrder(): void {
    this.runDb("normalizeHabitOrder", () => {
      const update = this.getDb().prepare(
        "UPDATE habits SET sort_order = ? WHERE id = ?"
      );
      this.getHabits().forEach((habit, index) => {
        update.run(index, habit.id);
      });
    });
  }

  reorderHabits(habitIds: number[]): void {
    this.runDb("reorderHabits", () => {
      const update = this.getDb().prepare(
        "UPDATE habits SET sort_order = ? WHERE id = ?"
      );
      const transaction = this.getDb().transaction((orderedIds: number[]) => {
        orderedIds.forEach((habitId, index) => {
          update.run(index, habitId);
        });
      });

      transaction(habitIds);
    });
  }

  private upsertSetting(key: string, value: string): void {
    this.getDb()
      .prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `)
      .run(key, value);
  }

  private getThemeMode(value: string | undefined): ThemeMode {
    if (value === "light" || value === "dark") {
      return value;
    }

    return "system";
  }

  private ensureHabitsCategoryColumn(): void {
    const columns = this.getDb().prepare("PRAGMA table_info(habits)").all() as {
      name: string;
    }[];

    if (columns.some((column) => column.name === "category")) {
      return;
    }

    this.getDb()
      .prepare(
        `ALTER TABLE habits ADD COLUMN category TEXT NOT NULL DEFAULT '${DEFAULT_HABIT_CATEGORY}'`
      )
      .run();
  }
}
