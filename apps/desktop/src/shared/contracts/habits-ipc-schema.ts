/**
 * Runtime validation schemas for IPC payloads.
 *
 * The main process uses these Zod schemas to reject malformed renderer input
 * before any database or business-logic work runs.
 */
import { z } from "zod";

import { FOCUS_TIMER_SHORTCUT_REFERENCE } from "@/shared/contracts/keyboard-shortcuts";
import {
  GOAL_FREQUENCY_DEFINITIONS,
  getFocusQuotaTargetMinutesBounds,
  isValidFocusQuotaTargetMinutes,
} from "@/shared/domain/goal";
import {
  isValidGlobalShortcutAccelerator,
  isValidHabitCategoryColor,
  isValidHabitCategoryIcon,
  isValidHabitCategoryLabel,
  isValidFocusDurationSeconds,
  isValidFocusBreakDurationSeconds,
  isValidFocusCyclesBeforeLongBreak,
  normalizeGlobalShortcutAccelerator,
  isValidReminderSnoozeMinutes,
  isValidReminderTime,
  isValidTimeZone,
} from "@/shared/domain/settings";

export const habitIdSchema = z.number().int().positive();
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date keys must use YYYY-MM-DD format.",
});
const isoTimestampSchema = z.string().datetime({
  message: "Timestamps must use ISO 8601 format.",
  offset: true,
});
const historyLimitSchema = z.number().int().min(1).max(366).optional();
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
const focusTimerPhaseSchema = z.enum(["focus", "break"]);
const focusTimerStatusSchema = z.enum(["idle", "running", "paused"]);
const focusBreakVariantSchema = z.enum(["short", "long"]);

export const habitNameSchema = z
  .string()
  .trim()
  .min(1, "Habit names cannot be empty.")
  .max(120, "Habit names must be 120 characters or fewer.");

export const habitCategorySchema = z.enum([
  "nutrition",
  "productivity",
  "fitness",
]);
const habitCategoryMetadataSchema = z
  .object({
    color: z.string().refine(isValidHabitCategoryColor, {
      message: "Category colors must use #RRGGBB format.",
    }),
    icon: z.string().refine(isValidHabitCategoryIcon, {
      message: "Category icons must use a supported icon id.",
    }),
    label: z.string().refine(isValidHabitCategoryLabel, {
      message: "Category labels must be between 1 and 24 characters.",
    }),
  })
  .strict();

const habitCategoryPreferencesSchema = z
  .object({
    fitness: habitCategoryMetadataSchema,
    nutrition: habitCategoryMetadataSchema,
    productivity: habitCategoryMetadataSchema,
  })
  .strict();

export const habitFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
export const habitTargetCountSchema = z.number().int().min(1).max(31);
const goalFrequencySchema = z.enum(
  GOAL_FREQUENCY_DEFINITIONS.map((definition) => definition.value) as [
    (typeof GOAL_FREQUENCY_DEFINITIONS)[number]["value"],
    ...(typeof GOAL_FREQUENCY_DEFINITIONS)[number]["value"][],
  ]
);
const focusQuotaTargetMinutesSchema = z
  .number()
  .int()
  .min(30, "Focus quota target minutes must be at least 30 minutes.")
  .max(44_640, "Focus quota target minutes must be at most 44,640 minutes.");
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

const themeModeSchema = z.enum(["system", "light", "dark"]);
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

const persistedCompletedBreakStateSchema = z
  .object({
    completedAt: isoTimestampSchema,
    timerSessionId: z.string().trim().min(1).max(120),
    variant: focusBreakVariantSchema,
  })
  .strict();

export const persistedFocusTimerStateSchema = z
  .object({
    breakVariant: focusBreakVariantSchema.nullable(),
    completedFocusCycles: z.number().int().min(0),
    cycleId: z.string().trim().min(1).max(120).nullable(),
    endsAt: isoTimestampSchema.nullable(),
    focusDurationMs: z.number().int().min(0),
    lastCompletedBreak: persistedCompletedBreakStateSchema.nullable(),
    lastUpdatedAt: isoTimestampSchema,
    phase: focusTimerPhaseSchema,
    remainingMs: z.number().int().min(0),
    startedAt: isoTimestampSchema.nullable(),
    status: focusTimerStatusSchema,
    timerSessionId: z.string().trim().min(1).max(120).nullable(),
  })
  .strict()
  .superRefine((state, context) => {
    if (state.phase === "break" && state.breakVariant === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break timers must include a break variant.",
        path: ["breakVariant"],
      });
    }

    if (state.phase === "focus" && state.breakVariant !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Focus timers cannot include a break variant.",
        path: ["breakVariant"],
      });
    }
  });

const focusQuotaGoalIdPayloadSchema = z
  .object({
    goalId: habitIdSchema,
  })
  .strict();

const habitIdPayloadSchema = z
  .object({
    habitId: habitIdSchema,
  })
  .strict();

const windDownActionIdPayloadSchema = z
  .object({
    actionId: habitIdSchema,
  })
  .strict();

const createHabitPayloadSchema = z
  .object({
    category: habitCategorySchema,
    frequency: habitFrequencySchema,
    name: habitNameSchema,
    selectedWeekdays: habitWeekdaysSchema.nullable().optional(),
    targetCount: habitTargetCountSchema.nullable().optional(),
  })
  .strict();

const updateHabitFrequencyPayloadSchema = z
  .object({
    frequency: habitFrequencySchema,
    habitId: habitIdSchema,
    targetCount: habitTargetCountSchema.nullable().optional(),
  })
  .strict();

const focusQuotaGoalUpsertPayloadSchema = z
  .object({
    frequency: goalFrequencySchema,
    targetMinutes: focusQuotaTargetMinutesSchema,
  })
  .strict()
  .superRefine((payload, context) => {
    if (
      isValidFocusQuotaTargetMinutes(payload.frequency, payload.targetMinutes)
    ) {
      return;
    }

    const { max, min } = getFocusQuotaTargetMinutesBounds(payload.frequency);
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Focus quota target minutes for ${payload.frequency} goals must be between ${min.toLocaleString()} and ${max.toLocaleString()} minutes.`,
      path: ["targetMinutes"],
    });
  });

const commandSchemas = [
  z
    .object({
      payload: focusQuotaGoalIdPayloadSchema,
      type: z.literal("focusQuotaGoal.archive"),
    })
    .strict(),
  z
    .object({
      payload: focusQuotaGoalIdPayloadSchema,
      type: z.literal("focusQuotaGoal.unarchive"),
    })
    .strict(),
  z
    .object({
      payload: focusQuotaGoalUpsertPayloadSchema,
      type: z.literal("focusQuotaGoal.upsert"),
    })
    .strict(),
  z
    .object({
      payload: createFocusSessionInputSchema,
      type: z.literal("focusSession.record"),
    })
    .strict(),
  z
    .object({
      payload: persistedFocusTimerStateSchema,
      type: z.literal("focusTimer.saveState"),
    })
    .strict(),
  z
    .object({
      payload: createHabitPayloadSchema,
      type: z.literal("habit.create"),
    })
    .strict(),
  z
    .object({ payload: habitIdPayloadSchema, type: z.literal("habit.archive") })
    .strict(),
  z
    .object({
      payload: habitIdPayloadSchema,
      type: z.literal("habit.decrementProgress"),
    })
    .strict(),
  z
    .object({
      payload: habitIdPayloadSchema,
      type: z.literal("habit.incrementProgress"),
    })
    .strict(),
  z
    .object({
      payload: z
        .object({ habitId: habitIdSchema, name: habitNameSchema })
        .strict(),
      type: z.literal("habit.rename"),
    })
    .strict(),
  z
    .object({
      payload: z.object({ habitIds: reorderHabitIdsSchema }).strict(),
      type: z.literal("habit.reorder"),
    })
    .strict(),
  z
    .object({ payload: habitIdPayloadSchema, type: z.literal("habit.toggle") })
    .strict(),
  z
    .object({
      payload: habitIdPayloadSchema,
      type: z.literal("habit.unarchive"),
    })
    .strict(),
  z
    .object({
      payload: z
        .object({ category: habitCategorySchema, habitId: habitIdSchema })
        .strict(),
      type: z.literal("habit.updateCategory"),
    })
    .strict(),
  z
    .object({
      payload: updateHabitFrequencyPayloadSchema,
      type: z.literal("habit.updateFrequency"),
    })
    .strict(),
  z
    .object({
      payload: z
        .object({ habitId: habitIdSchema, targetCount: habitTargetCountSchema })
        .strict(),
      type: z.literal("habit.updateTargetCount"),
    })
    .strict(),
  z
    .object({
      payload: z
        .object({
          habitId: habitIdSchema,
          selectedWeekdays: habitWeekdaysSchema.nullable(),
        })
        .strict(),
      type: z.literal("habit.updateWeekdays"),
    })
    .strict(),
  z
    .object({ payload: appSettingsSchema, type: z.literal("settings.update") })
    .strict(),
  z.object({ type: z.literal("today.toggleSickDay") }).strict(),
  z
    .object({
      payload: z.object({ name: habitNameSchema }).strict(),
      type: z.literal("windDown.createAction"),
    })
    .strict(),
  z
    .object({
      payload: windDownActionIdPayloadSchema,
      type: z.literal("windDown.deleteAction"),
    })
    .strict(),
  z
    .object({
      payload: z
        .object({ actionId: habitIdSchema, name: habitNameSchema })
        .strict(),
      type: z.literal("windDown.renameAction"),
    })
    .strict(),
  z
    .object({
      payload: windDownActionIdPayloadSchema,
      type: z.literal("windDown.toggleAction"),
    })
    .strict(),
] as const;

export const habitCommandSchema = z.discriminatedUnion("type", commandSchemas);

const optionalLimitPayloadSchema = z
  .object({
    limit: historyLimitSchema,
  })
  .strict()
  .optional();

export const habitQuerySchema = z.discriminatedUnion("type", [
  z
    .object({
      payload: z
        .object({
          limit: focusSessionLimitSchema,
        })
        .strict()
        .optional(),
      type: z.literal("focusSession.list"),
    })
    .strict(),
  z.object({ type: z.literal("focusTimer.getState") }).strict(),
  z.object({ type: z.literal("habit.list") }).strict(),
  z
    .object({
      payload: optionalLimitPayloadSchema,
      type: z.literal("history.get"),
    })
    .strict(),
  z
    .object({
      payload: z.object({ date: dateKeySchema }).strict(),
      type: z.literal("history.getDay"),
    })
    .strict(),
  z
    .object({
      payload: optionalLimitPayloadSchema,
      type: z.literal("history.summary"),
    })
    .strict(),
  z.object({ type: z.literal("today.get") }).strict(),
  z.object({ type: z.literal("today.habitStreaks") }).strict(),
  z
    .object({
      payload: z.object({ weekStart: dateKeySchema }).strict(),
      type: z.literal("weeklyReview.get"),
    })
    .strict(),
  z.object({ type: z.literal("weeklyReview.overview") }).strict(),
]);
