import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Effect } from "effect";
import { app } from "electron";

import { normalizeHabitCategory } from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import {
  dailyHabitStatus,
  dailySummary,
  habits,
  repairLegacySchema,
  schema,
  settings,
  streakState,
} from "./schema";

class DatabaseError extends Error {
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

export interface HabitRepository {
  initializeSchema(): void;
  seedDefaults(nowIso: string, timezone: string): void;
  getHabits(): Habit[];
  getHabitsWithStatus(date: string): HabitWithStatus[];
  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[];
  ensureStatusRowsForDate(date: string): void;
  ensureStatusRow(date: string, habitId: number): void;
  toggleHabit(date: string, habitId: number): void;
  getSettledHistory(limit?: number): DailySummary[];
  getPersistedStreakState(): StreakState;
  savePersistedStreakState(state: StreakState): void;
  getSettings(defaultTimezone: string): AppSettings;
  saveSettings(settings: AppSettings, defaultTimezone: string): AppSettings;
  getFirstTrackedDate(): string | null;
  getExistingCompletedAt(date: string): string | null;
  saveDailySummary(summary: DailySummary): void;
  getMaxSortOrder(): number;
  insertHabit(
    name: string,
    category: HabitCategory,
    sortOrder: number,
    createdAt: string
  ): number;
  renameHabit(habitId: number, name: string): void;
  updateHabitCategory(habitId: number, category: HabitCategory): void;
  archiveHabit(habitId: number): void;
  normalizeHabitOrder(): void;
  reorderHabits(habitIds: number[]): void;
}

type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

type HabitRow = typeof habits.$inferSelect;
type DailySummaryRow = typeof dailySummary.$inferSelect;
type StreakStateRow = typeof streakState.$inferSelect;

export class SqliteHabitRepository implements HabitRepository {
  private database: Database.Database | null = null;
  private drizzleDb: DrizzleDatabase | null = null;

  private runDb<A>(label: string, execute: () => A): A {
    return Effect.runSync(
      Effect.try({
        catch: (cause) => new DatabaseError(label, cause),
        try: execute,
      })
    );
  }

  private getDbPath(): string {
    const userData = app.getPath("userData");
    fs.mkdirSync(userData, { recursive: true });
    return path.join(userData, "zucchini.db");
  }

  private getMigrationsFolder(): string {
    return path.join(app.getAppPath(), "drizzle");
  }

  private getSqlite(): Database.Database {
    if (!this.database) {
      this.database = new Database(this.getDbPath());
    }

    return this.database;
  }

  private getDrizzle(): DrizzleDatabase {
    if (!this.drizzleDb) {
      this.drizzleDb = drizzle(this.getSqlite(), { schema });
    }

    return this.drizzleDb;
  }

  initializeSchema(): void {
    this.runDb("initializeSchema", () => {
      migrate(this.getDrizzle(), {
        migrationsFolder: this.getMigrationsFolder(),
      });
      repairLegacySchema(this.getSqlite());
    });
  }

  seedDefaults(nowIso: string, timezone: string): void {
    this.runDb("seedDefaults", () => {
      const habitCount = this.getDrizzle()
        .select({
          count: sql<number>`count(*)`,
        })
        .from(habits)
        .where(eq(habits.isArchived, false))
        .get();

      if ((habitCount?.count ?? 0) === 0) {
        this.getDrizzle()
          .insert(habits)
          .values([
            {
              category: "nutrition",
              createdAt: nowIso,
              name: "Eat a whole food meal",
              sortOrder: 0,
            },
            {
              category: "productivity",
              createdAt: nowIso,
              name: "Deep work block",
              sortOrder: 1,
            },
            {
              category: "fitness",
              createdAt: nowIso,
              name: "Move for 20 minutes",
              sortOrder: 2,
            },
          ])
          .run();
      }

      this.getDrizzle()
        .insert(streakState)
        .values({
          availableFreezes: 1,
          bestStreak: 0,
          currentStreak: 0,
          id: 1,
          lastEvaluatedDate: null,
        })
        .onConflictDoNothing()
        .run();

      this.upsertSetting("reminderEnabled", "true");
      this.upsertSetting("reminderTime", "20:30");
      this.upsertSetting("themeMode", "system");
      this.upsertSetting("timezone", timezone);
    });
  }

  getHabits(): Habit[] {
    return this.runDb("getHabits", () =>
      this.getDrizzle()
        .select()
        .from(habits)
        .where(eq(habits.isArchived, false))
        .orderBy(asc(habits.sortOrder), asc(habits.id))
        .all()
        .map((row) => this.mapHabit(row))
    );
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.runDb("getHabitsWithStatus", () =>
      this.getDrizzle()
        .select({
          category: habits.category,
          completed: sql<boolean>`coalesce(${dailyHabitStatus.completed}, 0)`,
          createdAt: habits.createdAt,
          id: habits.id,
          isArchived: habits.isArchived,
          name: habits.name,
          sortOrder: habits.sortOrder,
        })
        .from(habits)
        .leftJoin(
          dailyHabitStatus,
          and(
            eq(dailyHabitStatus.habitId, habits.id),
            eq(dailyHabitStatus.date, date)
          )
        )
        .where(eq(habits.isArchived, false))
        .orderBy(asc(habits.sortOrder), asc(habits.id))
        .all()
        .map((row) => ({
          category: normalizeHabitCategory(row.category),
          completed: Boolean(row.completed),
          createdAt: row.createdAt,
          id: row.id,
          isArchived: row.isArchived,
          name: row.name,
          sortOrder: row.sortOrder,
        }))
    );
  }

  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.runDb("getHistoricalHabitsWithStatus", () =>
      this.getDrizzle()
        .select({
          category: dailyHabitStatus.habitCategory,
          completed: dailyHabitStatus.completed,
          createdAt: dailyHabitStatus.habitCreatedAt,
          id: dailyHabitStatus.habitId,
          name: dailyHabitStatus.habitName,
          sortOrder: dailyHabitStatus.habitSortOrder,
        })
        .from(dailyHabitStatus)
        .where(eq(dailyHabitStatus.date, date))
        .orderBy(
          asc(dailyHabitStatus.habitSortOrder),
          asc(dailyHabitStatus.habitId)
        )
        .all()
        .map((row) => ({
          category: normalizeHabitCategory(row.category),
          completed: row.completed,
          createdAt: row.createdAt,
          id: row.id,
          isArchived: false,
          name: row.name,
          sortOrder: row.sortOrder,
        }))
    );
  }

  ensureStatusRowsForDate(date: string): void {
    this.runDb("ensureStatusRowsForDate", () => {
      const activeHabits = this.getHabits();
      if (activeHabits.length === 0) {
        return;
      }

      this.getDrizzle()
        .insert(dailyHabitStatus)
        .values(
          activeHabits.map((habit) => ({
            completed: false,
            date,
            habitCategory: habit.category,
            habitCreatedAt: habit.createdAt,
            habitId: habit.id,
            habitName: habit.name,
            habitSortOrder: habit.sortOrder,
          }))
        )
        .onConflictDoNothing()
        .run();
    });
  }

  ensureStatusRow(date: string, habitId: number): void {
    this.runDb("ensureStatusRow", () => {
      const habit = this.getHabitById(habitId);
      if (!habit) {
        return;
      }

      this.getDrizzle()
        .insert(dailyHabitStatus)
        .values({
          completed: false,
          date,
          habitCategory: habit.category,
          habitCreatedAt: habit.createdAt,
          habitId,
          habitName: habit.name,
          habitSortOrder: habit.sortOrder,
        })
        .onConflictDoNothing()
        .run();
    });
  }

  toggleHabit(date: string, habitId: number): void {
    this.runDb("toggleHabit", () => {
      this.getDrizzle()
        .update(dailyHabitStatus)
        .set({
          completed: sql<boolean>`case when ${dailyHabitStatus.completed} = 1 then 0 else 1 end`,
        })
        .where(
          and(
            eq(dailyHabitStatus.date, date),
            eq(dailyHabitStatus.habitId, habitId)
          )
        )
        .run();
    });
  }

  getSettledHistory(limit?: number): DailySummary[] {
    return this.runDb("getSettledHistory", () => {
      const query = this.getDrizzle()
        .select()
        .from(dailySummary)
        .orderBy(desc(dailySummary.date));
      const rows = limit === undefined ? query.all() : query.limit(limit).all();

      return rows.map((row) => this.mapDailySummary(row));
    });
  }

  getPersistedStreakState(): StreakState {
    return this.runDb("getPersistedStreakState", () => {
      const row = this.getDrizzle()
        .select()
        .from(streakState)
        .where(eq(streakState.id, 1))
        .get();

      return row
        ? this.mapStreakState(row)
        : {
            availableFreezes: 0,
            bestStreak: 0,
            currentStreak: 0,
            lastEvaluatedDate: null,
          };
    });
  }

  savePersistedStreakState(state: StreakState): void {
    this.runDb("savePersistedStreakState", () => {
      this.getDrizzle()
        .update(streakState)
        .set({
          availableFreezes: state.availableFreezes,
          bestStreak: state.bestStreak,
          currentStreak: state.currentStreak,
          lastEvaluatedDate: state.lastEvaluatedDate,
        })
        .where(eq(streakState.id, 1))
        .run();
    });
  }

  getSettings(defaultTimezone: string): AppSettings {
    return this.runDb("getSettings", () => {
      const rows = this.getDrizzle().select().from(settings).all();
      const map = new Map(rows.map((row) => [row.key, row.value]));

      return {
        reminderEnabled: map.get("reminderEnabled") === "true",
        reminderTime: map.get("reminderTime") ?? "20:30",
        themeMode: this.getThemeMode(map.get("themeMode")),
        timezone: map.get("timezone") ?? defaultTimezone,
      };
    });
  }

  saveSettings(
    nextSettings: AppSettings,
    defaultTimezone: string
  ): AppSettings {
    this.runDb("saveSettings", () => {
      this.upsertSetting(
        "reminderEnabled",
        String(nextSettings.reminderEnabled)
      );
      this.upsertSetting("reminderTime", nextSettings.reminderTime);
      this.upsertSetting("themeMode", nextSettings.themeMode);
      this.upsertSetting("timezone", nextSettings.timezone);
    });

    return this.getSettings(defaultTimezone);
  }

  getFirstTrackedDate(): string | null {
    return this.runDb("getFirstTrackedDate", () => {
      const statusRow = this.getDrizzle()
        .select({
          firstDate: sql<string | null>`min(${dailyHabitStatus.date})`,
        })
        .from(dailyHabitStatus)
        .get();
      const summaryRow = this.getDrizzle()
        .select({
          firstDate: sql<string | null>`min(${dailySummary.date})`,
        })
        .from(dailySummary)
        .get();
      const candidates = [statusRow?.firstDate, summaryRow?.firstDate].filter(
        (value): value is string => value !== null && value !== undefined
      );

      if (candidates.length === 0) {
        return null;
      }

      return candidates.toSorted((left, right) => left.localeCompare(right))[0];
    });
  }

  getExistingCompletedAt(date: string): string | null {
    return this.runDb("getExistingCompletedAt", () => {
      const row = this.getDrizzle()
        .select({
          completedAt: dailySummary.completedAt,
        })
        .from(dailySummary)
        .where(eq(dailySummary.date, date))
        .get();

      return row?.completedAt ?? null;
    });
  }

  saveDailySummary(summary: DailySummary): void {
    this.runDb("saveDailySummary", () => {
      this.getDrizzle()
        .insert(dailySummary)
        .values({
          allCompleted: summary.allCompleted,
          completedAt: summary.completedAt,
          date: summary.date,
          freezeUsed: summary.freezeUsed,
          streakCountAfterDay: summary.streakCountAfterDay,
        })
        .onConflictDoUpdate({
          set: {
            allCompleted: summary.allCompleted,
            completedAt: summary.completedAt,
            freezeUsed: summary.freezeUsed,
            streakCountAfterDay: summary.streakCountAfterDay,
          },
          target: dailySummary.date,
        })
        .run();
    });
  }

  getMaxSortOrder(): number {
    return this.runDb("getMaxSortOrder", () => {
      const row = this.getDrizzle()
        .select({
          maxSortOrder: sql<number>`coalesce(max(${habits.sortOrder}), -1)`,
        })
        .from(habits)
        .where(eq(habits.isArchived, false))
        .get();

      return row?.maxSortOrder ?? -1;
    });
  }

  insertHabit(
    name: string,
    category: HabitCategory,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.runDb("insertHabit", () => {
      const result = this.getDrizzle()
        .insert(habits)
        .values({
          category,
          createdAt,
          name,
          sortOrder,
        })
        .returning({
          id: habits.id,
        })
        .get();

      return result.id;
    });
  }

  renameHabit(habitId: number, name: string): void {
    this.runDb("renameHabit", () => {
      this.getDrizzle()
        .update(habits)
        .set({ name })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): void {
    this.runDb("updateHabitCategory", () => {
      this.getDrizzle()
        .update(habits)
        .set({ category })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  archiveHabit(habitId: number): void {
    this.runDb("archiveHabit", () => {
      this.getDrizzle()
        .update(habits)
        .set({ isArchived: true })
        .where(eq(habits.id, habitId))
        .run();
    });
  }

  normalizeHabitOrder(): void {
    this.runDb("normalizeHabitOrder", () => {
      const activeHabits = this.getHabits();

      this.getDrizzle().transaction((tx) => {
        activeHabits.forEach((habit, index) => {
          tx.update(habits)
            .set({ sortOrder: index })
            .where(eq(habits.id, habit.id))
            .run();
        });
      });
    });
  }

  reorderHabits(habitIds: number[]): void {
    this.runDb("reorderHabits", () => {
      this.getDrizzle().transaction((tx) => {
        habitIds.forEach((habitId, index) => {
          tx.update(habits)
            .set({ sortOrder: index })
            .where(eq(habits.id, habitId))
            .run();
        });
      });
    });
  }

  private upsertSetting(key: string, value: string): void {
    this.getDrizzle()
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        set: { value },
        target: settings.key,
      })
      .run();
  }

  private getThemeMode(value: string | undefined): ThemeMode {
    if (value === "light" || value === "dark") {
      return value;
    }

    return "system";
  }

  private getHabitById(habitId: number): Habit | null {
    const row = this.getDrizzle()
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
      .get();

    return row ? this.mapHabit(row) : null;
  }

  private mapHabit(row: HabitRow): Habit {
    return {
      category: normalizeHabitCategory(row.category),
      createdAt: row.createdAt,
      id: row.id,
      isArchived: row.isArchived,
      name: row.name,
      sortOrder: row.sortOrder,
    };
  }

  private mapDailySummary(row: DailySummaryRow): DailySummary {
    return {
      allCompleted: row.allCompleted,
      completedAt: row.completedAt,
      date: row.date,
      freezeUsed: row.freezeUsed,
      streakCountAfterDay: row.streakCountAfterDay,
    };
  }

  private mapStreakState(row: StreakStateRow): StreakState {
    return {
      availableFreezes: row.availableFreezes,
      bestStreak: row.bestStreak,
      currentStreak: row.currentStreak,
      lastEvaluatedDate: row.lastEvaluatedDate,
    };
  }
}
