// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  createIdleFocusTimerState,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
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

  it("shows the break badge and final-minute cue", () => {
    resetFocusStore();
    useFocusStore
      .getState()
      .setTimerState(
        createRunningBreakTimerState(
          25 * 60 * 1000,
          new Date("2026-03-08T09:00:00.000Z")
        )
      );

    render(<FocusPageHarness />);

    expect(screen.getByText("Break")).toBeInTheDocument();

    act(() => {
      useFocusStore.getState().setTimerState({
        ...useFocusStore.getState().timerState,
        remainingMs: 60_000,
      });
    });

    expect(screen.getByText("1 min left")).toBeInTheDocument();
  });

  it("uses amber timer text during the last minute", () => {
    resetFocusStore();
    useFocusStore
      .getState()
      .setTimerState(
        createRunningFocusTimerState(new Date("2026-03-08T09:00:00.000Z"))
      );

    render(<FocusPageHarness />);

    act(() => {
      useFocusStore.getState().setTimerState({
        ...useFocusStore.getState().timerState,
        remainingMs: 60_000,
      });
    });

    expect(screen.getByText("01")).toHaveClass("text-amber-300");
    expect(screen.getByText("00")).toHaveClass("text-amber-300");
  });
});
