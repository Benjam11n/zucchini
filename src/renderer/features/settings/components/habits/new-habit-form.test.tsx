// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";

import { NewHabitForm } from "./new-habit-form";

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

describe("new habit form", () => {
  it("keeps category visible by default and reveals advanced options on demand", () => {
    render(<NewHabitForm onCreateHabit={vi.fn().mockResolvedValue()} />);

    expect(screen.getByText("Add a habit")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Keep setup quick")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More options" }));

    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("Applies on")).toBeInTheDocument();
  });

  it("submits using the existing defaults and restores focus to the name input", async () => {
    const onCreateHabit = vi.fn().mockResolvedValue();
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(<NewHabitForm onCreateHabit={onCreateHabit} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Drink water" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));

    await waitFor(() => {
      expect(onCreateHabit).toHaveBeenCalledWith(
        "Drink water",
        "productivity",
        "daily",
        null
      );
    });

    await waitFor(() => {
      const input = screen.getByLabelText("Name");
      expect(input).toHaveValue("");
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      'Added "Drink water".'
    );
    expect(focusSpy).toHaveBeenCalledWith();
    focusSpy.mockRestore();
  });
});
