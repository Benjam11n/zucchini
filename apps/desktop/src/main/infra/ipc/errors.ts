import { IpcValidationError } from "@/main/infra/ipc/validation";
/**
 * IPC error serialization.
 *
 * Converts internal error types (`IpcValidationError`, `DatabaseError`, or
 * unknown errors) into the `SerializedAppIpcError` shape that the preload
 * bridge can safely forward to the renderer.
 */
import { DatabaseError } from "@/main/ports/database-error";
import type { SerializedAppIpcError } from "@/shared/contracts/ipc/app-errors";

export function serializeIpcError(error: unknown): SerializedAppIpcError {
  if (error instanceof IpcValidationError) {
    return {
      code: "VALIDATION_ERROR",
      details: error.details,
      message: error.message,
    };
  }

  if (error instanceof DatabaseError) {
    return {
      code: "DATABASE_ERROR",
      message: "Zucchini could not access its local data.",
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Something went wrong while processing your request.",
  };
}
