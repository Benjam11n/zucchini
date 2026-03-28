/**
 * Core habit domain types and helpers.
 *
 * This file defines what a habit looks like in Zucchini and includes small,
 * pure utilities for normalizing categories/frequencies and calculating ring
 * progress.
 */
import { parseDateKey } from "@/shared/utils/date";

export const HABIT_CATEGORY_DEFINITIONS = [
  {
    label: "Nutrition",
    value: "nutrition",
  },
  {
    label: "Productivity",
    value: "productivity",
  },
  {
    label: "Fitness",
    value: "fitness",
  },
] as const;

export type HabitCategory =
  (typeof HABIT_CATEGORY_DEFINITIONS)[number]["value"];

export const HABIT_FREQUENCY_DEFINITIONS = [
  {
    label: "Daily",
    value: "daily",
  },
  {
    label: "Weekly",
    value: "weekly",
  },
  {
    label: "Monthly",
    value: "monthly",
  },
] as const;

export type HabitFrequency =
  (typeof HABIT_FREQUENCY_DEFINITIONS)[number]["value"];

export const HABIT_WEEKDAY_DEFINITIONS = [
  {
    label: "Sun",
    longLabel: "Sunday",
    value: 0,
  },
  {
    label: "Mon",
    longLabel: "Monday",
    value: 1,
  },
  {
    label: "Tue",
    longLabel: "Tuesday",
    value: 2,
  },
  {
    label: "Wed",
    longLabel: "Wednesday",
    value: 3,
  },
  {
    label: "Thu",
    longLabel: "Thursday",
    value: 4,
  },
  {
    label: "Fri",
    longLabel: "Friday",
    value: 5,
  },
  {
    label: "Sat",
    longLabel: "Saturday",
    value: 6,
  },
] as const;

export type HabitWeekday = (typeof HABIT_WEEKDAY_DEFINITIONS)[number]["value"];

export const DEFAULT_HABIT_CATEGORY: HabitCategory = "productivity";
export const DEFAULT_HABIT_FREQUENCY: HabitFrequency = "daily";
const ALL_HABIT_WEEKDAYS = HABIT_WEEKDAY_DEFINITIONS.map(
  (definition) => definition.value
) as HabitWeekday[];

export interface Habit {
  category: HabitCategory;
  id: number;
  name: string;
  frequency: HabitFrequency;
  selectedWeekdays?: HabitWeekday[] | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
}

export type HabitWithStatus = Habit & {
  completed: boolean;
};

export interface HabitCategoryProgress {
  category: HabitCategory;
  completed: number;
  progress: number;
  total: number;
}

function isHabitCategory(value: string): value is HabitCategory {
  return HABIT_CATEGORY_DEFINITIONS.some(
    (definition) => definition.value === value
  );
}

function isHabitFrequency(value: string): value is HabitFrequency {
  return HABIT_FREQUENCY_DEFINITIONS.some(
    (definition) => definition.value === value
  );
}

function isHabitWeekday(value: number): value is HabitWeekday {
  return HABIT_WEEKDAY_DEFINITIONS.some(
    (definition) => definition.value === value
  );
}

export function normalizeHabitCategory(value: string): HabitCategory {
  return isHabitCategory(value) ? value : DEFAULT_HABIT_CATEGORY;
}

export function normalizeHabitFrequency(value: string): HabitFrequency {
  return isHabitFrequency(value) ? value : DEFAULT_HABIT_FREQUENCY;
}

export function normalizeHabitWeekdays(
  weekdays: readonly number[] | null | undefined
): HabitWeekday[] | null {
  if (!weekdays || weekdays.length === 0) {
    return null;
  }

  const normalizedWeekdays = [...new Set(weekdays)]
    .filter((weekday): weekday is HabitWeekday => isHabitWeekday(weekday))
    .toSorted((left, right) => left - right);

  if (
    normalizedWeekdays.length === 0 ||
    normalizedWeekdays.length === ALL_HABIT_WEEKDAYS.length
  ) {
    return null;
  }

  return normalizedWeekdays;
}

function getEffectiveHabitWeekdays(
  habit: Pick<Habit, "frequency" | "selectedWeekdays">
): HabitWeekday[] {
  if (habit.frequency !== "daily") {
    return ALL_HABIT_WEEKDAYS;
  }

  return habit.selectedWeekdays ?? ALL_HABIT_WEEKDAYS;
}

export function isDailyHabit(habit: Pick<Habit, "frequency">): boolean {
  return habit.frequency === "daily";
}

function isHabitScheduledForWeekday(
  habit: Pick<Habit, "frequency" | "selectedWeekdays">,
  weekday: number
): boolean {
  return getEffectiveHabitWeekdays(habit).includes(weekday as HabitWeekday);
}

export function isHabitScheduledForDate(
  habit: Pick<Habit, "frequency" | "selectedWeekdays">,
  dateKey: string
): boolean {
  if (habit.frequency !== "daily") {
    return true;
  }

  return isHabitScheduledForWeekday(habit, parseDateKey(dateKey).getDay());
}

export function getHabitCategoryProgress(
  habits: readonly HabitWithStatus[]
): HabitCategoryProgress[] {
  return HABIT_CATEGORY_DEFINITIONS.map(({ value }) => {
    const habitsInCategory = habits.filter((habit) => habit.category === value);
    const completed = habitsInCategory.filter(
      (habit) => habit.completed
    ).length;
    const total = habitsInCategory.length;

    return {
      category: value,
      completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      total,
    };
  });
}
