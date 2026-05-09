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

import { DatabaseError } from "@/main/ports/database-error";

import { getElectronApp } from "./electron-app";
import { schema } from "./schema";

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

export interface SqliteDatabaseClientOptions {
  databasePath?: string;
}

const REQUIRED_BACKUP_SCHEMA = {
  daily_summary: [
    "all_completed",
    "completed_at",
    "date",
    "day_status",
    "freeze_used",
    "streak_count_after_day",
  ],
  day_status: ["created_at", "date", "kind"],
  focus_quota_goals: [
    "archived_at",
    "created_at",
    "frequency",
    "id",
    "is_archived",
    "target_minutes",
  ],
  focus_sessions: [
    "completed_at",
    "completed_date",
    "duration_seconds",
    "entry_kind",
    "id",
    "started_at",
    "timer_session_id",
  ],
  focus_timer_state: [
    "break_variant",
    "completed_focus_cycles",
    "cycle_id",
    "ends_at",
    "focus_duration_ms",
    "id",
    "last_completed_break_completed_at",
    "last_completed_break_timer_session_id",
    "last_completed_break_variant",
    "last_updated_at",
    "phase",
    "remaining_ms",
    "started_at",
    "status",
    "timer_session_id",
  ],
  habit_period_status: [
    "completed",
    "completed_count",
    "frequency",
    "habit_category",
    "habit_created_at",
    "habit_id",
    "habit_name",
    "habit_selected_weekdays",
    "habit_sort_order",
    "habit_target_count",
    "period_end",
    "period_start",
  ],
  habit_streak_state: [
    "best_streak",
    "current_streak",
    "habit_id",
    "last_evaluated_date",
  ],
  habits: [
    "category",
    "created_at",
    "frequency",
    "id",
    "is_archived",
    "name",
    "selected_weekdays",
    "sort_order",
    "target_count",
  ],
  reminder_runtime_state: [
    "id",
    "last_midnight_warning_sent_at",
    "last_missed_reminder_sent_at",
    "last_reminder_sent_at",
    "snoozed_until",
  ],
  settings: [
    "category_preferences",
    "focus_cycles_before_long_break",
    "focus_default_duration_seconds",
    "focus_long_break_seconds",
    "focus_short_break_seconds",
    "id",
    "launch_at_login",
    "minimize_to_tray",
    "reminder_enabled",
    "reminder_snooze_minutes",
    "reminder_time",
    "reset_focus_timer_shortcut",
    "theme_mode",
    "timezone",
    "toggle_focus_timer_shortcut",
    "wind_down_time",
  ],
  streak_state: [
    "available_freezes",
    "best_streak",
    "current_streak",
    "id",
    "last_evaluated_date",
  ],
  wind_down_action_status: ["action_id", "completed", "completed_at", "date"],
  wind_down_actions: ["created_at", "id", "name", "sort_order"],
  wind_down_runtime_state: ["id", "last_reminder_sent_at"],
} as const;

interface TableInfoRow {
  name: string;
}

type CsvCellValue = bigint | Buffer | null | number | string;
type CsvRow = Record<string, CsvCellValue>;

function quoteSqlIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function serializeCsvCell(value: CsvCellValue): string {
  if (value === null) {
    return "";
  }

  const text = Buffer.isBuffer(value)
    ? value.toString("base64")
    : String(value);

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function serializeCsvRow(values: CsvCellValue[]): string {
  return values.map(serializeCsvCell).join(",");
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

  exportCsvData(destinationPath: string): void {
    this.runWithDatabaseError("exportCsvData", () => {
      fs.mkdirSync(destinationPath, { recursive: true });

      const database = this.getSqlite();
      const tableRows = database
        .prepare(
          "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
        )
        .all() as TableInfoRow[];

      for (const tableRow of tableRows) {
        const tableName = tableRow.name;
        const columnRows = database
          .prepare(`pragma table_info(${quoteSqlIdentifier(tableName)})`)
          .all() as TableInfoRow[];
        const columnNames = columnRows.map((row) => row.name);
        const rows = database
          .prepare(`select * from ${quoteSqlIdentifier(tableName)}`)
          .all() as CsvRow[];
        const csvRows = [
          serializeCsvRow(columnNames),
          ...rows.map((row) =>
            serializeCsvRow(
              columnNames.map((columnName) => row[columnName] ?? null)
            )
          ),
        ];

        fs.writeFileSync(
          path.join(destinationPath, `${tableName}.csv`),
          `${csvRows.join("\n")}\n`
        );
      }
    });
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

        const tableRows = database
          .prepare(
            "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'"
          )
          .all() as TableInfoRow[];
        const tableNames = new Set(tableRows.map((row) => row.name));

        for (const [tableName, requiredColumns] of Object.entries(
          REQUIRED_BACKUP_SCHEMA
        )) {
          if (!tableNames.has(tableName)) {
            throw new Error(
              `Backup is missing the Zucchini ${tableName} table.`
            );
          }

          const columnRows = database
            .prepare(`pragma table_info(${quoteSqlIdentifier(tableName)})`)
            .all() as TableInfoRow[];
          const columnNames = new Set(columnRows.map((row) => row.name));

          for (const columnName of requiredColumns) {
            if (!columnNames.has(columnName)) {
              throw new Error(
                `Backup is missing the Zucchini ${tableName}.${columnName} column.`
              );
            }
          }
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
