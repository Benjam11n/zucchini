import { z } from "zod";

import {
  isValidReminderSnoozeMinutes,
  isValidReminderTime,
  isValidTimeZone,
} from "../domain/settings";

export const habitIdSchema = z.number().int().positive();
export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date keys must use YYYY-MM-DD format.",
});

export const habitNameSchema = z.string().trim().min(1).max(120);

export const habitCategorySchema = z.enum([
  "nutrition",
  "productivity",
  "fitness",
]);

export const habitFrequencySchema = z.enum(["daily", "weekly", "monthly"]);

const themeModeSchema = z.enum(["system", "light", "dark"]);

export const appSettingsSchema = z
  .object({
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
