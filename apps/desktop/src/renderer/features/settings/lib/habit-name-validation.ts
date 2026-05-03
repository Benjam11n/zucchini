import { habitNameSchema } from "@/shared/contracts/habits-ipc-schema";

export function getHabitNameError(name: string): string | null {
  const result = habitNameSchema.safeParse(name);

  if (result.success) {
    return null;
  }

  const [issue] = result.error.issues;

  return issue?.message ?? "Habit names must be valid.";
}
