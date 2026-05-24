type HabitsIpcErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface SerializedHabitsIpcError {
  code: HabitsIpcErrorCode;
  details?: string[];
  message: string;
}

export type HabitsIpcResponse<T> =
  | { data: T; ok: true }
  | { error: SerializedHabitsIpcError; ok: false };

export class HabitsIpcError extends Error {
  readonly code: HabitsIpcErrorCode;
  readonly details?: string[];

  constructor({ code, details, message }: SerializedHabitsIpcError) {
    super(message);
    this.code = code;
    if (details) {
      this.details = details;
    }
    this.name = "HabitsIpcError";
  }
}

export function toHabitsIpcError(error: unknown): HabitsIpcError {
  if (error instanceof HabitsIpcError) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Partial<SerializedHabitsIpcError>;
    if (
      typeof candidate.code === "string" &&
      typeof candidate.message === "string"
    ) {
      const details = Array.isArray(candidate.details)
        ? candidate.details.filter(
            (detail): detail is string => typeof detail === "string"
          )
        : undefined;

      return new HabitsIpcError({
        code: candidate.code as HabitsIpcErrorCode,
        ...(details ? { details } : {}),
        message: candidate.message,
      });
    }
  }

  return new HabitsIpcError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong while processing your request.",
  });
}
