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

import { exportCsvData } from "./csv-export";
import {
  getDatabasePreview,
  replaceDatabase,
  runWithDatabaseError,
  validateDatabase,
} from "./database-transfer";
import { getElectronApp } from "./electron-app";
import { schema } from "./schema";

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

export interface SqliteDatabaseClientOptions {
  databasePath?: string;
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

  run = runWithDatabaseError;

  transaction<A>(label: string, execute: () => A): A {
    return runWithDatabaseError(label, () =>
      this.getDrizzle().transaction(() => execute())
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

  exportCsvData(destinationPath: string): void {
    exportCsvData(this.getSqlite(), destinationPath);
  }

  validateDatabase = validateDatabase;

  getDatabasePreview = getDatabasePreview;

  replaceDatabase(sourcePath: string): void {
    replaceDatabase(sourcePath, this.getDatabasePath(), () => this.close());
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
