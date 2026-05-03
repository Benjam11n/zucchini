import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

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

const describeWithSqlite =
  canUseSqlite() || process.env["CI"] ? describe : describe.skip;

describeWithSqlite("runMigrations", () => {
  it("initializes the database schema for a fresh install", () => {
    const databasePath = createTempDbPath("fresh-install");
    const client = new SqliteDatabaseClient({ databasePath });
    runMigrations(client);

    const sqlite = client.getSqlite();
    const settingsTableExists = sqlite
      .prepare(
        "select 1 from sqlite_master where type = 'table' and name = 'settings'"
      )
      .pluck()
      .get();
    const habitStreakStateTableExists = sqlite
      .prepare(
        "select 1 from sqlite_master where type = 'table' and name = 'habit_streak_state'"
      )
      .pluck()
      .get();
    const migrationsCount = sqlite
      .prepare(`select count(*) as count from "__drizzle_migrations"`)
      .get() as { count: number };

    expect(settingsTableExists).toBe(1);
    expect(habitStreakStateTableExists).toBe(1);
    expect(migrationsCount.count).toBeGreaterThan(0);

    client.close();
  });

  it("backfills legacy focus sessions without timer session ids", () => {
    const databasePath = createTempDbPath("legacy-focus-session-ids");
    const sqlite = new Database(databasePath);

    sqlite.exec(`
      CREATE TABLE "focus_sessions" (
        "completed_at" text NOT NULL,
        "completed_date" text NOT NULL,
        "duration_seconds" integer NOT NULL,
        "entry_kind" text DEFAULT 'completed' NOT NULL,
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "started_at" text NOT NULL,
        "timer_session_id" text
      );

      CREATE TABLE "__drizzle_migrations" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "hash" text NOT NULL,
        "created_at" numeric
      );
    `);

    sqlite
      .prepare(
        `INSERT INTO "focus_sessions" (
          "completed_at",
          "completed_date",
          "duration_seconds",
          "entry_kind",
          "id",
          "started_at",
          "timer_session_id"
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "2026-03-13T09:25:00.000Z",
        "2026-03-13",
        1500,
        "completed",
        7,
        "2026-03-13T09:00:00.000Z",
        null
      );
    sqlite
      .prepare(
        `INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)`
      )
      .run("pre-0014", 1_776_500_000_000);
    sqlite.close();

    const client = new SqliteDatabaseClient({ databasePath });
    runMigrations(client);

    const migratedFocusSession = client
      .getSqlite()
      .prepare(
        `select "timer_session_id" as timerSessionId from "focus_sessions" where "id" = 7`
      )
      .get() as { timerSessionId: string };
    const notNullInfo = client
      .getSqlite()
      .prepare(`pragma table_info("focus_sessions")`)
      .all() as { name: string; notnull: number }[];
    const timerSessionIdColumn = notNullInfo.find(
      (column) => column.name === "timer_session_id"
    );

    expect(migratedFocusSession.timerSessionId).toBe("legacy-7");
    expect(timerSessionIdColumn?.notnull).toBe(1);

    client.close();
  });
});
