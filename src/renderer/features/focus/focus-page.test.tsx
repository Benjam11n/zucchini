// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import { createIdleFocusTimerState } from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";

import { FocusPage } from "./focus-page";

function FocusPageHarness() {
  const timerState = useFocusStore((state) => state.timerState);

  return (
    <FocusPage
      focusSaveErrorMessage={null}
      phase="ready"
      sessions={[]}
      sessionsLoadError={null}
      timerState={timerState}
      todayDate="2026-03-08"
      onShowWidget={vi.fn()}
      onRetryLoad={vi.fn()}
    />
  );
}

describe("focus tab", () => {
  it("renders the timer and empty history state", () => {
    resetFocusStore();
    render(<FocusPageHarness />);

    expect(screen.getByText("Focused work timer")).toBeInTheDocument();
    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
  });

  it("supports start, pause, resume, and reset controls", () => {
    resetFocusStore();
    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(useFocusStore.getState().timerState.status).toBe("running");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(useFocusStore.getState().timerState.status).toBe("paused");

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(useFocusStore.getState().timerState.status).toBe("running");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(useFocusStore.getState().timerState).toMatchObject({
      phase: createIdleFocusTimerState().phase,
      remainingMs: createIdleFocusTimerState().remainingMs,
      status: createIdleFocusTimerState().status,
    });
  });

  it("lets you set a custom focus duration before starting", () => {
    resetFocusStore();
    render(<FocusPageHarness />);

    fireEvent.change(screen.getByLabelText("Focus minutes"), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByLabelText("Focus seconds"), {
      target: { value: "30" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(useFocusStore.getState().timerState).toMatchObject({
      focusDurationMs: 45 * 60 * 1000 + 30 * 1000,
      remainingMs: 45 * 60 * 1000 + 30 * 1000,
      status: "running",
    });
  });
});
