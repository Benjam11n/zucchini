import { createDefaultAppSettings } from "@/shared/domain/settings";

import { SqliteSettingsRepository } from "./settings-repository";

function createFakeClient(initialRows: { key: string; value: string }[] = []) {
  const rows = [...initialRows];

  return {
    getDrizzle() {
      return {
        insert() {
          return {
            values(value: { key: string; value: string }) {
              return {
                onConflictDoUpdate() {
                  return {
                    run() {
                      const existingRow = rows.find(
                        (row) => row.key === value.key
                      );

                      if (existingRow) {
                        existingRow.value = value.value;
                        return;
                      }

                      rows.push({ ...value });
                    },
                  };
                },
                onConflictDoNothing() {
                  return {
                    run() {
                      const existingRow = rows.find(
                        (row) => row.key === value.key
                      );

                      if (existingRow) {
                        return;
                      }

                      rows.push({ ...value });
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
                all() {
                  return rows;
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

describe("SqliteSettingsRepository", () => {
  it("falls back to default category preferences when category rows are missing", () => {
    const repository = new SqliteSettingsRepository(
      createFakeClient() as never
    );

    expect(
      repository.getSettings("Asia/Singapore").categoryPreferences
    ).toStrictEqual(
      createDefaultAppSettings("Asia/Singapore").categoryPreferences
    );
  });

  it("round-trips category preferences through the settings table", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);
    const customSettings = {
      ...createDefaultAppSettings("Asia/Singapore"),
      categoryPreferences: {
        fitness: {
          color: "#CC3355",
          label: "Movement",
        },
        nutrition: {
          color: "#66CC22",
          label: "Fuel",
        },
        productivity: {
          color: "#22BBDD",
          label: "Work",
        },
      },
    };

    const savedSettings = repository.saveSettings(
      customSettings,
      "Asia/Singapore"
    );

    expect(savedSettings.categoryPreferences).toStrictEqual(
      customSettings.categoryPreferences
    );
  });

  it("does not overwrite saved pomodoro settings when seeding defaults", () => {
    const client = createFakeClient();
    const repository = new SqliteSettingsRepository(client as never);

    repository.saveSettings(
      {
        ...createDefaultAppSettings("Asia/Singapore"),
        focusCyclesBeforeLongBreak: 7,
        focusDefaultDurationSeconds: 33 * 60,
        focusLongBreakSeconds: 22 * 60,
        focusShortBreakSeconds: 9 * 60,
      },
      "Asia/Singapore"
    );

    repository.seedDefaults("Asia/Singapore");

    expect(repository.getSettings("Asia/Singapore")).toMatchObject({
      focusCyclesBeforeLongBreak: 7,
      focusDefaultDurationSeconds: 33 * 60,
      focusLongBreakSeconds: 22 * 60,
      focusShortBreakSeconds: 9 * 60,
    });
  });
});
