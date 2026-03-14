import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import type { Clock } from "@/main/app/clock";
import { SqliteHabitRepository } from "@/main/repository";
import { HabitService } from "@/main/service";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import { getPreviousCompletedIsoWeek } from "@/shared/utils/date";
import { generateTestData } from "@/test/fixtures/test-data";
import type { TestDataPreset } from "@/test/fixtures/test-data";

class FakeClock implements Clock {
  private readonly today: string;
  private readonly nowIso: string;
  private readonly tz: string;

  constructor(today: string, nowIso: string, tz = "America/Los_Angeles") {
    this.today = today;
    this.nowIso = nowIso;
    this.tz = tz;
  }

  now(): Date {
    return new Date(this.nowIso);
  }

  todayKey(): string {
    return this.today;
  }

  addDays(dateKey: string, amount: number): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    const next = new Date(year, month - 1, day);
    next.setDate(next.getDate() + amount);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  compareDateKeys(left: string, right: string): number {
    return left.localeCompare(right);
  }

  timezone(): string {
    return this.tz;
  }
}

function createTempDbPath(name: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zucchini-fixture-"));
  return path.join(tempDir, `${name}.db`);
}

function snapshotDatabase(databasePath: string): string {
  const db = new Database(databasePath, { readonly: true });
  const tables = {
    dailySummary: db
      .prepare(`select * from daily_summary order by date asc`)
      .all(),
    focusSessions: db
      .prepare(
        `select * from focus_sessions order by completed_at desc, id asc`
      )
      .all(),
    habitPeriodStatus: db
      .prepare(
        `select * from habit_period_status order by frequency asc, period_start asc, habit_id asc`
      )
      .all(),
    habits: db.prepare(`select * from habits order by id asc`).all(),
    reminderRuntimeState: db
      .prepare(`select * from reminder_runtime_state order by id asc`)
      .all(),
    settings: db.prepare(`select * from settings order by key asc`).all(),
    streakState: db.prepare(`select * from streak_state order by id asc`).all(),
  };
  db.close();

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(tables))
    .digest("hex");
}

function countRows(databasePath: string, table: string): number {
  const db = new Database(databasePath, { readonly: true });
  const row = db.prepare(`select count(*) as count from ${table}`).get() as {
    count: number;
  };
  db.close();
  return row.count;
}

function readDistinct<T>(databasePath: string, query: string): T[] {
  const db = new Database(databasePath, { readonly: true });
  const rows = db.prepare(query).all() as T[];
  db.close();
  return rows;
}

function canUseFixtureDatabase(): boolean {
  try {
    const databasePath = createTempDbPath("capability-check");
    generateTestData({
      outputPath: databasePath,
      overwrite: true,
      preset: "medium",
      seed: 1,
      timezone: "America/Los_Angeles",
      today: "2026-03-14",
    });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!canUseFixtureDatabase())("test data generator", () => {
  test("generates deterministic medium fixture data for a fixed seed", () => {
    const first = createTempDbPath("medium-a");
    const second = createTempDbPath("medium-b");

    generateTestData({
      outputPath: first,
      overwrite: true,
      preset: "medium",
      seed: 20_260_314,
      timezone: "America/Los_Angeles",
      today: "2026-03-14",
    });
    generateTestData({
      outputPath: second,
      overwrite: true,
      preset: "medium",
      seed: 20_260_314,
      timezone: "America/Los_Angeles",
      today: "2026-03-14",
    });

    expect(snapshotDatabase(first)).toBe(snapshotDatabase(second));
  });

  test.each([
    ["medium", 36, 730, 4000, 4, 13],
    ["stress", 120, 1825, 20_000, 12, 12],
  ] as const)(
    "creates a valid %s fixture database",
    (
      preset: TestDataPreset,
      expectedHabitCount: number,
      expectedSummaryCount: number,
      expectedFocusCount: number,
      expectedArchivedCount: number,
      expectedBestStreak: number
    ) => {
      const databasePath = createTempDbPath(preset);
      const stats = generateTestData({
        outputPath: databasePath,
        overwrite: true,
        preset,
        seed: 20_260_314,
        timezone: "America/Los_Angeles",
        today: "2026-03-14",
      });

      expect({
        rowCounts: {
          dailySummary: countRows(databasePath, "daily_summary"),
          focusSessions: countRows(databasePath, "focus_sessions"),
          habits: countRows(databasePath, "habits"),
        },
        stats: {
          dailySummaryCount: stats.dailySummaryCount,
          focusSessionCount: stats.focusSessionCount,
          habitCount: stats.habitCount,
        },
      }).toStrictEqual({
        rowCounts: {
          dailySummary: expectedSummaryCount,
          focusSessions: expectedFocusCount,
          habits: expectedHabitCount,
        },
        stats: {
          dailySummaryCount: expectedSummaryCount,
          focusSessionCount: expectedFocusCount,
          habitCount: expectedHabitCount,
        },
      });

      const archivedCount = readDistinct<{ count: number }>(
        databasePath,
        "select count(*) as count from habits where is_archived = 1"
      )[0]?.count;
      const frequencies = readDistinct<{ frequency: HabitFrequency }>(
        databasePath,
        "select distinct frequency from habits order by frequency asc"
      ).map((row) => row.frequency);
      const categories = readDistinct<{ category: HabitCategory }>(
        databasePath,
        "select distinct category from habits order by category asc"
      ).map((row) => row.category);
      const [streakState] = readDistinct<{
        available_freezes: number;
        best_streak: number;
        current_streak: number;
        last_evaluated_date: string | null;
      }>(
        databasePath,
        `select
          available_freezes,
          best_streak,
          current_streak,
          last_evaluated_date
        from streak_state`
      );

      expect({
        archivedCount,
        categories,
        frequencies,
        statusRows: countRows(databasePath, "habit_period_status"),
      }).toStrictEqual({
        archivedCount: expectedArchivedCount,
        categories: ["fitness", "nutrition", "productivity"],
        frequencies: ["daily", "monthly", "weekly"],
        statusRows: stats.habitPeriodStatusCount,
      });

      expect(streakState).toStrictEqual({
        available_freezes: 0,
        best_streak: expectedBestStreak,
        current_streak: 0,
        last_evaluated_date: "2026-03-13",
      });
    }
  );

  test.each(["medium", "stress"] as const)(
    "supports real repository and service reads for %s",
    (preset: TestDataPreset) => {
      const databasePath = createTempDbPath(`${preset}-service`);

      generateTestData({
        outputPath: databasePath,
        overwrite: true,
        preset,
        seed: 20_260_314,
        timezone: "America/Los_Angeles",
        today: "2026-03-14",
      });

      const repository = new SqliteHabitRepository({ databasePath });
      const clock = new FakeClock(
        "2026-03-14",
        "2026-03-14T10:30:00.000Z",
        "America/Los_Angeles"
      );
      const service = new HabitService(repository, clock);

      const todayState = service.getTodayState();
      const history = service.getHistory(30);
      const overview = service.getWeeklyReviewOverview();
      const focusSessions = service.getFocusSessions(50);
      const weeklyReview = service.getWeeklyReview(
        getPreviousCompletedIsoWeek(clock.todayKey()).weekStart
      );

      expect({
        focusSessionCount: focusSessions.length,
        hasHistory: history.length > 0,
        hasTodayHabits: todayState.habits.length > 0,
        hasWeeklyReview: overview.latestReview !== null,
        reviewDays: weeklyReview.dailyCadence.length,
        reviewHabitMetrics: weeklyReview.habitMetrics.length > 0,
        weekOptions: overview.availableWeeks.length > 0,
      }).toStrictEqual({
        focusSessionCount: 50,
        hasHistory: true,
        hasTodayHabits: true,
        hasWeeklyReview: true,
        reviewDays: 7,
        reviewHabitMetrics: true,
        weekOptions: true,
      });

      repository.close();
    }
  );
});
