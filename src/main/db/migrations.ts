import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";

import type { SqliteDatabaseClient } from "./sqlite-client";

function resolveMigrationsFolder(): string {
  const candidates = [
    path.join(process.cwd(), "drizzle"),
    path.join(app.getAppPath(), "drizzle"),
    path.join(__dirname, "../drizzle"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to find Drizzle migrations folder. Checked: ${candidates.join(", ")}`
  );
}

// This bootstrap only exists for databases created before Drizzle migrations.
function bootstrapInitialMigrationIfNeeded(
  client: SqliteDatabaseClient,
  migrationsFolder: string
): void {
  const sqlite = client.getSqlite();
  const existingAppTables = sqlite
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name IN (
        'habits',
        'daily_habit_status',
        'habit_period_status',
        'daily_summary',
        'streak_state',
        'settings'
      )
    `)
    .all() as { name: string }[];

  if (existingAppTables.length === 0) {
    return;
  }

  const migrationsTableExists = sqlite
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = '__drizzle_migrations'
    `)
    .get() as { name: string } | undefined;

  const migrationCount = migrationsTableExists
    ? (
        sqlite
          .prepare(`SELECT count(*) as count FROM "__drizzle_migrations"`)
          .get() as {
          count: number;
        }
      ).count
    : 0;

  if (migrationCount > 0) {
    return;
  }

  const journal = JSON.parse(
    fs.readFileSync(
      path.join(migrationsFolder, "meta", "_journal.json"),
      "utf8"
    )
  ) as {
    entries: {
      tag: string;
      when: number;
    }[];
  };

  const [initialMigration] = journal.entries;

  if (!initialMigration) {
    return;
  }

  const migrationSql = fs.readFileSync(
    path.join(migrationsFolder, `${initialMigration.tag}.sql`),
    "utf8"
  );
  const migrationHash = crypto
    .createHash("sha256")
    .update(migrationSql)
    .digest("hex");

  if (!migrationsTableExists) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        hash text NOT NULL,
        created_at numeric
      )
    `);
  }

  sqlite
    .prepare(`
      INSERT INTO "__drizzle_migrations" ("hash", "created_at")
      VALUES (?, ?)
    `)
    .run(migrationHash, initialMigration.when);
}

export function runMigrations(client: SqliteDatabaseClient): void {
  client.run("initializeSchema", () => {
    const migrationsFolder = resolveMigrationsFolder();
    bootstrapInitialMigrationIfNeeded(client, migrationsFolder);
    migrate(client.getDrizzle(), {
      migrationsFolder,
    });
  });
}
