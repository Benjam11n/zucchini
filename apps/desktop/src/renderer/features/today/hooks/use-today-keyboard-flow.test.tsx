// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";

import { useTodayKeyboardFlow } from "./use-today-keyboard-flow";
import type { TodayKeyboardRow } from "./use-today-keyboard-flow";

const rows: TodayKeyboardRow[] = [
  {
    id: "first",
    incomplete: true,
    kind: "daily",
  },
  {
    id: "second",
    incomplete: true,
    kind: "daily",
  },
];

function keepAutoFocusAway() {
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  return input;
}

function KeyboardFlowHarness() {
  const { getRowProps, keyboardHint } = useTodayKeyboardFlow(rows);

  return (
    <div>
      {rows.map((row) => (
        <button key={row.id} type="button" {...getRowProps(row.id)}>
          {row.id}
        </button>
      ))}
      <output aria-label="keyboard hint">
        {keyboardHint?.rowId ?? "none"}
      </output>
    </div>
  );
}

describe("useTodayKeyboardFlow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("delays mouse-driven keyboard hint updates", () => {
    const input = keepAutoFocusAway();
    render(<KeyboardFlowHarness />);
    input.remove();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "second" }));

    expect(screen.getByLabelText("keyboard hint")).toHaveTextContent("none");

    act(() => vi.advanceTimersByTime(179));
    expect(screen.getByLabelText("keyboard hint")).toHaveTextContent("none");

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByLabelText("keyboard hint")).toHaveTextContent("second");
  });

  it("shows keyboard hint immediately on focus", () => {
    const input = keepAutoFocusAway();
    render(<KeyboardFlowHarness />);
    input.remove();

    fireEvent.focus(screen.getByRole("button", { name: "second" }));

    expect(screen.getByLabelText("keyboard hint")).toHaveTextContent("second");
  });
});
