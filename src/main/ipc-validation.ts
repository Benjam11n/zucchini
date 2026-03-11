import type { ZodType } from "zod";

import {
  appSettingsSchema,
  completeOnboardingInputSchema,
  createFocusSessionInputSchema,
  dateKeySchema,
  focusSessionLimitSchema,
  focusTimerCycleIdSchema,
  focusTimerInstanceIdSchema,
  focusTimerLeaseTtlSchema,
  habitCategorySchema,
  habitFrequencySchema,
  habitIdSchema,
  historyLimitSchema,
  habitNameSchema,
  notificationBodySchema,
  notificationIconFilenameSchema,
  notificationTitleSchema,
  reorderHabitIdsSchema,
  starterPackApplySchema,
} from "@/shared/contracts/habits-ipc-schema";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import type {
  CompleteOnboardingInput,
  StarterPackHabitDraft,
} from "@/shared/domain/onboarding";
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

export function validateHabitId(value: unknown): number {
  return parseWithSchema("habit id", habitIdSchema, value);
}

export function validateDateKey(label: string, value: unknown): string {
  return parseWithSchema(label, dateKeySchema, value);
}

export function validateHistoryLimit(value: unknown): number | undefined {
  return parseWithSchema("history limit", historyLimitSchema, value);
}

export function validateFocusSessionLimit(value: unknown): number | undefined {
  return parseWithSchema("focus session limit", focusSessionLimitSchema, value);
}

export function validateFocusTimerCycleId(value: unknown): string {
  return parseWithSchema(
    "focus timer cycle id",
    focusTimerCycleIdSchema,
    value
  );
}

export function validateFocusTimerInstanceId(value: unknown): string {
  return parseWithSchema(
    "focus timer instance id",
    focusTimerInstanceIdSchema,
    value
  );
}

export function validateFocusTimerLeaseTtl(value: unknown): number {
  return parseWithSchema(
    "focus timer leadership ttl",
    focusTimerLeaseTtlSchema,
    value
  );
}

export function validateHabitName(value: unknown): string {
  return parseWithSchema("habit name", habitNameSchema, value);
}

export function validateHabitCategory(value: unknown): HabitCategory {
  return parseWithSchema("habit category", habitCategorySchema, value);
}

export function validateHabitFrequency(value: unknown): HabitFrequency {
  return parseWithSchema("habit frequency", habitFrequencySchema, value);
}

export function validateAppSettings(value: unknown): AppSettings {
  return parseWithSchema("app settings", appSettingsSchema, value);
}

export function validateReorderHabitIds(value: unknown): number[] {
  return parseWithSchema("habit order", reorderHabitIdsSchema, value);
}

export function validateStarterPackApply(
  value: unknown
): StarterPackHabitDraft[] {
  return parseWithSchema("starter pack habits", starterPackApplySchema, value);
}

export function validateCompleteOnboardingInput(
  value: unknown
): CompleteOnboardingInput {
  return parseWithSchema(
    "complete onboarding",
    completeOnboardingInputSchema,
    value
  );
}

export function validateNotificationTitle(value: unknown): string {
  return parseWithSchema("notification title", notificationTitleSchema, value);
}

export function validateNotificationBody(value: unknown): string {
  return parseWithSchema("notification body", notificationBodySchema, value);
}

export function validateNotificationIconFilename(
  value: unknown
): string | undefined {
  return parseWithSchema(
    "notification icon filename",
    notificationIconFilenameSchema,
    value
  );
}

export function validateCreateFocusSessionInput(
  value: unknown
): CreateFocusSessionInput {
  return parseWithSchema("focus session", createFocusSessionInputSchema, value);
}
