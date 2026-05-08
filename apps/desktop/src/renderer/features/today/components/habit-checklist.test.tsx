// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { ListChecks } from "lucide-react";

import type { HabitWithStatus } from "@/shared/domain/habit";

import { HabitChecklist } from "./habit-checklist";

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

describe("habit checklist", () => {
  it("renders read-only daily rows without toggling", () => {
    const onToggleHabit = vi.fn();

    render(
      <HabitChecklist
        completedCount={1}
        habits={[
          createHabit(1, { completed: true, name: "Completed historical row" }),
          createHabit(2, { name: "Incomplete historical row" }),
        ]}
        icon={ListChecks}
        onToggleHabit={onToggleHabit}
        readOnly
        title="Thu, 12 Mar"
      />
    );

    fireEvent.click(screen.getByText("Completed historical row"));
    fireEvent.click(screen.getByText("Incomplete historical row"));

    expect(screen.getByText("Thu, 12 Mar")).toBeInTheDocument();
    expect(screen.getByText("Completed historical row")).toBeInTheDocument();
    expect(screen.getByText("Incomplete historical row")).toBeInTheDocument();
    expect(onToggleHabit).not.toHaveBeenCalled();
  });
});
