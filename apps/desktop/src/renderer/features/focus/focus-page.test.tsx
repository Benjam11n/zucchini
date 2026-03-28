// @vitest-environment jsdom

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  createIdleFocusTimerState,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import { FocusPage } from "./focus-page";

const settings = {
  ...createDefaultAppSettings("Asia/Singapore"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  themeMode: "system" as const,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

function FocusPageHarness() {
  const timerState = useFocusStore((state) => state.timerState);

  return (
    <FocusPage
      fieldErrors={{}}
      focusSaveErrorMessage={null}
      phase="ready"
      sessions={[]}
      sessionsLoadError={null}
      settings={settings}
      settingsSavePhase="idle"
      timerState={timerState}
      todayDate="2026-03-08"
      onChangeSettings={vi.fn()}
      onShowWidget={vi.fn()}
      onRetryLoad={vi.fn()}
    />
  );
}

function installHabitsMock() {
  Object.defineProperty(window, "habits", {
    configurable: true,
    value: {
      getDesktopNotificationStatus: vi.fn(),
      onFocusTimerActionRequested: vi.fn(() => vi.fn()),
      recordFocusSession: vi.fn(() => Promise.resolve()),
    },
  });
}

describe("focus tab", () => {
  it("renders the timer and empty history state", () => {
    installHabitsMock();
    resetFocusStore();
    render(<FocusPageHarness />);

    expect(screen.getByText("Focused work timer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("Recent focus sessions")).toBeInTheDocument();
  });

  it("supports start, pause, resume, and reset controls", async () => {
    installHabitsMock();
    resetFocusStore();
    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(useFocusStore.getState().timerState.status).toBe("running");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(useFocusStore.getState().timerState.status).toBe("paused");

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(useFocusStore.getState().timerState.status).toBe("running");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => {
      expect(useFocusStore.getState().timerState).toMatchObject({
        completedFocusCycles: 0,
        phase: createIdleFocusTimerState().phase,
        remainingMs: createIdleFocusTimerState().remainingMs,
        status: createIdleFocusTimerState().status,
      });
    });
  });

  it("lets you set a custom focus duration before starting", () => {
    installHabitsMock();
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
    installHabitsMock();
    resetFocusStore();
    useFocusStore.getState().setTimerState(
      createRunningBreakTimerState({
        breakDurationMs: 5 * 60 * 1000,
        breakVariant: "short",
        completedFocusCycles: 1,
        focusDurationMs: 25 * 60 * 1000,
        now: new Date("2026-03-08T09:00:00.000Z"),
        timerSessionId: "timer-session-page-short",
      })
    );

    render(<FocusPageHarness />);

    expect(screen.getAllByText("Short break").length).toBeGreaterThan(0);
    expect(screen.getByText("4 sessions")).toBeInTheDocument();

    act(() => {
      useFocusStore.getState().setTimerState({
        ...useFocusStore.getState().timerState,
        remainingMs: 60_000,
      });
    });

    expect(screen.getByText("1 min left")).toBeInTheDocument();
  });

  it("shows the next long break threshold on the status row", () => {
    installHabitsMock();
    resetFocusStore();
    useFocusStore
      .getState()
      .setTimerState(createIdleFocusTimerState(new Date(), 25 * 60 * 1000, 3));

    render(<FocusPageHarness />);

    expect(screen.getByText("Next break: long")).toBeInTheDocument();
  });

  it("keeps the same timer session id when skipping a short break", () => {
    installHabitsMock();
    resetFocusStore();
    useFocusStore.getState().setTimerState(
      createRunningBreakTimerState({
        breakDurationMs: 5 * 60 * 1000,
        breakVariant: "short",
        completedFocusCycles: 1,
        focusDurationMs: 25 * 60 * 1000,
        now: new Date("2026-03-08T09:25:00.000Z"),
        timerSessionId: "timer-session-page-skip",
      })
    );

    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Skip short break" }));

    expect(useFocusStore.getState().timerState).toMatchObject({
      phase: "focus",
      status: "running",
      timerSessionId: "timer-session-page-skip",
    });
  });

  it("renders the roadmap totals for one full set", () => {
    installHabitsMock();
    resetFocusStore();
    render(<FocusPageHarness />);

    expect(screen.getByText("Total set: 2h 10m")).toBeInTheDocument();
    expect(screen.getByText("0m")).toBeInTheDocument();
    expect(screen.getByText("2h 10m")).toBeInTheDocument();
  });

  it("opens the advanced pomodoro settings in a dialog", () => {
    installHabitsMock();
    resetFocusStore();
    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByText("Pomodoro settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Default focus minutes")).toBeInTheDocument();
  });

  it("uses amber timer text during the last minute", () => {
    installHabitsMock();
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
