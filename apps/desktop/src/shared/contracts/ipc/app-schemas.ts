import { z } from "zod";

import {
  getFocusQuotaTargetMinutesBounds,
  isValidFocusQuotaTargetMinutes,
} from "@/shared/domain/goal";
import { INSIGHTS_RANGE_OPTIONS } from "@/shared/domain/insights";
import { dateKeySchema } from "@/shared/domain/schemas/date";
import {
  focusQuotaTargetMinutesSchema,
  goalFrequencySchema,
} from "@/shared/domain/schemas/goal";
import {
  habitCategorySchema,
  habitFrequencySchema,
  habitIdSchema,
  habitNameSchema,
  habitTargetCountSchema,
  habitWeekdaysSchema,
  reorderHabitIdsSchema,
} from "@/shared/domain/schemas/habit";

const historyLimitSchema = z.number().int().min(1).max(366).optional();
const historyYearSchema = z.number().int().min(1970).max(9999);
const historyMonthSchema = z.number().int().min(1).max(12);
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
export const backupRestoreIdSchema = z.string().trim().min(1).max(120);

export const notificationTitleSchema = z.string().trim().min(1).max(80);

export const notificationBodySchema = z.string().trim().min(1).max(240);

export const notificationIconFilenameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9._-]+$/i, {
    message: "Notification icon filename must be a simple asset filename.",
  })
  .optional();

export const focusQuotaGoalIdPayloadSchema = z
  .object({
    goalId: habitIdSchema,
  })
  .strict();

export const habitIdPayloadSchema = z
  .object({
    habitId: habitIdSchema,
  })
  .strict();

export const windDownActionIdPayloadSchema = z
  .object({
    actionId: habitIdSchema,
  })
  .strict();

export const createHabitPayloadSchema = z
  .object({
    category: habitCategorySchema,
    frequency: habitFrequencySchema,
    name: habitNameSchema,
    selectedWeekdays: habitWeekdaysSchema.nullable().optional(),
    targetCount: habitTargetCountSchema.nullable().optional(),
  })
  .strict();

export const updateHabitFrequencyPayloadSchema = z
  .object({
    frequency: habitFrequencySchema,
    habitId: habitIdSchema,
    targetCount: habitTargetCountSchema.nullable().optional(),
  })
  .strict();

export const focusQuotaGoalUpsertPayloadSchema = z
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

export const renameHabitPayloadSchema = z
  .object({ habitId: habitIdSchema, name: habitNameSchema })
  .strict();

export const reorderHabitPayloadSchema = z
  .object({ habitIds: reorderHabitIdsSchema })
  .strict();

export const updateHabitCategoryPayloadSchema = z
  .object({ category: habitCategorySchema, habitId: habitIdSchema })
  .strict();

export const updateHabitTargetCountPayloadSchema = z
  .object({ habitId: habitIdSchema, targetCount: habitTargetCountSchema })
  .strict();

export const updateHabitWeekdaysPayloadSchema = z
  .object({
    habitId: habitIdSchema,
    selectedWeekdays: habitWeekdaysSchema.nullable(),
  })
  .strict();

export const setDayStatusPayloadSchema = z
  .object({ kind: z.enum(["rescheduled", "rest", "sick"]).nullable() })
  .strict();

export const toggleCarryoverPayloadSchema = z
  .object({ habitId: habitIdSchema, sourceDate: dateKeySchema })
  .strict();

export const createWindDownActionPayloadSchema = z
  .object({ name: habitNameSchema })
  .strict();

export const renameWindDownActionPayloadSchema = z
  .object({ actionId: habitIdSchema, name: habitNameSchema })
  .strict();

export const focusSessionListPayloadSchema = z
  .object({
    limit: focusSessionLimitSchema,
  })
  .strict()
  .optional();

export const optionalLimitPayloadSchema = z
  .object({
    limit: historyLimitSchema,
  })
  .strict()
  .optional();
const insightsRangeDaysSchema = z.union(
  INSIGHTS_RANGE_OPTIONS.map((rangeDays) => z.literal(rangeDays))
);
export const optionalInsightsPayloadSchema = z
  .object({
    rangeDays: insightsRangeDaysSchema.optional(),
  })
  .strict()
  .optional();

export const historyYearPayloadSchema = z
  .object({ year: historyYearSchema })
  .strict();

export const historySummaryMonthPayloadSchema = z
  .object({ month: historyMonthSchema, year: historyYearSchema })
  .strict();

export const historyDayPayloadSchema = z
  .object({ date: dateKeySchema })
  .strict();

export const weeklyReviewPayloadSchema = z
  .object({ weekStart: dateKeySchema })
  .strict();
