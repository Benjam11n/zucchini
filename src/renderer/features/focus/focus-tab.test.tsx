// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/app/stores/focus-store";

import { FocusTab } from "./focus-tab";
import { createIdleFocusTimerState } from "./use-focus-timer";

function FocusTabHarness() {
  const timerState = useFocusStore((state) => state.timerState);

  return (
    <FocusTab
      focusSaveErrorMessage={null}
      phase="ready"
      sessions={[]}
      sessionsLoadError={null}
      timerState={timerState}
      todayDate="2026-03-08"
      onRetryLoad={vi.fn()}
    />
  );
}

describe("focus tab", () => {
  it("renders the timer and empty history state", () => {
    resetFocusStore();
    render(<FocusTabHarness />);

    expect(screen.getByText("Focused work timer")).toBeInTheDocument();
    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
  });

  it("supports start, pause, resume, and reset controls", () => {
    resetFocusStore();
    render(<FocusTabHarness />);

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
});
