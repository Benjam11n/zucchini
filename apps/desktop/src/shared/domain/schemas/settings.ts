import { z } from "zod";

import { FOCUS_TIMER_SHORTCUT_REFERENCE } from "@/shared/domain/keyboard-shortcuts";
import { isoTimestampSchema } from "@/shared/domain/schemas/date";
import { habitCategoryPreferencesSchema } from "@/shared/domain/schemas/habit";
import {
  isValidFocusBreakDurationSeconds,
  isValidFocusCyclesBeforeLongBreak,
  isValidFocusDurationSeconds,
  isValidGlobalShortcutAccelerator,
  isValidReminderSnoozeMinutes,
  isValidReminderTime,
  isValidTimeZone,
  normalizeGlobalShortcutAccelerator,
} from "@/shared/domain/settings";

const themeModeSchema = z.enum(["system", "light", "dark"]);
const autoBackupCadenceSchema = z.enum(["off", "daily", "weekly"]);
const globalShortcutSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isValidGlobalShortcutAccelerator, {
    message: `Global shortcuts must use a supported accelerator like ${FOCUS_TIMER_SHORTCUT_REFERENCE.toggle}.`,
  });

export const appSettingsSchema = z
  .object({
    autoBackupCadence: autoBackupCadenceSchema,
    autoBackupLastRunAt: isoTimestampSchema.nullable(),
    categoryPreferences: habitCategoryPreferencesSchema,
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
    resetFocusTimerShortcut: globalShortcutSchema,
    themeMode: themeModeSchema,
    timezone: z.string().trim().min(1).refine(isValidTimeZone, {
      message: "Timezone must be a valid IANA timezone.",
    }),
    toggleFocusTimerShortcut: globalShortcutSchema,
    windDownTime: z.string().refine(isValidReminderTime, {
      message: "Wind down time must use HH:MM 24-hour format.",
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

    if (
      normalizeGlobalShortcutAccelerator(settings.toggleFocusTimerShortcut) ===
      normalizeGlobalShortcutAccelerator(settings.resetFocusTimerShortcut)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Global start/pause/resume shortcut must be different from the reset shortcut.",
        path: ["toggleFocusTimerShortcut"],
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Global reset shortcut must be different from the start/pause/resume shortcut.",
        path: ["resetFocusTimerShortcut"],
      });
    }
  });
