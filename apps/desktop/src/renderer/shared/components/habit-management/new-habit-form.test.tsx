// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createFramerMotionMock } from "@/test/fixtures/framer-motion-mock";

import { NewHabitForm } from "./new-habit-form";

function createAsyncMock() {
  return vi.fn(() => Promise.resolve());
}

vi.mock(import("framer-motion"), (importOriginal) =>
  createFramerMotionMock(importOriginal)
);

describe("new habit form", () => {
  it("focuses the name input when the form opens", () => {
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(<NewHabitForm onCreateHabit={createAsyncMock()} />);

    expect(focusSpy).toHaveBeenCalledWith();
    focusSpy.mockRestore();
  });

  it("keeps category visible by default and reveals advanced options on demand", () => {
    render(<NewHabitForm onCreateHabit={createAsyncMock()} />);

    expect(screen.getByText("Add a habit")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Keep setup quick")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More options" }));

    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("Applies on")).toBeInTheDocument();
  });

  it("submits using the existing defaults and restores focus to the name input", async () => {
    const onCreateHabit = createAsyncMock();
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(<NewHabitForm onCreateHabit={onCreateHabit} />);

    focusSpy.mockClear();

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

    await waitFor(() => {
      const input = screen.getByLabelText("Name");
      expect(input).toHaveValue("");
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      'Added "Drink water".'
    );
    expect(focusSpy.mock.calls).toStrictEqual([[]]);
    focusSpy.mockRestore();
  });

  it("shows an inline error and blocks submission when the habit name is too long", () => {
    const onCreateHabit = createAsyncMock();

    render(<NewHabitForm onCreateHabit={onCreateHabit} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "a".repeat(121) },
    });

    expect(
      screen.getByText("Habit names must be 120 characters or fewer.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByRole("button", { name: "Add habit" })).toBeDisabled();
    expect(onCreateHabit).not.toHaveBeenCalled();
  });
});
