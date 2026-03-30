import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { Effect } from "effect";

import { schema } from "./schema";

const require = createRequire(import.meta.url);

function getElectronApp(): {
  getPath: (name: "userData") => string;
} | null {
  try {
    const electron = require("electron") as {
      app?: {
        getPath: (name: "userData") => string;
      };
    };

    return electron.app ?? null;
  } catch {
    return null;
  }
}

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

export class SqliteDatabaseClient {
  private database: Database.Database | null = null;
  private drizzleDb: DrizzleDatabase | null = null;
  private readonly databasePath: string | undefined;
  // eslint-disable-next-line class-methods-use-this
  private readonly runWithDatabaseError = <A>(
    label: string,
    execute: () => A
  ): A =>
    Effect.runSync(
      Effect.try({
        catch: (cause) => new DatabaseError(label, cause),
        try: execute,
      })
    );

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

  close(): void {
    this.drizzleDb = null;

    if (!this.database) {
      return;
    }

    this.database.close();
    this.database = null;
  }
}
