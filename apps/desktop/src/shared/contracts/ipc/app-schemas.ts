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
  .regex(/^[a-z0-9._-]+$/iu, {
    message: "Notification icon filename must be a simple asset filename.",
  })
  .optional();

export const focusQuotaGoalIdPayloadSchema = z.strictObject({
  goalId: habitIdSchema,
});

export const habitIdPayloadSchema = z.strictObject({
  habitId: habitIdSchema,
});

export const windDownActionIdPayloadSchema = z.strictObject({
  actionId: habitIdSchema,
});

export const createHabitPayloadSchema = z.strictObject({
  category: habitCategorySchema,
  frequency: habitFrequencySchema,
  name: habitNameSchema,
  selectedWeekdays: habitWeekdaysSchema.nullable().optional(),
  targetCount: habitTargetCountSchema.nullable().optional(),
});

export const updateHabitFrequencyPayloadSchema = z.strictObject({
  frequency: habitFrequencySchema,
  habitId: habitIdSchema,
  targetCount: habitTargetCountSchema.nullable().optional(),
});

export const focusQuotaGoalUpsertPayloadSchema = z
  .strictObject({
    frequency: goalFrequencySchema,
    targetMinutes: focusQuotaTargetMinutesSchema,
  })
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

export const renameHabitPayloadSchema = z.strictObject({
  habitId: habitIdSchema,
  name: habitNameSchema,
});

export const reorderHabitPayloadSchema = z.strictObject({
  habitIds: reorderHabitIdsSchema,
});

export const updateHabitCategoryPayloadSchema = z.strictObject({
  category: habitCategorySchema,
  habitId: habitIdSchema,
});

export const updateHabitTargetCountPayloadSchema = z.strictObject({
  habitId: habitIdSchema,
  targetCount: habitTargetCountSchema,
});

export const updateHabitWeekdaysPayloadSchema = z.strictObject({
  habitId: habitIdSchema,
  selectedWeekdays: habitWeekdaysSchema.nullable(),
});

export const setDayStatusPayloadSchema = z.strictObject({
  kind: z.enum(["rescheduled", "rest", "sick"]).nullable(),
});

export const toggleCarryoverPayloadSchema = z.strictObject({
  habitId: habitIdSchema,
  sourceDate: dateKeySchema,
});

export const createWindDownActionPayloadSchema = z.strictObject({
  name: habitNameSchema,
});

export const renameWindDownActionPayloadSchema = z.strictObject({
  actionId: habitIdSchema,
  name: habitNameSchema,
});

export const focusSessionListPayloadSchema = z
  .strictObject({
    limit: focusSessionLimitSchema,
  })
  .optional();

export const optionalLimitPayloadSchema = z
  .strictObject({
    limit: historyLimitSchema,
  })
  .optional();
const insightsRangeDaysSchema = z.union(
  INSIGHTS_RANGE_OPTIONS.map((rangeDays) => z.literal(rangeDays))
);
export const optionalInsightsPayloadSchema = z
  .strictObject({
    rangeDays: insightsRangeDaysSchema.optional(),
  })
  .optional();

export const historyYearPayloadSchema = z.strictObject({
  year: historyYearSchema,
});

export const historySummaryMonthPayloadSchema = z.strictObject({
  month: historyMonthSchema,
  year: historyYearSchema,
});

export const historyDayPayloadSchema = z.strictObject({
  date: dateKeySchema,
});

export const weeklyReviewPayloadSchema = z.strictObject({
  weekStart: dateKeySchema,
});
