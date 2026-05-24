type AppIpcErrorCode = "VALIDATION_ERROR" | "DATABASE_ERROR" | "INTERNAL_ERROR";

export interface SerializedAppIpcError {
  code: AppIpcErrorCode;
  details?: string[];
  message: string;
}

export type AppIpcResponse<T> =
  | { data: T; ok: true }
  | { error: SerializedAppIpcError; ok: false };

export class AppIpcError extends Error {
  readonly code: AppIpcErrorCode;
  readonly details?: string[];

  constructor({ code, details, message }: SerializedAppIpcError) {
    super(message);
    this.code = code;
    if (details) {
      this.details = details;
    }
    this.name = "AppIpcError";
  }
}

export function toAppIpcError(error: unknown): AppIpcError {
  if (error instanceof AppIpcError) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Partial<SerializedAppIpcError>;
    if (
      typeof candidate.code === "string" &&
      typeof candidate.message === "string"
    ) {
      const details = Array.isArray(candidate.details)
        ? candidate.details.filter(
            (detail): detail is string => typeof detail === "string"
          )
        : undefined;

      return new AppIpcError({
        code: candidate.code as AppIpcErrorCode,
        ...(details ? { details } : {}),
        message: candidate.message,
      });
    }
  }

  return new AppIpcError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong while processing your request.",
  });
}
