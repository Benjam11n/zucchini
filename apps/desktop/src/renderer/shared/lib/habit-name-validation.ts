export function getHabitNameError(name: string): string | null {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Habit names cannot be empty.";
  }

  if (trimmedName.length > 120) {
    return "Habit names must be 120 characters or fewer.";
  }

  return null;
}
