import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_FREQUENCY,
} from "@/shared/domain/habit";

export const habits = sqliteTable("habits", {
  category: text().notNull().default(DEFAULT_HABIT_CATEGORY),
  createdAt: text("created_at").notNull(),
  frequency: text().notNull().default(DEFAULT_HABIT_FREQUENCY),
  id: integer().primaryKey({ autoIncrement: true }),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text().notNull(),
  selectedWeekdays: text("selected_weekdays"),
  sortOrder: integer("sort_order").notNull(),
});

export const habitPeriodStatus = sqliteTable(
  "habit_period_status",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    frequency: text().notNull().default(DEFAULT_HABIT_FREQUENCY),
    habitCategory: text("habit_category")
      .notNull()
      .default(DEFAULT_HABIT_CATEGORY),
    habitCreatedAt: text("habit_created_at").notNull(),
    habitId: integer("habit_id").notNull(),
    habitName: text("habit_name").notNull(),
    habitSelectedWeekdays: text("habit_selected_weekdays"),
    habitSortOrder: integer("habit_sort_order").notNull().default(0),
    periodEnd: text("period_end").notNull(),
    periodStart: text("period_start").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.frequency, table.periodStart, table.habitId],
    }),
    index("habit_period_status_period_start_idx").on(table.periodStart),
    index("habit_period_status_period_end_idx").on(table.periodEnd),
  ]
);

export const dailySummary = sqliteTable("daily_summary", {
  allCompleted: integer("all_completed", { mode: "boolean" }).notNull(),
  completedAt: text("completed_at"),
  date: text().primaryKey(),
  freezeUsed: integer("freeze_used", { mode: "boolean" }).notNull(),
  streakCountAfterDay: integer("streak_count_after_day").notNull(),
});

export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    completedAt: text("completed_at").notNull(),
    completedDate: text("completed_date").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    entryKind: text("entry_kind").notNull().default("completed"),
    id: integer().primaryKey({ autoIncrement: true }),
    startedAt: text("started_at").notNull(),
    timerSessionId: text("timer_session_id"),
  },
  (table) => [
    index("focus_sessions_completed_at_idx").on(table.completedAt),
    index("focus_sessions_completed_date_idx").on(table.completedDate),
    index("focus_sessions_timer_session_id_idx").on(table.timerSessionId),
  ]
);

export const streakState = sqliteTable("streak_state", {
  availableFreezes: integer("available_freezes").notNull(),
  bestStreak: integer("best_streak").notNull(),
  currentStreak: integer("current_streak").notNull(),
  id: integer().primaryKey(),
  lastEvaluatedDate: text("last_evaluated_date"),
});

export const reminderRuntimeState = sqliteTable("reminder_runtime_state", {
  id: integer().primaryKey(),
  lastMidnightWarningSentAt: text("last_midnight_warning_sent_at"),
  lastMissedReminderSentAt: text("last_missed_reminder_sent_at"),
  lastReminderSentAt: text("last_reminder_sent_at"),
  snoozedUntil: text("snoozed_until"),
});

export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

export const schema = {
  dailySummary,
  focusSessions,
  habitPeriodStatus,
  habits,
  reminderRuntimeState,
  settings,
  streakState,
};
