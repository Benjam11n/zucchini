/**
 * SQLite database client wrapper.
 *
 * Manages the `better-sqlite3` connection in WAL mode, exposes a Drizzle ORM
 * instance with the full schema, and provides transaction, backup, and
 * replacement helpers. The `DatabaseError` class is used by the IPC error
 * serializer to distinguish database failures from validation errors.
 */
import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { Effect } from "effect";

import { getElectronApp } from "./electron-app";
import { schema } from "./schema";

export class DatabaseError extends Error {
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

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

export interface SqliteDatabaseClientOptions {
  databasePath?: string;
}

function runWithDatabaseError<A>(label: string, execute: () => A): A {
  return Effect.runSync(
    Effect.try({
      catch: (cause) => new DatabaseError(label, cause),
      try: execute,
    })
  );
}

export class SqliteDatabaseClient {
  private database: Database.Database | null = null;
  private drizzleDb: DrizzleDatabase | null = null;
  private readonly databasePath: string | undefined;

  constructor(options: SqliteDatabaseClientOptions = {}) {
    this.databasePath = options.databasePath;
  }

  getDatabasePath(): string {
    if (this.databasePath) {
      fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
      return this.databasePath;
    }

    const electronApp = getElectronApp();
    if (!electronApp) {
      throw new Error(
        "Electron app paths are unavailable. Pass an explicit databasePath."
      );
    }

    const userData = electronApp.getPath("userData");
    fs.mkdirSync(userData, { recursive: true });
    return path.join(userData, "zucchini.db");
  }

  run<A>(label: string, execute: () => A): A {
    return this.runWithDatabaseError(label, execute);
  }

  private runWithDatabaseError<A>(label: string, execute: () => A): A {
    void this.databasePath;
    return runWithDatabaseError(label, execute);
  }

  transaction<A>(label: string, execute: () => A): A {
    return Effect.runSync(
      Effect.try({
        catch: (cause) => new DatabaseError(label, cause),
        try: () => this.getDrizzle().transaction(() => execute()),
      })
    );
  }

  getSqlite(): Database.Database {
    if (!this.database) {
      this.database = new Database(this.getDatabasePath());
    }

    return this.database;
  }

  getDrizzle(): DrizzleDatabase {
    if (!this.drizzleDb) {
      this.drizzleDb = drizzle(this.getSqlite(), { schema });
    }

    return this.drizzleDb;
  }

  async exportBackup(destinationPath: string): Promise<void> {
    await this.getSqlite().backup(destinationPath);
  }

  validateDatabase(sourcePath: string): void {
    this.runWithDatabaseError("validateDatabase", () => {
      const database = new Database(sourcePath, {
        fileMustExist: true,
        readonly: true,
      });

      try {
        const integrityCheck = database.pragma("integrity_check(1)", {
          simple: true,
        });

        if (integrityCheck !== "ok") {
          throw new Error("SQLite integrity check failed.");
        }

        const hasSettingsTable = database
          .prepare(
            "select 1 from sqlite_master where type = 'table' and name = ?"
          )
          .pluck()
          .get("settings");

        if (hasSettingsTable !== 1) {
          throw new Error("Backup is missing the Zucchini settings table.");
        }
      } finally {
        database.close();
      }
    });
  }

  replaceDatabase(sourcePath: string): void {
    const databasePath = this.getDatabasePath();

    if (path.resolve(sourcePath) === path.resolve(databasePath)) {
      return;
    }

    this.close();

    for (const sidecarPath of [`${databasePath}-shm`, `${databasePath}-wal`]) {
      if (fs.existsSync(sidecarPath)) {
        fs.rmSync(sidecarPath);
      }
    }

    fs.copyFileSync(sourcePath, databasePath);
  }

  resetDatabase(): void {
    const databasePath = this.getDatabasePath();

    this.close();

    for (const resetPath of [
      databasePath,
      `${databasePath}-shm`,
      `${databasePath}-wal`,
    ]) {
      if (fs.existsSync(resetPath)) {
        fs.rmSync(resetPath);
      }
    }
  }

  close(): void {
    this.drizzleDb = null;

    if (!this.database) {
      return;
    }

    this.database.close();
    this.database = null;
  }
}
