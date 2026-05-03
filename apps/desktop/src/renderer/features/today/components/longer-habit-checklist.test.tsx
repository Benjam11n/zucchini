// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import { formatDateKey } from "@/shared/utils/date";

import { LongerHabitChecklist } from "./longer-habit-checklist";

function formatResetLabel(
  dateKey: string,
  frequency: "weekly" | "monthly"
): string {
  const { end } = getHabitPeriod(frequency, dateKey);

  return `Resets ${formatDateKey(end, {
    day: "numeric",
    month: "short",
    weekday: "short",
  })}`;
}

function createHabit(
  id: number,
  overrides: Partial<HabitWithStatus> = {}
): HabitWithStatus {
  return {
    category: "productivity",
    completed: false,
    completedCount: 0,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "weekly",
    id,
    isArchived: false,
    name: `Habit ${id}`,
    sortOrder: id - 1,
    targetCount: 1,
    ...overrides,
  };
}

function createFocusQuotaGoal(
  id: number,
  overrides: Partial<FocusQuotaGoalWithStatus> = {}
): FocusQuotaGoalWithStatus {
  return {
    archivedAt: null,
    completed: false,
    completedMinutes: 40,
    createdAt: "2026-03-01T00:00:00.000Z",
    frequency: "weekly",
    id,
    isArchived: false,
    kind: "focus-quota",
    periodEnd: "2026-03-15",
    periodStart: "2026-03-09",
    targetMinutes: 120,
    ...overrides,
  };
}

describe("longer habit checklist", () => {
  it("renders nothing without longer habits or focus quota goals", () => {
    const { container } = render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[]}
        habits={[]}
        onDecrementHabitProgress={vi.fn()}
        onIncrementHabitProgress={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a compact header and period groups without helper copy", () => {
    render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[
          createFocusQuotaGoal(1),
          createFocusQuotaGoal(2, {
            completed: true,
            completedMinutes: 1000,
            frequency: "monthly",
            periodEnd: "2026-03-31",
            periodStart: "2026-03-01",
            targetMinutes: 1000,
          }),
        ]}
        habits={[
          createHabit(1, {
            completed: true,
            completedCount: 2,
            name: "Weekly review",
            targetCount: 2,
          }),
          createHabit(2, {
            category: "fitness",
            completedCount: 1,
            frequency: "monthly",
            name: "Gym sessions",
            targetCount: 3,
          }),
        ]}
        onDecrementHabitProgress={vi.fn()}
        onIncrementHabitProgress={vi.fn()}
      />
    );

    expect(screen.getByText("Beyond Today")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(
      screen.queryByText("Complete any time before the week closes.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Complete any time before the month closes.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "This Week" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "This Month" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Focus quota")).toHaveLength(2);
    expect(
      screen.getByText(formatResetLabel("2026-03-13", "weekly"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatResetLabel("2026-03-13", "monthly"))
    ).toBeInTheDocument();
  });

  it("calls increment and decrement handlers and keeps completed habits incrementable", () => {
    const onDecrementHabitProgress = vi.fn();
    const onIncrementHabitProgress = vi.fn();

    render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[]}
        habits={[
          createHabit(1, {
            completedCount: 0,
            name: "Deep work blocks",
            targetCount: 3,
          }),
          createHabit(2, {
            completed: true,
            completedCount: 2,
            frequency: "monthly",
            name: "Monthly planning",
            targetCount: 2,
          }),
        ]}
        onDecrementHabitProgress={onDecrementHabitProgress}
        onIncrementHabitProgress={onIncrementHabitProgress}
      />
    );

    const deepWorkDecrementButton = screen.getByRole("button", {
      name: "Decrease progress for Deep work blocks",
    });
    const deepWorkIncrementButton = screen.getByRole("button", {
      name: "Increase progress for Deep work blocks",
    });
    const monthlyPlanningDecrementButton = screen.getByRole("button", {
      name: "Decrease progress for Monthly planning",
    });
    const monthlyPlanningIncrementButton = screen.getByRole("button", {
      name: "Increase progress for Monthly planning",
    });

    expect(deepWorkDecrementButton).toBeDisabled();
    expect(monthlyPlanningIncrementButton).not.toBeDisabled();

    fireEvent.click(deepWorkIncrementButton);
    fireEvent.click(monthlyPlanningIncrementButton);
    fireEvent.click(monthlyPlanningDecrementButton);

    expect(onIncrementHabitProgress).toHaveBeenCalledWith(1);
    expect(onIncrementHabitProgress).toHaveBeenCalledWith(2);
    expect(onDecrementHabitProgress).toHaveBeenCalledWith(2);
  });

  it("caps aggregate progress when longer habits exceed their targets", () => {
    render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[]}
        habits={[
          createHabit(1, {
            completed: true,
            completedCount: 3,
            name: "Weekly writing",
            targetCount: 2,
          }),
        ]}
        onDecrementHabitProgress={vi.fn()}
        onIncrementHabitProgress={vi.fn()}
      />
    );

    const progressBar = screen.getByRole("progressbar");

    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("caps aggregate progress when focus quota exceeds the target", () => {
    render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[
          createFocusQuotaGoal(1, {
            completed: true,
            completedMinutes: 180,
            targetMinutes: 120,
          }),
        ]}
        habits={[]}
        onDecrementHabitProgress={vi.fn()}
        onIncrementHabitProgress={vi.fn()}
      />
    );

    const progressBar = screen.getByRole("progressbar");

    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("uses wrapping row layouts so longer-goal content can shrink with the window", () => {
    const { container } = render(
      <LongerHabitChecklist
        dateKey="2026-03-13"
        focusQuotaGoals={[createFocusQuotaGoal(1)]}
        habits={[
          createHabit(1, {
            completedCount: 1,
            name: "Very long weekly habit name for responsive layout",
            targetCount: 3,
          }),
        ]}
        onDecrementHabitProgress={vi.fn()}
        onIncrementHabitProgress={vi.fn()}
      />
    );

    expect(container.querySelectorAll(".flex-wrap").length).toBeGreaterThan(0);
    expect(container.textContent).toContain("Focus quota");
    expect(container.querySelector(".basis-56")).toBeNull();
    expect(container.querySelectorAll(".basis-0").length).toBeGreaterThan(0);
  });
});
