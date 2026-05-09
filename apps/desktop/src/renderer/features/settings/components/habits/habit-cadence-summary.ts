import { HABIT_WEEKDAY_DEFINITIONS } from "@/shared/domain/habit";
import type { Habit, HabitWeekday } from "@/shared/domain/habit";

const WEEKDAY_LABELS = Object.fromEntries(
  HABIT_WEEKDAY_DEFINITIONS.map(({ label, value }) => [value, label])
) as Record<HabitWeekday, string>;

const WEEKDAYS: HabitWeekday[] = HABIT_WEEKDAY_DEFINITIONS.map(
  ({ value }) => value
);

export function getHabitCadenceSummary(habit: Habit): string {
  if (habit.frequency === "weekly") {
    return `${habit.targetCount ?? 1}x / week`;
  }

  if (habit.frequency === "monthly") {
    return `${habit.targetCount ?? 1}x / month`;
  }

  const weekdays = habit.selectedWeekdays ?? WEEKDAYS;

  if (weekdays.length === WEEKDAYS.length) {
    return "Daily";
  }

  if (weekdays.join(",") === "1,2,3,4,5") {
    return "Weekdays";
  }

  if (weekdays.join(",") === "0,6") {
    return "Weekends";
  }

  return weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(" ");
}
