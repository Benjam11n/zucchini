import type { ZodType } from "zod";

import {
  appSettingsSchema,
  habitCategorySchema,
  habitFrequencySchema,
  habitIdSchema,
  habitNameSchema,
  notificationBodySchema,
  notificationIconFilenameSchema,
  notificationTitleSchema,
  reorderHabitIdsSchema,
} from "@/shared/contracts/habits-ipc-schema";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
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
