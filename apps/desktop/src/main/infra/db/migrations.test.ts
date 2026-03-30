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

describe.skipIf(!canUseSqlite())("runMigrations", () => {
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
    const migrationsCount = sqlite
      .prepare(`select count(*) as count from "__drizzle_migrations"`)
      .get() as { count: number };

    expect(settingsTableExists).toBe(1);
    expect(migrationsCount.count).toBeGreaterThan(0);

    client.close();
  });
});
