// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";

import type { HabitWithStatus } from "@/shared/domain/habit";

import { HabitRowEditor } from "./habit-row-editor";
import type * as SelectorsModule from "./selectors";

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

vi.mock<typeof SelectorsModule>(import("./selectors"), () => ({
  HabitCategorySelector: ({
    onChange,
  }: {
    onChange: (category: "fitness" | "nutrition" | "productivity") => void;
  }) => (
    <button onClick={() => onChange("nutrition")} type="button">
      Nutrition
    </button>
  ),
  HabitFrequencySelector: ({
    onChange,
  }: {
    onChange: (frequency: "daily" | "monthly" | "weekly") => void;
  }) => (
    <button onClick={() => onChange("weekly")} type="button">
      Weekly
    </button>
  ),
}));

function createHabit(
  id: number,
  overrides: Partial<HabitWithStatus> = {}
): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "daily",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
    ...overrides,
  };
}

describe("habit row editor", () => {
  it("forwards rename, category, frequency, and archive actions", () => {
    const onArchiveHabit = vi.fn().mockResolvedValue(42);
    const onRenameHabit = vi.fn().mockResolvedValue(42);
    const onReorderHabits = vi.fn().mockResolvedValue(42);
    const onUpdateHabitCategory = vi.fn().mockResolvedValue(42);
    const onUpdateHabitFrequency = vi.fn().mockResolvedValue(42);
    const habits = [createHabit(1)];

    render(
      <HabitRowEditor
        habit={habits[0]!}
        habits={habits}
        index={0}
        onArchiveHabit={onArchiveHabit}
        onRenameHabit={onRenameHabit}
        onReorderHabits={onReorderHabits}
        onUpdateHabitCategory={onUpdateHabitCategory}
        onUpdateHabitFrequency={onUpdateHabitFrequency}
      />
    );

    const nameInput = screen.getByDisplayValue("Habit 1");
    fireEvent.change(nameInput, {
      target: { value: "Deep work block" },
    });
    fireEvent.blur(nameInput);

    fireEvent.click(screen.getByRole("button", { name: "Nutrition" }));
    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(onRenameHabit).toHaveBeenCalledWith(1, "Deep work block");
    expect(onUpdateHabitCategory).toHaveBeenCalledWith(1, "nutrition");
    expect(onUpdateHabitFrequency).toHaveBeenCalledWith(1, "weekly");
    expect(onArchiveHabit).toHaveBeenCalledWith(1);
    expect(onReorderHabits).not.toHaveBeenCalled();
  });

  it("reorders habits upward and downward using the computed list", () => {
    const onArchiveHabit = vi.fn().mockResolvedValue(42);
    const onRenameHabit = vi.fn().mockResolvedValue(42);
    const onReorderHabits = vi.fn().mockResolvedValue(42);
    const onUpdateHabitCategory = vi.fn().mockResolvedValue(42);
    const onUpdateHabitFrequency = vi.fn().mockResolvedValue(42);
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    render(
      <HabitRowEditor
        habit={habits[1]!}
        habits={habits}
        index={1}
        onArchiveHabit={onArchiveHabit}
        onRenameHabit={onRenameHabit}
        onReorderHabits={onReorderHabits}
        onUpdateHabitCategory={onUpdateHabitCategory}
        onUpdateHabitFrequency={onUpdateHabitFrequency}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "↑" }));
    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    expect(
      onReorderHabits.mock.calls[0]?.[0].map(
        (habit: HabitWithStatus) => habit.id
      )
    ).toStrictEqual([2, 1, 3]);
    expect(
      onReorderHabits.mock.calls[1]?.[0].map(
        (habit: HabitWithStatus) => habit.id
      )
    ).toStrictEqual([1, 3, 2]);
  });

  it("disables the upward reorder control for the first habit", () => {
    render(
      <HabitRowEditor
        habit={createHabit(1)}
        habits={[createHabit(1), createHabit(2)]}
        index={0}
        onArchiveHabit={vi.fn().mockResolvedValue(42)}
        onRenameHabit={vi.fn().mockResolvedValue(42)}
        onReorderHabits={vi.fn().mockResolvedValue(42)}
        onUpdateHabitCategory={vi.fn().mockResolvedValue(42)}
        onUpdateHabitFrequency={vi.fn().mockResolvedValue(42)}
      />
    );

    expect(screen.getByRole("button", { name: "↑" })).toBeDisabled();
  });
});
