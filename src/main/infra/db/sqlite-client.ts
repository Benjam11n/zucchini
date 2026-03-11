import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { Effect } from "effect";
import { app } from "electron";

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

export class SqliteDatabaseClient {
  private database: Database.Database | null = null;
  private drizzleDb: DrizzleDatabase | null = null;

  run<A>(label: string, execute: () => A): A {
    return Effect.runSync(
      Effect.try({
        catch: (cause) => new DatabaseError(label, cause),
        try: execute,
      })
    );
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
      const userData = app.getPath("userData");
      fs.mkdirSync(userData, { recursive: true });
      this.database = new Database(path.join(userData, "zucchini.db"));
    }

    return this.database;
  }

  getDrizzle(): DrizzleDatabase {
    if (!this.drizzleDb) {
      this.drizzleDb = drizzle(this.getSqlite(), { schema });
    }

    return this.drizzleDb;
  }
}
