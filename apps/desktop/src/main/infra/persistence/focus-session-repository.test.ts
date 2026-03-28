import { SqliteFocusSessionRepository } from "./focus-session-repository";

function createFakeClient() {
  const rows = [
    {
      completedAt: "2026-03-08T10:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      id: 2,
      startedAt: "2026-03-08T10:00:00.000Z",
      timerSessionId: "timer-session-2",
    },
    {
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      id: 1,
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    },
  ];

  return {
    getDrizzle() {
      return {
        insert() {
          return {
            values(value: Omit<(typeof rows)[number], "id">) {
              return {
                returning() {
                  return {
                    get() {
                      const row = {
                        ...value,
                        id: rows.length + 1,
                      };
                      rows.unshift(row);
                      return row;
                    },
                  };
                },
              };
            },
          };
        },
        select() {
          return {
            from() {
              return {
                orderBy() {
                  return {
                    limit(limit: number) {
                      return {
                        all() {
                          return rows.slice(0, limit);
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    run<T>(_label: string, execute: () => T): T {
      return execute();
    },
  };
}

describe("focus session repository", () => {
  it("persists and lists completed focus sessions newest first", () => {
    const repository = new SqliteFocusSessionRepository(
      createFakeClient() as never
    );

    const savedSession = repository.insertSession({
      completedAt: "2026-03-08T11:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T11:00:00.000Z",
      timerSessionId: "timer-session-3",
    });
    const sessions = repository.listRecentSessions(2);

    expect(savedSession).toMatchObject({
      completedAt: "2026-03-08T11:25:00.000Z",
      durationSeconds: 1500,
      id: 3,
    });
    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.completedAt).toBe("2026-03-08T11:25:00.000Z");
    expect(sessions[1]?.completedAt).toBe("2026-03-08T10:25:00.000Z");
  });
});
