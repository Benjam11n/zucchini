export function getDailyHabitKeyboardRowId(habitId: number): string {
  return `daily-${habitId}`;
}

export function getCarryoverKeyboardRowId(
  sourceDate: string,
  habitId: number
): string {
  return `carryover-${sourceDate}-${habitId}`;
}

export function getPeriodicHabitKeyboardRowId(habitId: number): string {
  return `periodic-${habitId}`;
}
