import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_TABLE_ROWS = [
  "daily_summary",
  "day_status",
  "focus_quota_goals",
  "focus_sessions",
  "focus_timer_state",
  "habit_period_status",
  "habit_streak_state",
  "habits",
  "reminder_runtime_state",
  "settings",
  "streak_state",
  "wind_down_action_status",
  "wind_down_actions",
  "wind_down_runtime_state",
].map((name) => ({ name }));

const DEFAULT_COLUMN_ROWS = [
  "action_id",
  "all_completed",
  "archived_at",
  "available_freezes",
  "best_streak",
  "break_variant",
  "category",
  "category_preferences",
  "completed",
  "completed_at",
  "completed_count",
  "completed_date",
  "completed_focus_cycles",
  "created_at",
  "current_streak",
  "cycle_id",
  "date",
  "day_status",
  "duration_seconds",
  "ends_at",
  "entry_kind",
  "focus_cycles_before_long_break",
  "focus_default_duration_seconds",
  "focus_duration_ms",
  "focus_long_break_seconds",
  "focus_short_break_seconds",
  "freeze_used",
  "frequency",
  "habit_category",
  "habit_created_at",
  "habit_id",
  "habit_name",
  "habit_selected_weekdays",
  "habit_sort_order",
  "habit_target_count",
  "id",
  "is_archived",
  "kind",
  "last_completed_break_completed_at",
  "last_completed_break_timer_session_id",
  "last_completed_break_variant",
  "last_evaluated_date",
  "last_midnight_warning_sent_at",
  "last_missed_reminder_sent_at",
  "last_reminder_sent_at",
  "last_updated_at",
  "launch_at_login",
  "minimize_to_tray",
  "name",
  "period_end",
  "period_start",
  "phase",
  "remaining_ms",
  "reminder_enabled",
  "reminder_snooze_minutes",
  "reminder_time",
  "reset_focus_timer_shortcut",
  "selected_weekdays",
  "snoozed_until",
  "sort_order",
  "started_at",
  "status",
  "streak_count_after_day",
  "target_count",
  "target_minutes",
  "theme_mode",
  "timer_session_id",
  "timezone",
  "toggle_focus_timer_shortcut",
  "wind_down_time",
].map((name) => ({ name }));

function createMockDatabaseConstructor({
  close = vi.fn(),
  columnRowsByTable = {},
  pragma = vi.fn(() => "ok"),
  rowsByTable = {},
  tableRows = DEFAULT_TABLE_ROWS,
}: {
  close?: ReturnType<typeof vi.fn>;
  columnRowsByTable?: Record<string, { name: string }[]>;
  pragma?: ReturnType<typeof vi.fn>;
  rowsByTable?: Record<string, Record<string, unknown>[]>;
  tableRows?: { name: string }[];
}) {
  const all = vi.fn((..._args: unknown[]) => []);
  const database = {
    close,
    pragma,
    prepare: vi.fn((statement: string) => ({
      all: statement.includes("sqlite_master")
        ? vi.fn(() => tableRows)
        : vi.fn(() => {
            const tableName = statement.match(
              /pragma table_info\("([^"]+)"\)/
            )?.[1];
            if (tableName) {
              return columnRowsByTable[tableName] ?? DEFAULT_COLUMN_ROWS;
            }

            const selectedTableName = statement.match(
              /select \* from "([^"]+)"/
            )?.[1];

            return selectedTableName
              ? (rowsByTable[selectedTableName] ?? [])
              : all();
          }),
    })),
  };

  function MockDatabase() {
    return database;
  }

  class MockSqliteError extends Error {
    code: string;

    constructor(message: string, code = "SQLITE_ERROR") {
      super(message);
      this.code = code;
      this.name = "MockSqliteError";
    }
  }

  return {
    default: Object.assign(MockDatabase, {
      SqliteError: MockSqliteError,
      prototype: database,
    }),
  };
}

describe("SqliteDatabaseClient.validateDatabase()", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("accepts a structurally valid zucchini backup", async () => {
    const close = vi.fn();
    const pragma = vi.fn(() => "ok");

    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({ close, pragma })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).not.toThrow();
    expect(pragma).toHaveBeenCalledWith("integrity_check(1)", {
      simple: true,
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("accepts legacy backups without habit completion timestamps", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        columnRowsByTable: {
          habit_period_status: DEFAULT_COLUMN_ROWS.filter(
            ({ name }) => name !== "completed_at"
          ),
        },
      })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).not.toThrow();
  });

  it("rejects files that fail the sqlite integrity check", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        pragma: vi.fn(() => "database disk image is malformed"),
      })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).toThrow(
      "SQLite integrity check failed"
    );
  });

  it("rejects sqlite files that are missing zucchini tables", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        tableRows: DEFAULT_TABLE_ROWS.filter(({ name }) => name !== "settings"),
      })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).toThrow(
      "Backup is missing the Zucchini settings table"
    );
  });

  it("rejects sqlite files that are missing zucchini table columns", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        columnRowsByTable: {
          settings: DEFAULT_COLUMN_ROWS.filter(
            ({ name }) => name !== "timezone"
          ),
        },
      })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).toThrow(
      "Backup is missing the Zucchini settings.timezone column"
    );
  });
});

describe("SqliteDatabaseClient.exportCsvData()", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zucchini-csv-test-"));
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    fs.rmSync(tempDir, { force: true, recursive: true });
  });

  it("exports every user table as stable CSV files", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        columnRowsByTable: {
          a_empty: [{ name: "name" }, { name: "count" }],
          z_notes: [{ name: "id" }, { name: "note" }, { name: "optional" }],
        },
        rowsByTable: {
          z_notes: [
            {
              id: 1,
              note: "plain",
              optional: null,
            },
            {
              id: 2,
              note: 'comma, quote " and\nnewline',
              optional: "value",
            },
          ],
        },
        tableRows: [{ name: "a_empty" }, { name: "z_notes" }],
      })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: path.join(tempDir, "live.db"),
    });

    const exportPath = path.join(tempDir, "csv");
    client.exportCsvData(exportPath);
    client.close();

    expect(fs.readdirSync(exportPath)).toStrictEqual([
      "a_empty.csv",
      "z_notes.csv",
    ]);
    expect(fs.readFileSync(path.join(exportPath, "a_empty.csv"), "utf-8")).toBe(
      "name,count\n"
    );
    expect(fs.readFileSync(path.join(exportPath, "z_notes.csv"), "utf-8")).toBe(
      'id,note,optional\n1,plain,\n2,"comma, quote "" and\nnewline",value\n'
    );
  });
});
