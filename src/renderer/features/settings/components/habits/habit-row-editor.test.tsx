// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";

import type { HabitWeekday, HabitWithStatus } from "@/shared/domain/habit";

import type * as CategorySelectorModule from "./habit-category-selector";
import type * as FrequencySelectorModule from "./habit-frequency-selector";
import { HabitRowEditor } from "./habit-row-editor";
import type * as WeekdaySelectorModule from "./habit-weekday-selector";

interface MotionMockProps extends ComponentPropsWithoutRef<"div"> {
  animate?: object;
  exit?: object;
  initial?: object;
  layout?: boolean | object | string;
  transition?: object;
  whileHover?: object;
  whileTap?: object;
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
            forwardRef<HTMLElement, MotionMockProps>(
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

vi.mock<typeof CategorySelectorModule>(
  import("./habit-category-selector"),
  () => ({
    HabitCategorySelector: ({
      onChange,
    }: {
      onChange: (category: "fitness" | "nutrition" | "productivity") => void;
    }) => (
      <button onClick={() => onChange("nutrition")} type="button">
        Nutrition
      </button>
    ),
  })
);

vi.mock<typeof FrequencySelectorModule>(
  import("./habit-frequency-selector"),
  () => ({
    HabitFrequencySelector: ({
      onChange,
    }: {
      onChange: (frequency: "daily" | "monthly" | "weekly") => void;
    }) => (
      <button onClick={() => onChange("weekly")} type="button">
        Weekly
      </button>
    ),
  })
);

vi.mock<typeof WeekdaySelectorModule>(
  import("./habit-weekday-selector"),
  () => ({
    HabitWeekdaySelector: ({
      onChange,
    }: {
      onChange: (selectedWeekdays: HabitWeekday[] | null) => void;
    }) => (
      <button onClick={() => onChange([1, 3, 5])} type="button">
        Weekdays
      </button>
    ),
  })
);

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

function renderHabitRowEditor(
  overrides: Partial<ComponentProps<typeof HabitRowEditor>> = {}
) {
  const habits = [createHabit(1), createHabit(2), createHabit(3)];

  return render(
    <HabitRowEditor
      dragState={null}
      habit={habits[1]!}
      habits={habits}
      index={1}
      isExpanded={false}
      onArchiveHabit={vi.fn().mockResolvedValue(42)}
      onDragEnd={vi.fn()}
      onDragOver={vi.fn()}
      onDragStart={vi.fn()}
      onDrop={vi.fn()}
      onExpandedChange={vi.fn()}
      onRenameHabit={vi.fn().mockResolvedValue(42)}
      onReorderHabits={vi.fn().mockResolvedValue(42)}
      onUpdateHabitCategory={vi.fn().mockResolvedValue(42)}
      onUpdateHabitFrequency={vi.fn().mockResolvedValue(42)}
      onUpdateHabitWeekdays={vi.fn().mockResolvedValue(42)}
      {...overrides}
    />
  );
}

describe("habit row editor", () => {
  it("renders a compact summary when collapsed", () => {
    renderHabitRowEditor({
      habit: createHabit(2, {
        category: "nutrition",
        name: "Fish oil",
        selectedWeekdays: [1, 2, 3, 4, 5],
      }),
    });

    expect(screen.getByText("Fish oil")).toBeInTheDocument();
    expect(screen.getByText("Nutrition")).toBeInTheDocument();
    expect(screen.getByText("Weekdays")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Fish oil")).not.toBeInTheDocument();
  });

  it("toggles expansion through the summary row trigger", () => {
    const onExpandedChange = vi.fn();

    renderHabitRowEditor({
      habit: createHabit(2, { name: "Deep work" }),
      onExpandedChange,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand habit details for Deep work",
      })
    );

    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("forwards category, frequency, weekday, and archive actions when expanded", () => {
    const onArchiveHabit = vi.fn().mockResolvedValue(42);
    const onRenameHabit = vi.fn().mockResolvedValue(42);
    const onReorderHabits = vi.fn().mockResolvedValue(42);
    const onUpdateHabitCategory = vi.fn().mockResolvedValue(42);
    const onUpdateHabitFrequency = vi.fn().mockResolvedValue(42);
    const onUpdateHabitWeekdays = vi.fn().mockResolvedValue(42);
    const habits = [createHabit(2)];

    render(
      <HabitRowEditor
        dragState={null}
        habit={habits[0]!}
        habits={habits}
        index={0}
        isExpanded
        onArchiveHabit={onArchiveHabit}
        onDragEnd={vi.fn()}
        onDragOver={vi.fn()}
        onDragStart={vi.fn()}
        onDrop={vi.fn()}
        onExpandedChange={vi.fn()}
        onRenameHabit={onRenameHabit}
        onReorderHabits={onReorderHabits}
        onUpdateHabitCategory={onUpdateHabitCategory}
        onUpdateHabitFrequency={onUpdateHabitFrequency}
        onUpdateHabitWeekdays={onUpdateHabitWeekdays}
      />
    );

    const nameInput = screen.getByDisplayValue("Habit 2");
    fireEvent.change(nameInput, {
      target: { value: "Deep work block" },
    });
    expect(nameInput).toHaveValue("Deep work block");

    fireEvent.click(screen.getByRole("button", { name: "Nutrition" }));
    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
    fireEvent.click(screen.getByRole("button", { name: "Weekdays" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(onUpdateHabitCategory).toHaveBeenCalledWith(2, "nutrition");
    expect(onUpdateHabitFrequency).toHaveBeenCalledWith(2, "weekly");
    expect(onUpdateHabitWeekdays).toHaveBeenCalledWith(2, [1, 3, 5]);
    expect(onArchiveHabit).toHaveBeenCalledWith(2);
  });

  it("reorders habits upward and downward using the computed list", () => {
    const onReorderHabits = vi.fn().mockResolvedValue(42);
    const habits = [createHabit(1), createHabit(2), createHabit(3)];

    render(
      <HabitRowEditor
        dragState={null}
        habit={habits[1]!}
        habits={habits}
        index={1}
        isExpanded={false}
        onArchiveHabit={vi.fn().mockResolvedValue(42)}
        onDragEnd={vi.fn()}
        onDragOver={vi.fn()}
        onDragStart={vi.fn()}
        onDrop={vi.fn()}
        onExpandedChange={vi.fn()}
        onRenameHabit={vi.fn().mockResolvedValue(42)}
        onReorderHabits={onReorderHabits}
        onUpdateHabitCategory={vi.fn().mockResolvedValue(42)}
        onUpdateHabitFrequency={vi.fn().mockResolvedValue(42)}
        onUpdateHabitWeekdays={vi.fn().mockResolvedValue(42)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Habit 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Habit 2 down" }));

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
        dragState={null}
        habit={createHabit(1)}
        habits={[createHabit(1), createHabit(2)]}
        index={0}
        isExpanded={false}
        onArchiveHabit={vi.fn().mockResolvedValue(42)}
        onDragEnd={vi.fn()}
        onDragOver={vi.fn()}
        onDragStart={vi.fn()}
        onDrop={vi.fn()}
        onExpandedChange={vi.fn()}
        onRenameHabit={vi.fn().mockResolvedValue(42)}
        onReorderHabits={vi.fn().mockResolvedValue(42)}
        onUpdateHabitCategory={vi.fn().mockResolvedValue(42)}
        onUpdateHabitFrequency={vi.fn().mockResolvedValue(42)}
        onUpdateHabitWeekdays={vi.fn().mockResolvedValue(42)}
      />
    );

    expect(
      screen.getByRole("button", { name: "Move Habit 1 up" })
    ).toBeDisabled();
  });
});
