import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { DEFAULT_HABIT_CATEGORY } from "../shared/domain/habit";

export const habits = sqliteTable("habits", {
  category: text().notNull().default(DEFAULT_HABIT_CATEGORY),
  createdAt: text("created_at").notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text().notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const dailyHabitStatus = sqliteTable(
  "daily_habit_status",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    date: text().notNull(),
    habitCategory: text("habit_category")
      .notNull()
      .default(DEFAULT_HABIT_CATEGORY),
    habitCreatedAt: text("habit_created_at").notNull(),
    habitId: integer("habit_id").notNull(),
    habitName: text("habit_name").notNull(),
    habitSortOrder: integer("habit_sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.date, table.habitId] })]
);

export const dailySummary = sqliteTable("daily_summary", {
  allCompleted: integer("all_completed", { mode: "boolean" }).notNull(),
  completedAt: text("completed_at"),
  date: text().primaryKey(),
  freezeUsed: integer("freeze_used", { mode: "boolean" }).notNull(),
  streakCountAfterDay: integer("streak_count_after_day").notNull(),
});

export const streakState = sqliteTable("streak_state", {
  availableFreezes: integer("available_freezes").notNull(),
  bestStreak: integer("best_streak").notNull(),
  currentStreak: integer("current_streak").notNull(),
  id: integer().primaryKey(),
  lastEvaluatedDate: text("last_evaluated_date"),
});

export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

export const schema = {
  dailyHabitStatus,
  dailySummary,
  habits,
  settings,
  streakState,
};
