function createMockDatabaseConstructor({
  close = vi.fn(),
  get = vi.fn(() => 1),
  pragma = vi.fn(() => "ok"),
}: {
  close?: ReturnType<typeof vi.fn>;
  get?: ReturnType<typeof vi.fn>;
  pragma?: ReturnType<typeof vi.fn>;
}) {
  const database = {
    close,
    pragma,
    prepare: vi.fn(() => ({
      get,
      pluck: vi.fn().mockReturnThis(),
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
    const get = vi.fn(() => 1);

    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({ close, get, pragma })
    );

    const { SqliteDatabaseClient } = await import("./sqlite-client");
    const client = new SqliteDatabaseClient({
      databasePath: "/tmp/live.db",
    });

    expect(() => client.validateDatabase("/tmp/backup.db")).not.toThrow();
    expect(pragma).toHaveBeenCalledWith("integrity_check(1)", {
      simple: true,
    });
    expect(get).toHaveBeenCalledWith("settings");
    expect(close).toHaveBeenCalledOnce();
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

  it("rejects sqlite files that are not zucchini backups", async () => {
    vi.doMock("better-sqlite3", () =>
      createMockDatabaseConstructor({
        get: vi.fn(() => null),
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
});
