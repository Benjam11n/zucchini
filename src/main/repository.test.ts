import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { SqliteHabitRepository } from "./repository";

const { getPathMock } = vi.hoisted(() => ({
  getPathMock: vi.fn(),
}));

vi.mock<typeof import('electron')>(import('electron'), () => ({
  app: {
    getPath: getPathMock,
  },
}));

function createRepository(): SqliteHabitRepository {
  const userDataPath = fs.mkdtempSync(
    path.join(os.tmpdir(), "zucchini-repository-")
  );

  getPathMock.mockReset();
  getPathMock.mockReturnValue(userDataPath);

  const repository = new SqliteHabitRepository();
  repository.initializeSchema();
  return repository;
}

describe("sqliteHabitRepository history snapshots", () => {
  it("preserves previous-day history when habits are edited, reordered, or archived", () => {
    const repository = createRepository();

    const runHabitId = repository.insertHabit(
      "Morning Run",
      "fitness",
      0,
      "2026-03-01T00:00:00.000Z"
    );
    const readHabitId = repository.insertHabit(
      "Read 20 pages",
      "productivity",
      1,
      "2026-03-01T00:00:00.000Z"
    );

    repository.ensureStatusRowsForDate("2026-03-05");
    repository.toggleHabit("2026-03-05", runHabitId);

    repository.renameHabit(runHabitId, "Evening Run");
    repository.updateHabitCategory(runHabitId, "nutrition");
    repository.reorderHabits([readHabitId, runHabitId]);
    repository.archiveHabit(readHabitId);
    repository.normalizeHabitOrder();
    repository.ensureStatusRowsForDate("2026-03-06");

    expect(
      repository.getHistoricalHabitsWithStatus("2026-03-05")
    ).toStrictEqual([
      {
        category: "fitness",
        completed: true,
        createdAt: "2026-03-01T00:00:00.000Z",
        id: runHabitId,
        isArchived: false,
        name: "Morning Run",
        sortOrder: 0,
      },
      {
        category: "productivity",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        id: readHabitId,
        isArchived: false,
        name: "Read 20 pages",
        sortOrder: 1,
      },
    ]);

    expect(repository.getHabitsWithStatus("2026-03-06")).toStrictEqual([
      {
        category: "nutrition",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        id: runHabitId,
        isArchived: false,
        name: "Evening Run",
        sortOrder: 0,
      },
    ]);
  });

  it("keeps newly added habits out of earlier days", () => {
    const repository = createRepository();

    const firstHabitId = repository.insertHabit(
      "Drink Water",
      "nutrition",
      0,
      "2026-03-01T00:00:00.000Z"
    );

    repository.ensureStatusRowsForDate("2026-03-05");

    const secondHabitId = repository.insertHabit(
      "Stretch",
      "fitness",
      1,
      "2026-03-06T00:00:00.000Z"
    );

    repository.ensureStatusRowsForDate("2026-03-06");

    expect(
      repository.getHistoricalHabitsWithStatus("2026-03-05")
    ).toStrictEqual([
      {
        category: "nutrition",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        id: firstHabitId,
        isArchived: false,
        name: "Drink Water",
        sortOrder: 0,
      },
    ]);

    expect(
      repository.getHistoricalHabitsWithStatus("2026-03-06")
    ).toStrictEqual([
      {
        category: "nutrition",
        completed: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        id: firstHabitId,
        isArchived: false,
        name: "Drink Water",
        sortOrder: 0,
      },
      {
        category: "fitness",
        completed: false,
        createdAt: "2026-03-06T00:00:00.000Z",
        id: secondHabitId,
        isArchived: false,
        name: "Stretch",
        sortOrder: 1,
      },
    ]);
  });
});
