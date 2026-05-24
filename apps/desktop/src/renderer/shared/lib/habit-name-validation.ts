import { habitNameSchema } from "@/shared/domain/schemas/habit";

export function getHabitNameError(name: string): string | null {
  const result = habitNameSchema.safeParse(name);

  if (result.success) {
    return null;
  }

  const [issue] = result.error.issues;

  return issue?.message ?? "Habit names must be valid.";
}
