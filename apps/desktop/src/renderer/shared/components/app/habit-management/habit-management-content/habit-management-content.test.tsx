// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { Habit, HabitWithStatus } from "@/shared/domain/habit";
import { createFramerMotionMock } from "@/test/fixtures/framer-motion-mock";

import { HabitManagementContent } from "./habit-management-content";

function createAsyncMock() {
  return vi.fn(() => Promise.resolve());
}

vi.mock(import("framer-motion"), (importOriginal) =>
  createFramerMotionMock(importOriginal)
);

function createHabit(id: number): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
  };
}

function createHabitActions(
  overrides: Partial<
    ComponentProps<typeof HabitManagementContent>["actions"]
  > = {}
): ComponentProps<typeof HabitManagementContent>["actions"] {
  return {
    archiveHabit: createAsyncMock(),
    createHabit: createAsyncMock(),
    renameHabit: createAsyncMock(),
    reorderHabits: createAsyncMock(),
    unarchiveHabit: createAsyncMock(),
    updateHabitCategory: createAsyncMock(),
    updateHabitFrequency: createAsyncMock(),
    updateHabitTargetCount: createAsyncMock(),
    updateHabitWeekdays: createAsyncMock(),
    ...overrides,
  };
}

describe("habit management content", () => {
  it("keeps only one habit expanded at a time", () => {
    render(
      <HabitManagementContent
        actions={createHabitActions()}
        habits={[createHabit(1), createHabit(2)]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand habit details for Habit 1",
      })
    );

    expect(screen.getByDisplayValue("Habit 1")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Habit 2")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand habit details for Habit 2",
      })
    );

    expect(screen.queryByDisplayValue("Habit 1")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Habit 2")).toBeInTheDocument();
  });

  it("renders separate frequency sections in the settings habit list", () => {
    render(
      <HabitManagementContent
        actions={createHabitActions()}
        habits={[
          createHabit(1),
          { ...createHabit(2), frequency: "weekly", targetCount: 3 },
          { ...createHabit(3), frequency: "monthly", targetCount: 8 },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Daily" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekly" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Monthly" })
    ).toBeInTheDocument();
  });

  it("shows inline undo after archiving and restores on undo", async () => {
    const onArchiveHabit = createAsyncMock();
    const onUnarchiveHabit = createAsyncMock();

    render(
      <HabitManagementContent
        actions={createHabitActions({
          archiveHabit: onArchiveHabit,
          unarchiveHabit: onUnarchiveHabit,
        })}
        habits={[createHabit(1)]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand habit details for Habit 1",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Archive Habit 1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm archive Habit 1" })
    );

    await waitFor(() => {
      expect(onArchiveHabit).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText("Archived Habit 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(onUnarchiveHabit).toHaveBeenCalledWith(1);
    });

    expect(screen.queryByText('Restored "Habit 1".')).not.toBeInTheDocument();
  });

  it("expands the newly created top habit after creation completes", async () => {
    let renderCount = 0;
    const onCreateHabit = vi.fn(async () => {});
    const view = render(
      <HabitManagementContent
        actions={createHabitActions({ createHabit: onCreateHabit })}
        habits={[createHabit(1)]}
      />
    );

    renderCount += 1;

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Drink water" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));

    await waitFor(() => {
      expect(onCreateHabit).toHaveBeenCalledWith(
        "Drink water",
        "productivity",
        "daily",
        null,
        1
      );
    });

    view.rerender(
      <HabitManagementContent
        actions={createHabitActions({ createHabit: onCreateHabit })}
        habits={[
          {
            ...createHabit(2),
            name: "Drink water",
            sortOrder: 0,
          },
          {
            ...createHabit(1),
            sortOrder: 1,
          },
        ]}
      />
    );

    expect(renderCount).toBe(1);
    expect(screen.getByDisplayValue("Drink water")).toBeInTheDocument();
  });

  it("auto sorts habits by ring category order and restores the previous order on undo", async () => {
    const submittedOrders: number[][] = [];
    const onReorderHabits = vi.fn((nextHabits: Habit[]) => {
      submittedOrders.push(nextHabits.map((habit) => habit.id));
      return Promise.resolve();
    });
    const habits = [
      createHabit(1),
      { ...createHabit(2), category: "fitness", sortOrder: 1 },
      { ...createHabit(3), category: "nutrition", sortOrder: 2 },
    ] as const;

    render(
      <HabitManagementContent
        actions={createHabitActions({ reorderHabits: onReorderHabits })}
        habits={[...habits]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Auto sort" }));

    await waitFor(() => {
      expect(submittedOrders[0]).toStrictEqual([2, 3, 1]);
    });

    expect(
      screen.getByText("Grouped habits by category order.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(submittedOrders[1]).toStrictEqual([1, 2, 3]);
    });

    expect(
      screen.queryByText("Grouped habits by category order.")
    ).not.toBeInTheDocument();
  });

  it("submits the full habit list when moving a habit within a frequency section", async () => {
    const onReorderHabits = vi.fn().mockResolvedValue(42);
    const habits = [
      createHabit(1),
      { ...createHabit(2), frequency: "weekly", sortOrder: 1, targetCount: 3 },
      { ...createHabit(3), frequency: "weekly", sortOrder: 2, targetCount: 3 },
      { ...createHabit(4), frequency: "monthly", sortOrder: 3, targetCount: 8 },
    ] satisfies HabitWithStatus[];

    render(
      <HabitManagementContent
        actions={createHabitActions({ reorderHabits: onReorderHabits })}
        habits={habits}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Habit 3 up" }));

    await waitFor(() => {
      expect(onReorderHabits).toHaveBeenCalled();
    });
    expect(
      onReorderHabits.mock.calls[0]?.[0].map((habit: Habit) => habit.id)
    ).toStrictEqual([1, 3, 2, 4]);
  });
});
