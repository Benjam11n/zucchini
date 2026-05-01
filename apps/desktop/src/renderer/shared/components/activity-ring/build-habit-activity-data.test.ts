import type { HabitCategoryProgress } from "@/shared/domain/habit";
import { createDefaultHabitCategoryPreferences } from "@/shared/domain/settings";

import { buildHabitActivityData } from "./build-habit-activity-data";
import { ACTIVITY_RING_SIZES } from "./constants";

describe("buildHabitActivityData()", () => {
  const categoryPreferences = createDefaultHabitCategoryPreferences();

  it("preserves ring order and fills in missing categories with zero values", () => {
    const categoryProgress: HabitCategoryProgress[] = [
      {
        category: "nutrition",
        completed: 2,
        progress: 50,
        total: 4,
      },
    ];

    expect(
      buildHabitActivityData(categoryProgress, categoryPreferences)
    ).toStrictEqual([
      {
        accentTextColor: categoryPreferences.fitness.color,
        color: categoryPreferences.fitness.color,
        current: 0,
        label: categoryPreferences.fitness.label.toUpperCase(),
        size: ACTIVITY_RING_SIZES[0],
        target: 0,
        unit: "Habits",
        value: 0,
      },
      {
        accentTextColor: "#365900",
        color: categoryPreferences.nutrition.color,
        current: 2,
        label: categoryPreferences.nutrition.label.toUpperCase(),
        size: ACTIVITY_RING_SIZES[1],
        target: 4,
        unit: "Habits",
        value: 50,
      },
      {
        accentTextColor: categoryPreferences.productivity.color,
        color: categoryPreferences.productivity.color,
        current: 0,
        label: categoryPreferences.productivity.label.toUpperCase(),
        size: ACTIVITY_RING_SIZES[2],
        target: 0,
        unit: "Habits",
        value: 0,
      },
    ]);
  });

  it("maps provided progress values to the matching category", () => {
    const categoryProgress: HabitCategoryProgress[] = [
      {
        category: "productivity",
        completed: 3,
        progress: 75,
        total: 4,
      },
      {
        category: "fitness",
        completed: 1,
        progress: 25,
        total: 4,
      },
      {
        category: "nutrition",
        completed: 4,
        progress: 100,
        total: 4,
      },
    ];

    expect(
      buildHabitActivityData(categoryProgress, categoryPreferences)
    ).toMatchObject([
      {
        current: 1,
        label: "FITNESS",
        target: 4,
        value: 25,
      },
      {
        current: 4,
        label: "NUTRITION",
        target: 4,
        value: 100,
      },
      {
        current: 3,
        label: "PRODUCTIVITY",
        target: 4,
        value: 75,
      },
    ]);
  });
});
