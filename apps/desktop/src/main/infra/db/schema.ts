/**
 * Drizzle ORM schema — SQLite table definitions.
 *
 * Defines all tables used by Zucchini: habits, habit_period_status,
 * daily_summary, focus_sessions, focus_timer_state, streak_state,
 * reminder_runtime_state, and settings. This is the single source of
 * truth for the database shape and is used by both the runtime client
 * and Drizzle Kit for migrations.
 */
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
  targetCount: integer("target_count").notNull().default(1),
});

export const habitPeriodStatus = sqliteTable(
  "habit_period_status",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    completedCount: integer("completed_count").notNull().default(0),
    frequency: text().notNull().default(DEFAULT_HABIT_FREQUENCY),
    habitCategory: text("habit_category")
      .notNull()
      .default(DEFAULT_HABIT_CATEGORY),
    habitCreatedAt: text("habit_created_at").notNull(),
    habitId: integer("habit_id").notNull(),
    habitName: text("habit_name").notNull(),
    habitSelectedWeekdays: text("habit_selected_weekdays"),
    habitSortOrder: integer("habit_sort_order").notNull().default(0),
    habitTargetCount: integer("habit_target_count").notNull().default(1),
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
  dayStatus: text("day_status"),
  freezeUsed: integer("freeze_used", { mode: "boolean" }).notNull(),
  streakCountAfterDay: integer("streak_count_after_day").notNull(),
});

export const dayStatus = sqliteTable("day_status", {
  createdAt: text("created_at").notNull(),
  date: text().primaryKey(),
  kind: text().notNull(),
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
    timerSessionId: text("timer_session_id").notNull(),
  },
  (table) => [
    index("focus_sessions_completed_at_idx").on(table.completedAt),
    index("focus_sessions_completed_date_idx").on(table.completedDate),
    index("focus_sessions_timer_session_id_idx").on(table.timerSessionId),
  ]
);

export const focusQuotaGoals = sqliteTable("focus_quota_goals", {
  archivedAt: text("archived_at"),
  createdAt: text("created_at").notNull(),
  frequency: text().notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  targetMinutes: integer("target_minutes").notNull(),
});

export const focusTimerState = sqliteTable("focus_timer_state", {
  breakVariant: text("break_variant"),
  completedFocusCycles: integer("completed_focus_cycles").notNull(),
  cycleId: text("cycle_id"),
  endsAt: text("ends_at"),
  focusDurationMs: integer("focus_duration_ms").notNull(),
  id: integer().primaryKey(),
  lastCompletedBreakCompletedAt: text("last_completed_break_completed_at"),
  lastCompletedBreakTimerSessionId: text(
    "last_completed_break_timer_session_id"
  ),
  lastCompletedBreakVariant: text("last_completed_break_variant"),
  lastUpdatedAt: text("last_updated_at").notNull(),
  phase: text().notNull(),
  remainingMs: integer("remaining_ms").notNull(),
  startedAt: text("started_at"),
  status: text().notNull(),
  timerSessionId: text("timer_session_id"),
});

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

export const windDownActions = sqliteTable("wind_down_actions", {
  createdAt: text("created_at").notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const windDownActionStatus = sqliteTable(
  "wind_down_action_status",
  {
    actionId: integer("action_id").notNull(),
    completed: integer({ mode: "boolean" }).notNull().default(false),
    completedAt: text("completed_at"),
    date: text().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.date, table.actionId],
    }),
    index("wind_down_action_status_action_id_idx").on(table.actionId),
    index("wind_down_action_status_date_idx").on(table.date),
  ]
);

export const windDownRuntimeState = sqliteTable("wind_down_runtime_state", {
  id: integer().primaryKey(),
  lastReminderSentAt: text("last_reminder_sent_at"),
});

export const settings = sqliteTable("settings", {
  categoryPreferences: text("category_preferences").notNull(),
  focusCyclesBeforeLongBreak: integer(
    "focus_cycles_before_long_break"
  ).notNull(),
  focusDefaultDurationSeconds: integer(
    "focus_default_duration_seconds"
  ).notNull(),
  focusLongBreakSeconds: integer("focus_long_break_seconds").notNull(),
  focusShortBreakSeconds: integer("focus_short_break_seconds").notNull(),
  id: integer().primaryKey(),
  launchAtLogin: integer("launch_at_login", { mode: "boolean" }).notNull(),
  minimizeToTray: integer("minimize_to_tray", { mode: "boolean" }).notNull(),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" }).notNull(),
  reminderSnoozeMinutes: integer("reminder_snooze_minutes").notNull(),
  reminderTime: text("reminder_time").notNull(),
  resetFocusTimerShortcut: text("reset_focus_timer_shortcut").notNull(),
  themeMode: text("theme_mode").notNull(),
  timezone: text().notNull(),
  toggleFocusTimerShortcut: text("toggle_focus_timer_shortcut").notNull(),
  windDownTime: text("wind_down_time").notNull(),
});

export const schema = {
  dailySummary,
  dayStatus,
  focusQuotaGoals,
  focusSessions,
  focusTimerState,
  habitPeriodStatus,
  habits,
  reminderRuntimeState,
  settings,
  streakState,
  windDownActionStatus,
  windDownActions,
  windDownRuntimeState,
};
