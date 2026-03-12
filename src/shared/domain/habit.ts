/**
 * Core habit domain types and helpers.
 *
 * This file defines what a habit looks like in Zucchini and includes small,
 * pure utilities for normalizing categories/frequencies and calculating ring
 * progress.
 */
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

export const DEFAULT_HABIT_CATEGORY: HabitCategory = "productivity";
export const DEFAULT_HABIT_FREQUENCY: HabitFrequency = "daily";

export interface Habit {
  category: HabitCategory;
  id: number;
  name: string;
  frequency: HabitFrequency;
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

export function normalizeHabitCategory(value: string): HabitCategory {
  return isHabitCategory(value) ? value : DEFAULT_HABIT_CATEGORY;
}

export function normalizeHabitFrequency(value: string): HabitFrequency {
  return isHabitFrequency(value) ? value : DEFAULT_HABIT_FREQUENCY;
}

export function isDailyHabit(habit: Pick<Habit, "frequency">): boolean {
  return habit.frequency === "daily";
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
