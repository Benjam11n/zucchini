// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { HabitCategoryProgress } from "@/shared/domain/habit";

import { HabitActivityCard } from "./habit-activity-card";

describe("habit activity card", () => {
  const categoryProgress: HabitCategoryProgress[] = [
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
  ];

  it("renders the activity ring with uppercase category labels and percentages", () => {
    render(<HabitActivityCard categoryProgress={categoryProgress} />);

    expect(screen.getByText("FITNESS")).toBeInTheDocument();
    expect(screen.getByText("NUTRITION")).toBeInTheDocument();
    expect(screen.getByText("PRODUCTIVITY")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("hides the detailed info panel when showDetails is false", () => {
    const { container } = render(
      <HabitActivityCard
        categoryProgress={categoryProgress}
        showDetails={false}
      />
    );

    expect(screen.queryByText("FITNESS")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies a custom className to the container", () => {
    const { container } = render(
      <HabitActivityCard
        categoryProgress={categoryProgress}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders zero values when no categories are provided", () => {
    render(<HabitActivityCard categoryProgress={[]} />);

    expect(screen.getByText("FITNESS")).toBeInTheDocument();
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });
});
