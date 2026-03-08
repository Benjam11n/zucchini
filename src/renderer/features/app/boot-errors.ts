import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";

export function getBootErrorDisplay(error: HabitsIpcError | null): {
  description: string;
  title: string;
} {
  if (error?.code === "DATABASE_ERROR") {
    return {
      description: "Zucchini could not access its local database. Try again.",
      title: "Could not open your local data",
    };
  }

  if (error?.code === "VALIDATION_ERROR") {
    return {
      description: "Some local data did not pass validation. Try again.",
      title: "Stored data needs attention",
    };
  }

  return {
    description: "Something went wrong while loading your dashboard. Try again.",
    title: "Could not start Zucchini",
  };
}
