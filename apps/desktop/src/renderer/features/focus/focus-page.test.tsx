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
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import {
  createTestAppSettings,
  minutesMs,
} from "@/test/fixtures/focus-test-utils";

import { FocusPage } from "./focus-page";

const settings = {
  ...createTestAppSettings(),
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

function resetFocusStoreForTest() {
  useFocusStore.setState({
    focusSaveErrorMessage: null,
    focusSessions: [],
    focusSessionsLoadError: null,
    focusSessionsPhase: "idle",
    hasLoadedFocusSessions: false,
    timerState: createIdleFocusTimerState(),
  });
}

describe("focus tab", () => {
  it("renders the timer and empty history state", () => {
    installHabitsMock();
    resetFocusStoreForTest();
    render(<FocusPageHarness />);

    expect(screen.getByText("Focused work timer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("Recent focus sessions")).toBeInTheDocument();
    expect(screen.queryByText("Focus quota")).not.toBeInTheDocument();
  });

  it("supports start, pause, resume, and reset controls", async () => {
    installHabitsMock();
    resetFocusStoreForTest();
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
    resetFocusStoreForTest();
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
    resetFocusStoreForTest();
    useFocusStore.getState().setTimerState(
      createRunningBreakTimerState({
        breakDurationMs: minutesMs(5),
        breakVariant: "short",
        completedFocusCycles: 1,
        focusDurationMs: minutesMs(25),
        now: new Date("2026-03-08T09:00:00.000Z"),
        timerSessionId: "timer-session-page-short",
      })
    );

    render(<FocusPageHarness />);

    expect(screen.getAllByText("Short break").length).toBeGreaterThan(0);
    expect(
      screen.getByText(`${settings.focusCyclesBeforeLongBreak} sessions`)
    ).toBeInTheDocument();

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
    resetFocusStoreForTest();
    useFocusStore
      .getState()
      .setTimerState(createIdleFocusTimerState(new Date(), minutesMs(25), 3));

    render(<FocusPageHarness />);

    expect(screen.getByText("Next break: long")).toBeInTheDocument();
  });

  it("keeps the same timer session id when skipping a short break", () => {
    installHabitsMock();
    resetFocusStoreForTest();
    useFocusStore.getState().setTimerState(
      createRunningBreakTimerState({
        breakDurationMs: minutesMs(5),
        breakVariant: "short",
        completedFocusCycles: 1,
        focusDurationMs: minutesMs(25),
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

  it("returns to the base idle state when skipping a long break", () => {
    installHabitsMock();
    resetFocusStoreForTest();
    useFocusStore.getState().setTimerState(
      createRunningBreakTimerState({
        breakDurationMs: minutesMs(15),
        breakVariant: "long",
        completedFocusCycles: 4,
        focusDurationMs: minutesMs(25),
        now: new Date("2026-03-08T10:00:00.000Z"),
        timerSessionId: "timer-session-page-long-skip",
      })
    );

    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Skip long break" }));

    expect(useFocusStore.getState().timerState).toMatchObject({
      completedFocusCycles: 0,
      phase: "focus",
      status: "idle",
      timerSessionId: null,
    });
  });

  it("renders the roadmap totals for one full set", () => {
    installHabitsMock();
    resetFocusStoreForTest();
    render(<FocusPageHarness />);

    expect(screen.getByText("Total set: 130m")).toBeInTheDocument();
    expect(screen.getByText("0m")).toBeInTheDocument();
    expect(screen.getByText("130m")).toBeInTheDocument();
  });

  it("opens the advanced pomodoro settings in a dialog", () => {
    installHabitsMock();
    resetFocusStoreForTest();
    render(<FocusPageHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByText("Pomodoro settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Default focus minutes")).toBeInTheDocument();
  });

  it("uses amber timer text during the last minute", () => {
    installHabitsMock();
    resetFocusStoreForTest();
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
