/**
 * IPC input validation layer.
 *
 * Provides typed validators for every IPC channel parameter. Each validator
 * parses the incoming `unknown` value against the corresponding Zod schema
 * and throws `IpcValidationError` on mismatch, which the handler wrapper
 * serializes into a `VALIDATION_ERROR` response.
 */
import type { ZodType } from "zod";

import {
  appCommandRegistry,
  isAppCommandType,
} from "@/shared/contracts/ipc/app-command-registry";
import type { AppCommand } from "@/shared/contracts/ipc/app-command-registry";
import {
  appQueryRegistry,
  isAppQueryType,
} from "@/shared/contracts/ipc/app-query-registry";
import type { AppQuery } from "@/shared/contracts/ipc/app-query-registry";
import {
  backupRestoreIdSchema,
  focusSessionLimitSchema,
  focusTimerCycleIdSchema,
  focusTimerInstanceIdSchema,
  focusTimerLeaseTtlSchema,
  focusWidgetSizeSchema,
  notificationBodySchema,
  notificationIconFilenameSchema,
  notificationTitleSchema,
} from "@/shared/contracts/ipc/app-schemas";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import { createFocusSessionInputSchema } from "@/shared/domain/schemas/focus-session";
import {
  habitCategorySchema,
  habitFrequencySchema,
  habitIdSchema,
  habitNameSchema,
  habitTargetCountSchema,
  habitWeekdaysSchema,
  reorderHabitIdsSchema,
} from "@/shared/domain/schemas/habit";
import { appSettingsSchema } from "@/shared/domain/schemas/settings";
import type { AppSettings } from "@/shared/domain/settings";

export class IpcValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.details = details;
    this.name = "IpcValidationError";
  }
}

function formatIssue(path: PropertyKey[], message: string): string {
  return path.length > 0 ? `${path.join(".")}: ${message}` : message;
}

function parseWithSchema<T>(
  label: string,
  schema: ZodType<T>,
  value: unknown,
  pathPrefix: PropertyKey[] = []
): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  throw new IpcValidationError(
    `Invalid payload for ${label}.`,
    result.error.issues.map((issue) =>
      formatIssue([...pathPrefix, ...issue.path.map(String)], issue.message)
    )
  );
}

function createValidator<T>(label: string, schema: ZodType<T>) {
  return (value: unknown): T => parseWithSchema(label, schema, value);
}

function parseEnvelopePayload<T>(
  label: string,
  schema: ZodType<T>,
  value: unknown
): T {
  return parseWithSchema(label, schema, value, ["payload"]);
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

export const validateBackupRestoreId = createValidator(
  "backup restore id",
  backupRestoreIdSchema
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIpcEnvelope<TType extends string>(
  value: unknown,
  label: string,
  noun: "Command" | "Query",
  isKnownType: (type: string) => type is TType
): { hasPayload: boolean; payload: unknown; type: TType } {
  if (!isRecord(value)) {
    throw new IpcValidationError(`Invalid payload for ${label}.`, [
      `${noun} must be an object.`,
    ]);
  }

  const keys = Object.keys(value);
  const unexpectedKeys = keys.filter(
    (key) => key !== "payload" && key !== "type"
  );
  if (unexpectedKeys.length > 0) {
    throw new IpcValidationError(`Invalid payload for ${label}.`, [
      `Unexpected ${noun.toLowerCase()} fields: ${unexpectedKeys.join(", ")}.`,
    ]);
  }

  const { type } = value;

  if (typeof type !== "string" || !isKnownType(type)) {
    throw new IpcValidationError(`Invalid payload for ${label}.`, [
      `${noun} type is not supported.`,
    ]);
  }

  return {
    hasPayload: "payload" in value,
    payload: value["payload"],
    type,
  };
}

export function validateAppCommand(value: unknown): AppCommand {
  const envelope = readIpcEnvelope(
    value,
    "app command",
    "Command",
    isAppCommandType
  );
  const commandType = envelope.type;
  const definition = appCommandRegistry[commandType];
  if (definition.payloadSchema === null) {
    if (envelope.hasPayload) {
      throw new IpcValidationError("Invalid payload for app command.", [
        "Command does not accept a payload.",
      ]);
    }

    return { type: commandType } as AppCommand;
  }

  if (!envelope.hasPayload) {
    throw new IpcValidationError("Invalid payload for app command.", [
      "Command payload is required.",
    ]);
  }

  return {
    payload: parseEnvelopePayload(
      "app command",
      definition.payloadSchema as ZodType<unknown>,
      envelope.payload
    ),
    type: commandType,
  } as AppCommand;
}

export function validateAppQuery(value: unknown): AppQuery {
  const envelope = readIpcEnvelope(value, "app query", "Query", isAppQueryType);
  const queryType = envelope.type;
  const definition = appQueryRegistry[queryType];
  if (definition.payloadSchema === null) {
    if (envelope.hasPayload) {
      throw new IpcValidationError("Invalid payload for app query.", [
        "Query does not accept a payload.",
      ]);
    }

    return { type: queryType } as AppQuery;
  }

  const payload = parseEnvelopePayload(
    "app query",
    definition.payloadSchema as ZodType<unknown>,
    envelope.payload
  );

  return payload === undefined && !envelope.hasPayload
    ? ({ type: queryType } as AppQuery)
    : ({ payload, type: queryType } as AppQuery);
}
