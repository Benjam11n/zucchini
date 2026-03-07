import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import { Effect } from "effect";
import type { Habit, HabitWithStatus } from "../shared/domain/habit";
import type { ReminderSettings } from "../shared/domain/settings";
import { previewOpenDay, settleClosedDay } from "../shared/domain/streak-engine";
import type { DailySummary, StreakState } from "../shared/domain/streak";
import type { TodayState } from "../shared/types/ipc";

type SettingRow = {
  key: string;
  value: string;
};

type HistoryRow = {
  date: string;
  allCompleted: number;
  streakCountAfterDay: number;
  freezeUsed: number;
  completedAt: string | null;
};

type HabitRow = {
  id: number;
  name: string;
  sortOrder: number;
  isArchived: number;
  createdAt: string;
};

type HabitWithStatusRow = HabitRow & {
  completed: number;
};

class DatabaseError extends Error {
  constructor(
    message: string,
    readonly cause: unknown,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

let database: Database.Database | null = null;

function runDb<A>(label: string, execute: () => A): A {
  return Effect.runSync(
    Effect.try({
      try: execute,
      catch: (cause) => new DatabaseError(label, cause),
    }),
  );
}

function getDbPath(): string {
  const userData = app.getPath("userData");
  fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, "zucchini.db");
}

function getDb(): Database.Database {
  if (!database) {
    database = new Database(getDbPath());
  }

  return database;
}

export function initializeDatabase(): void {
  runDb("initializeDatabase", () => {
    const db = getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
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

    seedHabitsIfEmpty(db);
    seedStateIfEmpty(db);
    syncRollingState(db);
  });
}

export function getTodayState(): TodayState {
  return runDb("getTodayState", () => {
    const db = getDb();
    syncRollingState(db);
    return buildTodayState(db);
  });
}

export function toggleHabit(habitId: number): TodayState {
  return runDb("toggleHabit", () => {
    const db = getDb();
    syncRollingState(db);

    db.prepare(`
      UPDATE daily_habit_status
      SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END
      WHERE date = ? AND habit_id = ?
    `).run(getTodayDate(), habitId);

    return buildTodayState(db);
  });
}

export function getHistory(): DailySummary[] {
  return runDb("getHistory", () => {
    const db = getDb();
    syncRollingState(db);

    const settledHistory = (
      db
        .prepare(`
        SELECT
          date,
          all_completed AS allCompleted,
          streak_count_after_day AS streakCountAfterDay,
          freeze_used AS freezeUsed,
          completed_at AS completedAt
        FROM daily_summary
        ORDER BY date DESC
        LIMIT 59
      `)
        .all() as HistoryRow[]
    ).map(mapHistoryRow);

    return [getTodayPreviewSummary(db), ...settledHistory].slice(0, 60);
  });
}

export function updateReminderSettings(settings: ReminderSettings): ReminderSettings {
  return runDb("updateReminderSettings", () => {
    const db = getDb();
    upsertSetting(db, "reminderEnabled", String(settings.reminderEnabled));
    upsertSetting(db, "reminderTime", settings.reminderTime);
    upsertSetting(db, "timezone", settings.timezone);
    return getReminderSettings(db);
  });
}

export function createHabit(name: string): TodayState {
  return runDb("createHabit", () => {
    const db = getDb();
    syncRollingState(db);

    const trimmedName = name.trim();
    if (!trimmedName) {
      return buildTodayState(db);
    }

    const maxSortOrder = db
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) as maxSortOrder FROM habits WHERE is_archived = 0",
      )
      .get() as { maxSortOrder: number };

    const result = db
      .prepare(`
        INSERT INTO habits (name, sort_order, is_archived, created_at)
        VALUES (?, ?, 0, ?)
      `)
      .run(trimmedName, maxSortOrder.maxSortOrder + 1, new Date().toISOString());

    ensureStatusRow(db, getTodayDate(), Number(result.lastInsertRowid));
    return buildTodayState(db);
  });
}

export function renameHabit(habitId: number, name: string): TodayState {
  return runDb("renameHabit", () => {
    const db = getDb();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return buildTodayState(db);
    }

    db.prepare("UPDATE habits SET name = ? WHERE id = ? AND is_archived = 0").run(
      trimmedName,
      habitId,
    );

    return buildTodayState(db);
  });
}

export function archiveHabit(habitId: number): TodayState {
  return runDb("archiveHabit", () => {
    const db = getDb();
    db.prepare("UPDATE habits SET is_archived = 1 WHERE id = ?").run(habitId);
    normalizeHabitOrder(db);
    syncRollingState(db);
    return buildTodayState(db);
  });
}

export function reorderHabits(habitIds: number[]): TodayState {
  return runDb("reorderHabits", () => {
    const db = getDb();
    const activeHabits = getHabits(db);

    if (habitIds.length !== activeHabits.length) {
      return buildTodayState(db);
    }

    const update = db.prepare("UPDATE habits SET sort_order = ? WHERE id = ?");
    const transaction = db.transaction((orderedIds: number[]) => {
      orderedIds.forEach((habitId, index) => {
        update.run(index, habitId);
      });
    });

    transaction(habitIds);
    return buildTodayState(db);
  });
}

function seedHabitsIfEmpty(db: Database.Database): void {
  const habitCount = db
    .prepare("SELECT COUNT(*) as count FROM habits WHERE is_archived = 0")
    .get() as { count: number };

  if (habitCount.count > 0) {
    return;
  }

  const insertHabit = db.prepare(`
    INSERT INTO habits (name, sort_order, is_archived, created_at)
    VALUES (@name, @sortOrder, 0, @createdAt)
  `);

  const now = new Date().toISOString();
  insertHabit.run({ name: "Review goals", sortOrder: 0, createdAt: now });
  insertHabit.run({ name: "Move for 20 minutes", sortOrder: 1, createdAt: now });
  insertHabit.run({ name: "Write one line of reflection", sortOrder: 2, createdAt: now });
}

function seedStateIfEmpty(db: Database.Database): void {
  db.prepare(`
    INSERT INTO streak_state (id, current_streak, best_streak, available_freezes, last_evaluated_date)
    VALUES (1, 0, 0, 1, NULL)
    ON CONFLICT(id) DO NOTHING
  `).run();

  upsertSetting(db, "reminderEnabled", "true");
  upsertSetting(db, "reminderTime", "20:30");
  upsertSetting(db, "timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
}

function buildTodayState(db: Database.Database): TodayState {
  const today = getTodayDate();
  ensureStatusRowsForDate(db, today);

  const habits = getHabitsWithStatus(db, today);
  const settledStreak = getPersistedStreakState(db);
  const todayCompleted = habits.length > 0 && habits.every((habit) => habit.completed);
  const preview = previewOpenDay(settledStreak, todayCompleted);

  return {
    date: today,
    habits,
    streak: {
      currentStreak: preview.currentStreak,
      bestStreak: preview.bestStreak,
      availableFreezes: preview.availableFreezes,
      lastEvaluatedDate: settledStreak.lastEvaluatedDate,
    },
    settings: getReminderSettings(db),
  };
}

function getTodayPreviewSummary(db: Database.Database): DailySummary {
  const todayState = buildTodayState(db);
  const allCompleted =
    todayState.habits.length > 0 && todayState.habits.every((habit) => habit.completed);

  return {
    date: todayState.date,
    allCompleted,
    streakCountAfterDay: todayState.streak.currentStreak,
    freezeUsed: false,
    completedAt: allCompleted ? new Date().toISOString() : null,
  };
}

function syncRollingState(db: Database.Database): void {
  const today = getTodayDate();
  ensureStatusRowsForDate(db, today);

  const streak = getPersistedStreakState(db);
  const yesterday = addDays(today, -1);
  const firstTrackedDate = getFirstTrackedDate(db);

  if (!firstTrackedDate) {
    return;
  }

  let cursor = streak.lastEvaluatedDate ? addDays(streak.lastEvaluatedDate, 1) : firstTrackedDate;
  if (compareDateKeys(cursor, yesterday) > 0) {
    return;
  }

  let currentStreak = streak.currentStreak;
  let bestStreak = streak.bestStreak;
  let availableFreezes = streak.availableFreezes;

  while (compareDateKeys(cursor, yesterday) <= 0) {
    ensureStatusRowsForDate(db, cursor);
    const habits = getHabitsWithStatus(db, cursor);
    const allCompleted = habits.length > 0 && habits.every((habit) => habit.completed);
    const completedAt = allCompleted
      ? (getExistingCompletedAt(db, cursor) ?? `${cursor}T23:59:59.000`)
      : null;
    const nextState = settleClosedDay(
      {
        currentStreak,
        bestStreak,
        availableFreezes,
      },
      allCompleted,
      completedAt,
    );

    currentStreak = nextState.currentStreak;
    bestStreak = nextState.bestStreak;
    availableFreezes = nextState.availableFreezes;

    db.prepare(`
      INSERT INTO daily_summary (date, all_completed, streak_count_after_day, freeze_used, completed_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        all_completed = excluded.all_completed,
        streak_count_after_day = excluded.streak_count_after_day,
        freeze_used = excluded.freeze_used,
        completed_at = excluded.completed_at
    `).run(
      cursor,
      Number(nextState.allCompleted),
      currentStreak,
      Number(nextState.freezeUsed),
      nextState.completedAt,
    );

    cursor = addDays(cursor, 1);
  }

  db.prepare(`
    UPDATE streak_state
    SET current_streak = ?, best_streak = ?, available_freezes = ?, last_evaluated_date = ?
    WHERE id = 1
  `).run(currentStreak, bestStreak, availableFreezes, yesterday);
}

function getFirstTrackedDate(db: Database.Database): string | null {
  const row = db
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
}

function getExistingCompletedAt(db: Database.Database, date: string): string | null {
  const row = db
    .prepare("SELECT completed_at as completedAt FROM daily_summary WHERE date = ?")
    .get(date) as { completedAt: string | null } | undefined;

  return row?.completedAt ?? null;
}

function getHabits(db: Database.Database): Habit[] {
  return (
    db
      .prepare(`
      SELECT
        id,
        name,
        sort_order AS sortOrder,
        is_archived AS isArchived,
        created_at AS createdAt
      FROM habits
      WHERE is_archived = 0
      ORDER BY sort_order ASC, id ASC
    `)
      .all() as HabitRow[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isArchived: Boolean(row.isArchived),
    createdAt: row.createdAt,
  }));
}

function getHabitsWithStatus(db: Database.Database, date: string): HabitWithStatus[] {
  return (
    db
      .prepare(`
      SELECT
        h.id,
        h.name,
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
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isArchived: Boolean(row.isArchived),
    createdAt: row.createdAt,
    completed: Boolean(row.completed),
  }));
}

function getReminderSettings(db: Database.Database): ReminderSettings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as SettingRow[];
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    reminderEnabled: map.get("reminderEnabled") === "true",
    reminderTime: map.get("reminderTime") ?? "20:30",
    timezone: map.get("timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function getPersistedStreakState(db: Database.Database): StreakState {
  return db
    .prepare(`
    SELECT
      current_streak AS currentStreak,
      best_streak AS bestStreak,
      available_freezes AS availableFreezes,
      last_evaluated_date AS lastEvaluatedDate
    FROM streak_state
    WHERE id = 1
  `)
    .get() as StreakState;
}

function upsertSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

function ensureStatusRowsForDate(db: Database.Database, date: string): void {
  const insert = db.prepare(`
    INSERT INTO daily_habit_status (date, habit_id, completed)
    VALUES (?, ?, 0)
    ON CONFLICT(date, habit_id) DO NOTHING
  `);

  getHabits(db).forEach((habit) => {
    insert.run(date, habit.id);
  });
}

function ensureStatusRow(db: Database.Database, date: string, habitId: number): void {
  db.prepare(`
    INSERT INTO daily_habit_status (date, habit_id, completed)
    VALUES (?, ?, 0)
    ON CONFLICT(date, habit_id) DO NOTHING
  `).run(date, habitId);
}

function normalizeHabitOrder(db: Database.Database): void {
  const update = db.prepare("UPDATE habits SET sort_order = ? WHERE id = ?");
  const habits = getHabits(db);

  habits.forEach((habit, index) => {
    update.run(index, habit.id);
  });
}

function mapHistoryRow(row: HistoryRow): DailySummary {
  return {
    date: row.date,
    allCompleted: Boolean(row.allCompleted),
    streakCountAfterDay: row.streakCountAfterDay,
    freezeUsed: Boolean(row.freezeUsed),
    completedAt: row.completedAt,
  };
}

function getTodayDate(): string {
  return formatDateKey(new Date());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, amount: number): string {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + amount);
  return formatDateKey(next);
}

function compareDateKeys(left: string, right: string): number {
  return left.localeCompare(right);
}
