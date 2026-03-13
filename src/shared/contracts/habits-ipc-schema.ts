/**
 * Runtime validation schemas for IPC payloads.
 *
 * The main process uses these Zod schemas to reject malformed renderer input
 * before any database or business-logic work runs.
 */
import { z } from "zod";

import {
  isValidFocusDurationSeconds,
  isValidFocusBreakDurationSeconds,
  isValidFocusCyclesBeforeLongBreak,
  isValidReminderSnoozeMinutes,
  isValidReminderTime,
  isValidTimeZone,
} from "../domain/settings";

export const habitIdSchema = z.number().int().positive();
export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date keys must use YYYY-MM-DD format.",
});
const isoTimestampSchema = z.string().datetime({
  message: "Timestamps must use ISO 8601 format.",
  offset: true,
});
export const historyLimitSchema = z.number().int().min(1).max(365).optional();
export const focusSessionLimitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional();
export const focusTimerCycleIdSchema = z.string().trim().min(1).max(120);
export const focusTimerInstanceIdSchema = z.string().trim().min(1).max(120);
export const focusTimerLeaseTtlSchema = z.number().int().min(250).max(10_000);
export const focusWidgetSizeSchema = z.number().int().min(32).max(640);
const focusSessionEntryKindSchema = z.enum(["completed", "partial"]);

export const habitNameSchema = z.string().trim().min(1).max(120);

export const habitCategorySchema = z.enum([
  "nutrition",
  "productivity",
  "fitness",
]);

export const habitFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
const habitWeekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export const habitWeekdaysSchema = z
  .array(habitWeekdaySchema)
  .max(7)
  .superRefine((weekdays, context) => {
    if (new Set(weekdays).size !== weekdays.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Habit weekdays cannot contain duplicates.",
      });
    }
  });

const starterPackHabitDraftSchema = z
  .object({
    category: habitCategorySchema,
    frequency: habitFrequencySchema,
    name: habitNameSchema,
    selectedWeekdays: habitWeekdaysSchema.nullish(),
  })
  .strict();

export const starterPackApplySchema = z
  .array(starterPackHabitDraftSchema)
  .max(12, {
    message: "Starter packs can contain at most 12 habits.",
  });

const themeModeSchema = z.enum(["system", "light", "dark"]);

export const appSettingsSchema = z
  .object({
    focusCyclesBeforeLongBreak: z
      .number()
      .int()
      .refine(isValidFocusCyclesBeforeLongBreak, {
        message: "Cycles before a long break must be between 1 and 12.",
      }),
    focusDefaultDurationSeconds: z
      .number()
      .int()
      .refine(isValidFocusDurationSeconds, {
        message: "Focus duration must be between 1 second and 60 minutes.",
      }),
    focusLongBreakSeconds: z
      .number()
      .int()
      .refine(isValidFocusBreakDurationSeconds, {
        message: "Long break duration must be between 1 second and 60 minutes.",
      }),
    focusShortBreakSeconds: z
      .number()
      .int()
      .refine(isValidFocusBreakDurationSeconds, {
        message:
          "Short break duration must be between 1 second and 60 minutes.",
      }),
    launchAtLogin: z.boolean(),
    minimizeToTray: z.boolean(),
    reminderEnabled: z.boolean(),
    reminderSnoozeMinutes: z
      .number()
      .int()
      .refine(isValidReminderSnoozeMinutes, {
        message: "Reminder snooze minutes must be between 1 and 240.",
      }),
    reminderTime: z.string().refine(isValidReminderTime, {
      message: "Reminder time must use HH:MM 24-hour format.",
    }),
    themeMode: themeModeSchema,
    timezone: z.string().trim().min(1).refine(isValidTimeZone, {
      message: "Timezone must be a valid IANA timezone.",
    }),
  })
  .strict()
  .superRefine((settings, context) => {
    if (settings.focusLongBreakSeconds < settings.focusShortBreakSeconds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Long break duration must be greater than or equal to short break duration.",
        path: ["focusLongBreakSeconds"],
      });
    }
  });

export const completeOnboardingInputSchema = z
  .object({
    habits: starterPackApplySchema,
    settings: appSettingsSchema,
  })
  .strict();

export const reorderHabitIdsSchema = z
  .array(habitIdSchema)
  .superRefine((habitIds, context) => {
    const uniqueHabitIds = new Set(habitIds);

    if (uniqueHabitIds.size !== habitIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Habit reorder payload cannot contain duplicate ids.",
      });
    }
  });

export const notificationTitleSchema = z.string().trim().min(1).max(80);

export const notificationBodySchema = z.string().trim().min(1).max(240);

export const notificationIconFilenameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9._-]+$/i, {
    message: "Notification icon filename must be a simple asset filename.",
  })
  .optional();

export const createFocusSessionInputSchema = z
  .object({
    completedAt: isoTimestampSchema,
    completedDate: dateKeySchema,
    durationSeconds: z
      .number()
      .int()
      .positive()
      .max(60 * 60 * 8),
    entryKind: focusSessionEntryKindSchema,
    startedAt: isoTimestampSchema,
    timerSessionId: z.string().trim().min(1).max(120),
  })
  .strict();
