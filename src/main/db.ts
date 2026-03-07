import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import type { Habit, HabitWithStatus } from "../shared/domain/habit";
import type { ReminderSettings } from "../shared/domain/settings";
import type { DailySummary, StreakState } from "../shared/domain/streak";
import { awardedFreezeForStreak } from "../shared/domain/freeze";

type SettingRow = {
  key: string;
  value: string;
};

function getDbPath(): string {
  const userData = app.getPath("userData");
  fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, "zucchini.db");
}

const db = new Database(getDbPath());

export function initializeDatabase(): void {
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

  const habitCount = db
    .prepare("SELECT COUNT(*) as count FROM habits WHERE is_archived = 0")
    .get() as { count: number };

  if (habitCount.count === 0) {
    const insertHabit = db.prepare(`
      INSERT INTO habits (name, sort_order, is_archived, created_at)
      VALUES (@name, @sortOrder, 0, @createdAt)
    `);

    const now = new Date().toISOString();
    insertHabit.run({ name: "Review goals", sortOrder: 0, createdAt: now });
    insertHabit.run({ name: "Move for 20 minutes", sortOrder: 1, createdAt: now });
    insertHabit.run({ name: "Write one line of reflection", sortOrder: 2, createdAt: now });
  }

  db.prepare(`
    INSERT INTO streak_state (id, current_streak, best_streak, available_freezes, last_evaluated_date)
    VALUES (1, 0, 0, 1, NULL)
    ON CONFLICT(id) DO NOTHING
  `).run();

  const defaultSettings: SettingRow[] = [
    { key: "reminderEnabled", value: "true" },
    { key: "reminderTime", value: "20:30" },
    { key: "timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone },
  ];

  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (@key, @value)
    ON CONFLICT(key) DO NOTHING
  `);

  for (const setting of defaultSettings) {
    insertSetting.run(setting);
  }

  ensureTodayStatusRows();
  recomputeTodaySummary();
}

export function getTodayState() {
  const date = getTodayDate();
  ensureTodayStatusRows();
  recomputeTodaySummary();

  return {
    date,
    habits: getHabitsWithStatus(date),
    streak: getStreakState(),
    settings: getReminderSettings(),
  };
}

export function toggleHabit(habitId: number) {
  const date = getTodayDate();
  ensureTodayStatusRows();

  db.prepare(`
    UPDATE daily_habit_status
    SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END
    WHERE date = ? AND habit_id = ?
  `).run(date, habitId);

  recomputeTodaySummary();

  return getTodayState();
}

export function getHistory(): DailySummary[] {
  type HistoryRow = {
    date: string;
    allCompleted: number;
    streakCountAfterDay: number;
    freezeUsed: number;
    completedAt: string | null;
  };

  return (db
    .prepare(`
      SELECT
        date,
        all_completed AS allCompleted,
        streak_count_after_day AS streakCountAfterDay,
        freeze_used AS freezeUsed,
        completed_at AS completedAt
      FROM daily_summary
      ORDER BY date DESC
      LIMIT 60
    `)
    .all() as HistoryRow[])
    .map((row) => ({
      date: row.date,
      allCompleted: Boolean(row.allCompleted),
      streakCountAfterDay: row.streakCountAfterDay,
      freezeUsed: Boolean(row.freezeUsed),
      completedAt: row.completedAt,
    }));
}

export function updateReminderSettings(
  settings: ReminderSettings,
): ReminderSettings {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  upsert.run("reminderEnabled", String(settings.reminderEnabled));
  upsert.run("reminderTime", settings.reminderTime);
  upsert.run("timezone", settings.timezone);

  return getReminderSettings();
}

function getHabits(): Habit[] {
  return db.prepare(`
    SELECT
      id,
      name,
      sort_order AS sortOrder,
      is_archived AS isArchived,
      created_at AS createdAt
    FROM habits
    WHERE is_archived = 0
    ORDER BY sort_order ASC
  `).all() as Habit[];
}

function getHabitsWithStatus(date: string): HabitWithStatus[] {
  type HabitWithStatusRow = {
    id: number;
    name: string;
    sortOrder: number;
    isArchived: number;
    createdAt: string;
    completed: number;
  };

  return (db.prepare(`
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
    ORDER BY h.sort_order ASC
  `).all(date) as HabitWithStatusRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isArchived: Boolean(row.isArchived),
    createdAt: row.createdAt,
    completed: Boolean(row.completed),
  }));
}

function getReminderSettings(): ReminderSettings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as SettingRow[];
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    reminderEnabled: map.get("reminderEnabled") === "true",
    reminderTime: map.get("reminderTime") ?? "20:30",
    timezone: map.get("timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function getStreakState(): StreakState {
  return db.prepare(`
    SELECT
      current_streak AS currentStreak,
      best_streak AS bestStreak,
      available_freezes AS availableFreezes,
      last_evaluated_date AS lastEvaluatedDate
    FROM streak_state
    WHERE id = 1
  `).get() as StreakState;
}

function ensureTodayStatusRows(): void {
  const date = getTodayDate();
  const habits = getHabits();
  const insert = db.prepare(`
    INSERT INTO daily_habit_status (date, habit_id, completed)
    VALUES (?, ?, 0)
    ON CONFLICT(date, habit_id) DO NOTHING
  `);

  for (const habit of habits) {
    insert.run(date, habit.id);
  }
}

function recomputeTodaySummary(): void {
  const date = getTodayDate();
  const habits = getHabitsWithStatus(date);
  const allCompleted = habits.length > 0 && habits.every((habit) => habit.completed);
  const streak = getStreakState();

  let nextStreak = streak.currentStreak;
  let nextBest = streak.bestStreak;
  let nextFreezes = streak.availableFreezes;
  let freezeUsed = false;

  if (allCompleted) {
    nextStreak = streak.lastEvaluatedDate === date ? streak.currentStreak : streak.currentStreak + 1;
    nextBest = Math.max(streak.bestStreak, nextStreak);

    if (awardedFreezeForStreak(nextStreak)) {
      nextFreezes += 1;
    }
  }

  if (!allCompleted && streak.lastEvaluatedDate === date) {
    const existing = db.prepare(`
      SELECT freeze_used AS freezeUsed, streak_count_after_day AS streakCountAfterDay
      FROM daily_summary
      WHERE date = ?
    `).get(date) as { freezeUsed: number; streakCountAfterDay: number } | undefined;

    freezeUsed = Boolean(existing?.freezeUsed);
    nextStreak = existing?.streakCountAfterDay ?? streak.currentStreak;
  }

  db.prepare(`
    INSERT INTO daily_summary (date, all_completed, streak_count_after_day, freeze_used, completed_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      all_completed = excluded.all_completed,
      streak_count_after_day = excluded.streak_count_after_day,
      freeze_used = excluded.freeze_used,
      completed_at = excluded.completed_at
  `).run(
    date,
    Number(allCompleted),
    nextStreak,
    Number(freezeUsed),
    allCompleted ? new Date().toISOString() : null,
  );

  db.prepare(`
    UPDATE streak_state
    SET current_streak = ?, best_streak = ?, available_freezes = ?, last_evaluated_date = ?
    WHERE id = 1
  `).run(nextStreak, nextBest, nextFreezes, allCompleted ? date : streak.lastEvaluatedDate);
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
