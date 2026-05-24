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
  habitCommandRegistry,
  isHabitCommandType,
} from "@/shared/contracts/habits-ipc-command-registry";
import type { HabitCommand } from "@/shared/contracts/habits-ipc-command-registry";
import {
  habitQueryRegistry,
  isHabitQueryType,
} from "@/shared/contracts/habits-ipc-query-registry";
import type { HabitQuery } from "@/shared/contracts/habits-ipc-query-registry";
import {
  appSettingsSchema,
  backupRestoreIdSchema,
  createFocusSessionInputSchema,
  focusSessionLimitSchema,
  focusTimerCycleIdSchema,
  focusTimerInstanceIdSchema,
  focusTimerLeaseTtlSchema,
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

export function validateHabitCommand(value: unknown): HabitCommand {
  const envelope = readIpcEnvelope(
    value,
    "habit command",
    "Command",
    isHabitCommandType
  );
  const commandType = envelope.type;
  const definition = habitCommandRegistry[commandType];
  if (definition.payloadSchema === null) {
    if (envelope.hasPayload) {
      throw new IpcValidationError("Invalid payload for habit command.", [
        "Command does not accept a payload.",
      ]);
    }

    return { type: commandType } as HabitCommand;
  }

  if (!envelope.hasPayload) {
    throw new IpcValidationError("Invalid payload for habit command.", [
      "Command payload is required.",
    ]);
  }

  return {
    payload: parseEnvelopePayload(
      "habit command",
      definition.payloadSchema as ZodType<unknown>,
      envelope.payload
    ),
    type: commandType,
  } as HabitCommand;
}

export function validateHabitQuery(value: unknown): HabitQuery {
  const envelope = readIpcEnvelope(
    value,
    "habit query",
    "Query",
    isHabitQueryType
  );
  const queryType = envelope.type;
  const definition = habitQueryRegistry[queryType];
  if (definition.payloadSchema === null) {
    if (envelope.hasPayload) {
      throw new IpcValidationError("Invalid payload for habit query.", [
        "Query does not accept a payload.",
      ]);
    }

    return { type: queryType } as HabitQuery;
  }

  const payload = parseEnvelopePayload(
    "habit query",
    definition.payloadSchema as ZodType<unknown>,
    envelope.payload
  );

  return payload === undefined && !envelope.hasPayload
    ? ({ type: queryType } as HabitQuery)
    : ({ payload, type: queryType } as HabitQuery);
}
