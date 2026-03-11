import { DatabaseError } from "@/main/infra/db/sqlite-client";
import { IpcValidationError } from "@/main/infra/ipc/validation";
import type { SerializedHabitsIpcError } from "@/shared/contracts/habits-ipc";

export function serializeIpcError(error: unknown): SerializedHabitsIpcError {
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
