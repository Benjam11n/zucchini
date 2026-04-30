/**
 * IPC input validation layer.
 *
 * Provides typed validators for every IPC channel parameter. Each validator
 * parses the incoming `unknown` value against the corresponding Zod schema
 * and throws `IpcValidationError` on mismatch, which the handler wrapper
 * serializes into a `VALIDATION_ERROR` response.
 */
import type { ZodType } from "zod";

import type { HabitCommand } from "@/shared/contracts/habits-ipc-commands";
import type { HabitQuery } from "@/shared/contracts/habits-ipc-queries";
import {
  appSettingsSchema,
  createFocusSessionInputSchema,
  focusSessionLimitSchema,
  focusTimerCycleIdSchema,
  focusTimerInstanceIdSchema,
  focusTimerLeaseTtlSchema,
  habitCommandSchema,
  focusWidgetSizeSchema,
  habitCategorySchema,
  habitFrequencySchema,
  habitIdSchema,
  habitNameSchema,
  habitTargetCountSchema,
  habitWeekdaysSchema,
  notificationBodySchema,
  notificationIconFilenameSchema,
  notificationTitleSchema,
  habitQuerySchema,
  reorderHabitIdsSchema,
} from "@/shared/contracts/habits-ipc-schema";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

export class IpcValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.details = details;
    this.name = "IpcValidationError";
  }
}

function parseWithSchema<T>(
  label: string,
  schema: ZodType<T>,
  value: unknown
): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  throw new IpcValidationError(
    `Invalid payload for ${label}.`,
    result.error.issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message
    )
  );
}

function createValidator<T>(label: string, schema: ZodType<T>) {
  return (value: unknown): T => parseWithSchema(label, schema, value);
}

export const validateHabitId = createValidator("habit id", habitIdSchema);

export const validateFocusSessionLimit = createValidator(
  "focus session limit",
  focusSessionLimitSchema
);

export const validateFocusTimerCycleId = createValidator(
  "focus timer cycle id",
  focusTimerCycleIdSchema
);

export const validateFocusTimerInstanceId = createValidator(
  "focus timer instance id",
  focusTimerInstanceIdSchema
);

export const validateFocusTimerLeaseTtl = createValidator(
  "focus timer leadership ttl",
  focusTimerLeaseTtlSchema
);

export const validateFocusWidgetSize = createValidator(
  "focus widget size",
  focusWidgetSizeSchema
);

export const validateHabitName = createValidator("habit name", habitNameSchema);

export const validateHabitCategory = createValidator<HabitCategory>(
  "habit category",
  habitCategorySchema
);

export const validateHabitFrequency = createValidator<HabitFrequency>(
  "habit frequency",
  habitFrequencySchema
);
export const validateHabitTargetCount = createValidator(
  "habit target count",
  habitTargetCountSchema
);
export const validateHabitWeekdays = createValidator<HabitWeekday[]>(
  "habit weekdays",
  habitWeekdaysSchema
);

export const validateAppSettings = createValidator<AppSettings>(
  "app settings",
  appSettingsSchema
);

export const validateReorderHabitIds = createValidator(
  "habit order",
  reorderHabitIdsSchema
);

export const validateNotificationTitle = createValidator(
  "notification title",
  notificationTitleSchema
);

export const validateNotificationBody = createValidator(
  "notification body",
  notificationBodySchema
);

export const validateNotificationIconFilename = createValidator(
  "notification icon filename",
  notificationIconFilenameSchema
);

export const validateCreateFocusSessionInput =
  createValidator<CreateFocusSessionInput>(
    "focus session",
    createFocusSessionInputSchema
  );

export const validateHabitCommand = createValidator<HabitCommand>(
  "habit command",
  habitCommandSchema
);

export const validateHabitQuery = createValidator<HabitQuery>(
  "habit query",
  habitQuerySchema
);
