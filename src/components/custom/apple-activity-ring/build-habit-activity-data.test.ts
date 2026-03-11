import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { HabitCategoryProgress } from "@/shared/domain/habit";

import { buildHabitActivityData } from "./build-habit-activity-data";
import { ACTIVITY_RING_ORDER, ACTIVITY_RING_SIZES } from "./constants";

describe("buildHabitActivityData()", () => {
  it("preserves ring order and fills in missing categories with zero values", () => {
    const categoryProgress: HabitCategoryProgress[] = [
      {
        category: "nutrition",
        completed: 2,
        progress: 50,
        total: 4,
      },
    ];

    expect(buildHabitActivityData(categoryProgress)).toStrictEqual([
      {
        color: HABIT_CATEGORY_UI.fitness.ringColor,
        current: 0,
        label: ACTIVITY_RING_ORDER[0].toUpperCase(),
        size: ACTIVITY_RING_SIZES[0],
        target: 0,
        unit: "HABITS",
        value: 0,
      },
      {
        color: HABIT_CATEGORY_UI.nutrition.ringColor,
        current: 2,
        label: ACTIVITY_RING_ORDER[1].toUpperCase(),
        size: ACTIVITY_RING_SIZES[1],
        target: 4,
        unit: "HABITS",
        value: 50,
      },
      {
        color: HABIT_CATEGORY_UI.productivity.ringColor,
        current: 0,
        label: ACTIVITY_RING_ORDER[2].toUpperCase(),
        size: ACTIVITY_RING_SIZES[2],
        target: 0,
        unit: "HABITS",
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

    expect(buildHabitActivityData(categoryProgress)).toMatchObject([
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
