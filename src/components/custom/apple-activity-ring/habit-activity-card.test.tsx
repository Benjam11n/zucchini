/* eslint-disable vitest/prefer-called-once */
// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";

import type { ActivityData } from "./types";

const mockActivities = [
  {
    color: "#ff2d55",
    current: 1,
    label: "FITNESS",
    size: 280,
    target: 2,
    unit: "HABITS",
    value: 50,
  },
  {
    color: "#a3f900",
    current: 2,
    label: "NUTRITION",
    size: 220,
    target: 2,
    unit: "HABITS",
    value: 100,
  },
  {
    color: "#04c7dd",
    current: 1,
    label: "PRODUCTIVITY",
    size: 160,
    target: 4,
    unit: "HABITS",
    value: 25,
  },
] satisfies ActivityData[];

async function loadCardModule() {
  vi.resetModules();

  const buildHabitActivityDataModule =
    await import("./build-habit-activity-data");
  const habitActivityCardModule = await import("./habit-activity-card");

  return {
    HabitActivityCard: habitActivityCardModule.HabitActivityCard,
    buildHabitActivityData: buildHabitActivityDataModule.buildHabitActivityData,
    buildHabitActivityDataModule,
  };
}

function resetState(): void {
  cleanup();
  vi.restoreAllMocks();
}

describe("habit activity card", () => {
  it("reuses memoized activity data when categoryProgress keeps the same reference", async () => {
    resetState();

    const { HabitActivityCard, buildHabitActivityDataModule } =
      await loadCardModule();
    const buildHabitActivityDataSpy = vi
      .spyOn(buildHabitActivityDataModule, "buildHabitActivityData")
      .mockReturnValue(mockActivities);

    const categoryProgress = [
      {
        category: "fitness",
        completed: 1,
        progress: 50,
        total: 2,
      },
      {
        category: "nutrition",
        completed: 2,
        progress: 100,
        total: 2,
      },
      {
        category: "productivity",
        completed: 1,
        progress: 25,
        total: 4,
      },
    ] as const;

    const stableReference = [...categoryProgress];
    const { rerender } = render(
      <HabitActivityCard categoryProgress={stableReference} />
    );

    expect(buildHabitActivityDataSpy).toHaveBeenCalledTimes(1);

    rerender(<HabitActivityCard categoryProgress={stableReference} />);
    expect(buildHabitActivityDataSpy).toHaveBeenCalledTimes(1);
  });

  it("recomputes activity data when the categoryProgress reference changes", async () => {
    resetState();

    const { HabitActivityCard, buildHabitActivityDataModule } =
      await loadCardModule();
    const buildHabitActivityDataSpy = vi
      .spyOn(buildHabitActivityDataModule, "buildHabitActivityData")
      .mockReturnValue(mockActivities);

    const initialCategoryProgress = [
      {
        category: "fitness",
        completed: 1,
        progress: 50,
        total: 2,
      },
      {
        category: "nutrition",
        completed: 2,
        progress: 100,
        total: 2,
      },
      {
        category: "productivity",
        completed: 1,
        progress: 25,
        total: 4,
      },
    ] as const;

    const { rerender } = render(
      <HabitActivityCard categoryProgress={[...initialCategoryProgress]} />
    );

    expect(buildHabitActivityDataSpy).toHaveBeenCalledTimes(1);

    rerender(
      <HabitActivityCard
        categoryProgress={[
          {
            category: "fitness",
            completed: 2,
            progress: 100,
            total: 2,
          },
          initialCategoryProgress[1],
          initialCategoryProgress[2],
        ]}
      />
    );

    expect(buildHabitActivityDataSpy).toHaveBeenCalledTimes(2);
  });
});
