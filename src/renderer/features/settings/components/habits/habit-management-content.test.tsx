// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";

import type { HabitWithStatus } from "@/shared/domain/habit";

import { HabitManagementContent } from "./habit-management-content";

function createAsyncMock() {
  return vi.fn(() => Promise.resolve());
}

vi.mock<typeof FramerMotion>(
  import("framer-motion"),
  async (importOriginal) => {
    const actual = await importOriginal();

    return {
      ...actual,
      m: new Proxy(
        {},
        {
          get: (_, tag: string) =>
            forwardRef<HTMLElement, Record<string, unknown>>(
              function MotionMock(props, ref) {
                const {
                  animate: _animate,
                  exit: _exit,
                  initial: _initial,
                  layout: _layout,
                  transition: _transition,
                  whileHover: _whileHover,
                  whileTap: _whileTap,
                  variants: _variants,
                  ...rest
                } = props;

                return createElement(tag, { ...rest, ref });
              }
            ),
        }
      ) as typeof actual.m,
    };
  }
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

describe("habit management content", () => {
  it("keeps only one habit expanded at a time", () => {
    render(
      <HabitManagementContent
        habits={[createHabit(1), createHabit(2)]}
        onArchiveHabit={createAsyncMock()}
        onCreateHabit={createAsyncMock()}
        onRenameHabit={createAsyncMock()}
        onReorderHabits={createAsyncMock()}
        onUnarchiveHabit={createAsyncMock()}
        onUpdateHabitCategory={createAsyncMock()}
        onUpdateHabitFrequency={createAsyncMock()}
        onUpdateHabitWeekdays={createAsyncMock()}
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

  it("shows undo feedback after archiving and restores on undo", async () => {
    const onArchiveHabit = createAsyncMock();
    const onUnarchiveHabit = createAsyncMock();

    render(
      <HabitManagementContent
        habits={[createHabit(1)]}
        onArchiveHabit={onArchiveHabit}
        onCreateHabit={createAsyncMock()}
        onRenameHabit={createAsyncMock()}
        onReorderHabits={createAsyncMock()}
        onUnarchiveHabit={onUnarchiveHabit}
        onUpdateHabitCategory={createAsyncMock()}
        onUpdateHabitFrequency={createAsyncMock()}
        onUpdateHabitWeekdays={createAsyncMock()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand habit details for Habit 1",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      expect(onArchiveHabit).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Archived "Habit 1".')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(onUnarchiveHabit).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Restored "Habit 1".')).toBeInTheDocument();
  });
});
