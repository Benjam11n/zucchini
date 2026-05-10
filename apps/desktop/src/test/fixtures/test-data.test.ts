import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import { getPreviousCompletedIsoWeek } from "@/shared/utils/date";
import { FakeClock } from "@/test/fixtures/fake-clock";
import { generateTestData } from "@/test/fixtures/test-data";
import type { TestDataPreset } from "@/test/fixtures/test-data";

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
    focusQuotaGoals: db
      .prepare(`select * from focus_quota_goals order by frequency asc, id asc`)
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
    settings: db.prepare(`select * from settings order by id asc`).all(),
    streakState: db.prepare(`select * from streak_state order by id asc`).all(),
    windDownActionStatus: db
      .prepare(
        `select * from wind_down_action_status order by date asc, action_id asc`
      )
      .all(),
    windDownActions: db
      .prepare(
        `select * from wind_down_actions order by sort_order asc, id asc`
      )
      .all(),
    windDownRuntimeState: db
      .prepare(`select * from wind_down_runtime_state order by id asc`)
      .all(),
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

const describeWithFixtureDatabase =
  canUseFixtureDatabase() || process.env["CI"] ? describe : describe.skip;

describeWithFixtureDatabase("test data generator", () => {
  const FIXTURE_TEST_TIMEOUT_MS = 90_000;

  test(
    "generates deterministic medium fixture data for a fixed seed",
    () => {
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
    },
    FIXTURE_TEST_TIMEOUT_MS
  );

  test.each([
    ["medium", 36, 730, 4000, 4, 4, 180 * 4, 4],
    ["stress", 120, 1825, 20_000, 12, 8, 180 * 8, 8],
  ] as const)(
    "creates a valid %s fixture database",
    (
      preset: TestDataPreset,
      expectedHabitCount: number,
      expectedSummaryCount: number,
      expectedFocusCount: number,
      expectedArchivedCount: number,
      expectedWindDownActionCount: number,
      expectedWindDownStatusCount: number,
      expectedGoalCount: number
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
          focusQuotaGoals: countRows(databasePath, "focus_quota_goals"),
          focusSessions: countRows(databasePath, "focus_sessions"),
          habits: countRows(databasePath, "habits"),
          windDownActionStatus: countRows(
            databasePath,
            "wind_down_action_status"
          ),
          windDownActions: countRows(databasePath, "wind_down_actions"),
        },
        stats: {
          dailySummaryCount: stats.dailySummaryCount,
          focusQuotaGoalCount: stats.focusQuotaGoalCount,
          focusSessionCount: stats.focusSessionCount,
          habitCount: stats.habitCount,
          windDownActionCount: stats.windDownActionCount,
          windDownActionStatusCount: stats.windDownActionStatusCount,
        },
      }).toStrictEqual({
        rowCounts: {
          dailySummary: expectedSummaryCount,
          focusQuotaGoals: expectedGoalCount,
          focusSessions: expectedFocusCount,
          habits: expectedHabitCount,
          windDownActionStatus: expectedWindDownStatusCount,
          windDownActions: expectedWindDownActionCount,
        },
        stats: {
          dailySummaryCount: expectedSummaryCount,
          focusQuotaGoalCount: expectedGoalCount,
          focusSessionCount: expectedFocusCount,
          habitCount: expectedHabitCount,
          windDownActionCount: expectedWindDownActionCount,
          windDownActionStatusCount: expectedWindDownStatusCount,
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
      const invalidHabitTargets = readDistinct<{ count: number }>(
        databasePath,
        `select count(*) as count
         from habits
         where (frequency = 'daily' and target_count <> 1)
            or (frequency = 'weekly' and (target_count < 1 or target_count > 7))
            or (frequency = 'monthly' and (target_count < 1 or target_count > 31))`
      )[0]?.count;
      const invalidProgressRows = readDistinct<{ count: number }>(
        databasePath,
        `select count(*) as count
         from habit_period_status
         where completed_count < 0
            or completed_count > habit_target_count
            or (completed = 1 and completed_count < habit_target_count)
            or (completed = 0 and completed_count >= habit_target_count)`
      )[0]?.count;
      const activeGoalsByFrequency = readDistinct<{
        frequency: string;
        count: number;
      }>(
        databasePath,
        `select frequency, count(*) as count
         from focus_quota_goals
         where is_archived = 0
         group by frequency
         order by frequency asc`
      );

      expect({
        activeGoalsByFrequency,
        archivedCount,
        categories,
        frequencies,
        invalidHabitTargets,
        invalidProgressRows,
        statusRows: countRows(databasePath, "habit_period_status"),
      }).toStrictEqual({
        activeGoalsByFrequency: [
          { count: 1, frequency: "monthly" },
          { count: 1, frequency: "weekly" },
        ],
        archivedCount: expectedArchivedCount,
        categories: ["fitness", "nutrition", "productivity"],
        frequencies: ["daily", "monthly", "weekly"],
        invalidHabitTargets: 0,
        invalidProgressRows: 0,
        statusRows: stats.habitPeriodStatusCount,
      });

      expect(streakState).toBeDefined();
      expect(streakState?.last_evaluated_date).toBe("2026-03-13");
      expect(streakState?.available_freezes).toBeGreaterThanOrEqual(0);
      expect(streakState?.best_streak).toBeGreaterThanOrEqual(
        streakState?.current_streak ?? 0
      );
    },
    FIXTURE_TEST_TIMEOUT_MS
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

      const repository = new SqliteAppRepository({ databasePath });
      const clock = new FakeClock(
        "2026-03-14",
        "2026-03-14T10:30:00.000Z",
        "America/Los_Angeles"
      );
      const service = new HabitsApplicationService(repository, clock);

      const todayState = service.getTodayState();
      const history = service.getHistory(30);
      const overview = service.getWeeklyReviewOverview();
      const focusSessions = service.getFocusSessions(50);
      const weeklyReview = service.getWeeklyReview(
        getPreviousCompletedIsoWeek(clock.todayKey()).weekStart
      );
      const historyWithGoals = history.find(
        (day) => (day.focusQuotaGoals?.length ?? 0) > 0
      );

      expect({
        focusSessionCount: focusSessions.length,
        hasActiveFocusQuotaGoals: (todayState.focusQuotaGoals ?? []).length > 0,
        hasHistory: history.length > 0,
        hasHistoryFocusQuotaGoals: historyWithGoals !== undefined,
        hasTodayHabits: todayState.habits.length > 0,
        hasWeeklyReview: overview.latestReview !== null,
        hasWindDownActions: (todayState.windDown?.actions.length ?? 0) > 0,
        includesPeriodicHabits: todayState.habits.some(
          (habit) =>
            habit.frequency !== "daily" &&
            (habit.targetCount ?? 1) > 1 &&
            typeof habit.completedCount === "number"
        ),
        reviewDays: weeklyReview.dailyCadence.length,
        reviewHabitMetrics: weeklyReview.habitMetrics.length > 0,
        weekOptions: overview.availableWeeks.length > 0,
      }).toStrictEqual({
        focusSessionCount: 50,
        hasActiveFocusQuotaGoals: true,
        hasHistory: true,
        hasHistoryFocusQuotaGoals: true,
        hasTodayHabits: true,
        hasWeeklyReview: true,
        hasWindDownActions: true,
        includesPeriodicHabits: true,
        reviewDays: 7,
        reviewHabitMetrics: true,
        weekOptions: true,
      });

      repository.close();
    },
    FIXTURE_TEST_TIMEOUT_MS
  );
});
