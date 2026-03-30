// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { Checkbox as CheckboxComponent } from "@/renderer/shared/components/ui/checkbox";
import type { HabitWithStatus } from "@/shared/domain/habit";

const checkboxRenderCounts = new Map<string, number>();

function getRenderCount(id: string): number {
  return checkboxRenderCounts.get(id) ?? 0;
}

function renderCountingCheckbox(
  props: ComponentProps<typeof CheckboxComponent>
) {
  const checkboxId = props.id ?? "unknown";
  const pressedState =
    props.checked === "indeterminate" ? "mixed" : props.checked;

  checkboxRenderCounts.set(checkboxId, getRenderCount(checkboxId) + 1);

  return (
    <button
      aria-pressed={pressedState}
      data-testid={checkboxId}
      onClick={() => props.onCheckedChange?.(true)}
      type="button"
    />
  );
}

async function loadHabitListItemModule() {
  vi.resetModules();

  const checkboxModule =
    await import("@/renderer/shared/components/ui/checkbox");
  vi.spyOn(checkboxModule, "Checkbox").mockImplementation(
    renderCountingCheckbox
  );

  return import("./habit-list");
}

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

function resetState(): void {
  checkboxRenderCounts.clear();
  cleanup();
  vi.restoreAllMocks();
}

describe("habit list item", () => {
  it("skips rerendering unaffected rows when a sibling completion changes", async () => {
    resetState();

    const { HabitListItem } = await loadHabitListItemModule();
    const onToggle = vi.fn();
    const firstHabit = createHabit(1);
    const secondHabit = createHabit(2);

    const { rerender } = render(
      <>
        <HabitListItem habit={firstHabit} onToggle={onToggle} />
        <HabitListItem habit={secondHabit} onToggle={onToggle} />
      </>
    );

    const initialRenderCounts = {
      first: getRenderCount("habit-1"),
      second: getRenderCount("habit-2"),
    };

    rerender(
      <>
        <HabitListItem
          habit={{ ...firstHabit, completed: true }}
          onToggle={onToggle}
        />
        <HabitListItem habit={{ ...secondHabit }} onToggle={onToggle} />
      </>
    );

    expect(getRenderCount("habit-1")).toBeGreaterThan(
      initialRenderCounts.first
    );
    expect(getRenderCount("habit-2")).toBe(initialRenderCounts.second);
  });

  it("rerenders only the row whose name changes when sibling props are recreated", async () => {
    resetState();

    const { HabitListItem } = await loadHabitListItemModule();
    const onToggle = vi.fn();
    const firstHabit = createHabit(1);
    const secondHabit = createHabit(2);

    const { rerender } = render(
      <>
        <HabitListItem habit={firstHabit} onToggle={onToggle} />
        <HabitListItem habit={secondHabit} onToggle={onToggle} />
      </>
    );

    const initialRenderCounts = {
      first: getRenderCount("habit-1"),
      second: getRenderCount("habit-2"),
    };

    rerender(
      <>
        <HabitListItem habit={{ ...firstHabit }} onToggle={onToggle} />
        <HabitListItem
          habit={{ ...secondHabit, name: "Renamed Habit" }}
          onToggle={onToggle}
        />
      </>
    );

    expect(getRenderCount("habit-1")).toBe(initialRenderCounts.first);
    expect(getRenderCount("habit-2")).toBeGreaterThan(
      initialRenderCounts.second
    );
  });
});
