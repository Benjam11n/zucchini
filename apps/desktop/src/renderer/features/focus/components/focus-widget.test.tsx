// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";

import {
  createIdleFocusTimerState,
  formatTimerLabel,
  createRunningBreakTimerState,
  createRunningFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";
import type { HabitCommand } from "@/shared/contracts/habits-ipc-commands";
import type { HabitQuery } from "@/shared/contracts/habits-ipc-queries";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import {
  createTestAppSettings,
  minutes,
  minutesMs,
} from "@/test/fixtures/focus-test-utils";

import { FocusWidget } from "./focus-widget";

describe("focus widget", () => {
  function dispatchShortcut(code: string, key: string) {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          code,
          key,
        })
      );
    });
  }

  function setupWidgetTest({
    persistedTimerState = null,
    renderWidget = true,
  }: {
    persistedTimerState?: PersistedFocusTimerState | null;
    renderWidget?: boolean;
  } = {}) {
    resetFocusStore();
    const settings = createTestAppSettings({
      focusCyclesBeforeLongBreak: 4,
      focusDefaultDurationSeconds: minutes(25),
      focusLongBreakSeconds: minutes(15),
      focusShortBreakSeconds: minutes(5),
      resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
      toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
    });

    class ResizeObserverMock {
      // oxlint-disable-next-line class-methods-use-this
      observe() {}
      // oxlint-disable-next-line class-methods-use-this
      disconnect() {}
    }

    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
    const getTodayState = vi.fn().mockResolvedValue({
      date: "2026-03-10",
      habits: [],
      settings,
      streak: {
        availableFreezes: 1,
        bestStreak: 3,
        currentStreak: 2,
        lastEvaluatedDate: "2026-03-09",
      },
    });
    const getFocusTimerState = vi.fn().mockResolvedValue(persistedTimerState);
    const recordFocusSession = vi.fn((_input) => Promise.resolve());
    const saveFocusTimerState = vi.fn((state) => Promise.resolve(state));
    const closeSpy = vi.fn();
    Object.defineProperty(window, "close", {
      configurable: true,
      value: closeSpy,
    });

    Object.defineProperty(window, "habits", {
      configurable: true,
      value: {
        claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
        claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
        command: vi.fn((command: HabitCommand) => {
          if (command.type === "focusSession.record") {
            return recordFocusSession(command.payload);
          }

          if (command.type === "focusTimer.saveState") {
            return saveFocusTimerState(command.payload);
          }

          return Promise.resolve(null);
        }),
        getDesktopNotificationStatus: vi.fn(),
        getFocusTimerState,
        getTodayState,
        onFocusSessionRecorded: vi.fn(() => vi.fn()),
        onFocusTimerActionRequested: vi.fn(() => vi.fn()),
        onFocusTimerStateChanged: vi.fn(() => vi.fn()),
        query: vi.fn((query: HabitQuery) => {
          if (query.type === "focusTimer.getState") {
            return getFocusTimerState();
          }

          if (query.type === "today.get") {
            return getTodayState();
          }

          return Promise.resolve(null);
        }),
        recordFocusSession,
        releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
        resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
        saveFocusTimerState,
        showFocusWidget: vi.fn(() => Promise.resolve()),
        showNotification: vi.fn((_title, _body) => Promise.resolve()),
      },
    });

    if (renderWidget) {
      render(<FocusWidget />);
    }

    return {
      closeSpy,
      getFocusTimerState,
      getTodayState,
      recordFocusSession,
      saveFocusTimerState,
      settings,
    };
  }

  it("renders a compact timer with icon controls and the activity ring", async () => {
    const { getFocusTimerState, getTodayState } = setupWidgetTest();

    await waitFor(() => {
      expect(getFocusTimerState).toHaveBeenCalled();
    });

    expect(
      screen.getByText(
        formatTimerLabel(createIdleFocusTimerState().remainingMs)
      )
    ).toBeInTheDocument();
    expect(document.body.dataset["view"]).toBe("widget");
    expect(screen.getByRole("main")).toHaveClass("bg-transparent");

    const widgetShell = screen.getByRole("main").firstElementChild;
    expect(widgetShell).toHaveClass("bg-background");

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });
  });

  it("supports start, pause, reset, and close controls", async () => {
    const {
      closeSpy,
      getFocusTimerState,
      getTodayState,
      recordFocusSession,
      saveFocusTimerState,
    } = setupWidgetTest();

    await waitFor(() => {
      expect(getFocusTimerState).toHaveBeenCalled();
      expect(saveFocusTimerState).toHaveBeenCalled();
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    });
    await waitFor(() => {
      expect(useFocusStore.getState().timerState.status).toBe("running");
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
    });
    expect(useFocusStore.getState().timerState.status).toBe("paused");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Reset timer" }));
    });
    await waitFor(() => {
      expect(useFocusStore.getState().timerState.status).toBe("idle");
    });
    expect(recordFocusSession).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close widget" }));
    });
    expect(closeSpy.mock.calls).toHaveLength(1);
  });

  it("supports skipping an active short break", async () => {
    const now = new Date();
    const { getTodayState } = setupWidgetTest({
      persistedTimerState: createRunningBreakTimerState({
        breakDurationMs: minutesMs(5),
        breakVariant: "short",
        completedFocusCycles: 1,
        focusDurationMs: minutesMs(25),
        now,
        timerSessionId: "timer-session-widget-skip",
      }),
      renderWidget: false,
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
      expect(
        screen.getByRole("button", { name: "Skip short break" })
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Skip short break" }));
    });

    expect(useFocusStore.getState().timerState).toMatchObject({
      phase: "focus",
      status: "running",
      timerSessionId: "timer-session-widget-skip",
    });
  });

  it("returns to the base idle state when skipping an active long break", async () => {
    const now = new Date();
    const { getTodayState } = setupWidgetTest({
      persistedTimerState: createRunningBreakTimerState({
        breakDurationMs: minutesMs(15),
        breakVariant: "long",
        completedFocusCycles: 4,
        focusDurationMs: minutesMs(25),
        now,
        timerSessionId: "timer-session-widget-long-skip",
      }),
      renderWidget: false,
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
      expect(
        screen.getByRole("button", { name: "Skip long break" })
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Skip long break" }));
    });

    expect(useFocusStore.getState().timerState).toMatchObject({
      completedFocusCycles: 0,
      phase: "focus",
      status: "idle",
      timerSessionId: null,
    });
  });

  it("supports keyboard shortcuts for start, pause, resume, and reset", async () => {
    const { getFocusTimerState, getTodayState, saveFocusTimerState } =
      setupWidgetTest();

    await waitFor(() => {
      expect(getFocusTimerState).toHaveBeenCalled();
      expect(saveFocusTimerState).toHaveBeenCalled();
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });

    dispatchShortcut("Space", " ");
    await waitFor(() => {
      expect(useFocusStore.getState().timerState.status).toBe("running");
    });

    dispatchShortcut("Space", " ");
    expect(useFocusStore.getState().timerState.status).toBe("paused");

    dispatchShortcut("Space", " ");
    expect(useFocusStore.getState().timerState.status).toBe("running");

    dispatchShortcut("KeyR", "r");

    await waitFor(() => {
      expect(useFocusStore.getState().timerState.status).toBe("idle");
    });
  });

  it("restores a running timer without resetting it on widget mount", async () => {
    const now = new Date();
    setupWidgetTest({
      persistedTimerState: {
        breakVariant: null,
        completedFocusCycles: 0,
        cycleId: "cycle-restore",
        endsAt: new Date(now.getTime() + 1_500_000).toISOString(),
        focusDurationMs: 1_500_000,
        lastCompletedBreak: null,
        lastUpdatedAt: now.toISOString(),
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: now.toISOString(),
        status: "running",
        timerSessionId: null,
      },
      renderWidget: false,
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(useFocusStore.getState().timerState.cycleId).toBe("cycle-restore");
      expect(useFocusStore.getState().timerState.status).toBe("running");
      expect(useFocusStore.getState().timerState.remainingMs).toBeGreaterThan(
        0
      );
    });
  });

  it("shows break status and the final-minute cue", async () => {
    setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore.getState().setTimerState(
        createRunningBreakTimerState({
          breakDurationMs: minutesMs(5),
          breakVariant: "short",
          completedFocusCycles: 1,
          focusDurationMs: minutesMs(25),
          now: new Date(),
          timerSessionId: "timer-session-widget-short",
        })
      );
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    act(() => {
      useFocusStore.getState().setTimerState({
        ...useFocusStore.getState().timerState,
        remainingMs: 60_000,
      });
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("01:00")).toHaveClass("text-amber-300");
  });

  it("renders a long-break pill when the widget is in a long break", async () => {
    const { getTodayState } = setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore.getState().setTimerState(
        createRunningBreakTimerState({
          breakDurationMs: minutesMs(15),
          breakVariant: "long",
          completedFocusCycles: 4,
          focusDurationMs: minutesMs(25),
          now: new Date(),
          timerSessionId: "timer-session-widget-long",
        })
      );
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
      expect(screen.getByText("Long break")).toBeInTheDocument();
    });
  });

  it("does not show a status icon during normal focus", async () => {
    setupWidgetTest();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  it("uses amber timer text during the final minute of focus", async () => {
    const { getTodayState } = setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore
        .getState()
        .setTimerState(createRunningFocusTimerState(new Date()));
    });

    render(<FocusWidget />);

    act(() => {
      useFocusStore.getState().setTimerState({
        ...useFocusStore.getState().timerState,
        remainingMs: 60_000,
      });
    });

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("01:00")).toHaveClass("text-amber-300");
    });
  });

  it("records a partial focus entry when resetting after elapsed focus time", async () => {
    const { getFocusTimerState, recordFocusSession } = setupWidgetTest({
      renderWidget: false,
    });
    act(() => {
      useFocusStore.getState().setTimerState({
        ...createRunningFocusTimerState(
          new Date("2026-03-08T09:00:00.000Z"),
          minutesMs(25)
        ),
        remainingMs: minutesMs(15),
        status: "paused",
      });
    });

    render(<FocusWidget />);

    await waitFor(() => {
      expect(getFocusTimerState).toHaveBeenCalled();
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Reset timer" }));
    });

    await waitFor(() => {
      expect(recordFocusSession).toHaveBeenCalledWith(
        expect.objectContaining({
          durationSeconds: minutes(10),
          entryKind: "partial",
        })
      );
      expect(useFocusStore.getState().timerState.status).toBe("idle");
    });
  });

  it("does not record a partial entry when resetting during a break", async () => {
    const { recordFocusSession } = setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore.getState().setTimerState(
        createRunningBreakTimerState({
          breakDurationMs: minutesMs(5),
          breakVariant: "short",
          completedFocusCycles: 1,
          focusDurationMs: minutesMs(25),
          now: new Date("2026-03-08T09:25:00.000Z"),
          timerSessionId: "timer-session-widget-break-reset",
        })
      );
    });

    render(<FocusWidget />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Reset timer" }));
    });

    await waitFor(() => {
      expect(useFocusStore.getState().timerState.status).toBe("idle");
    });
    expect(recordFocusSession).not.toHaveBeenCalled();
  });
});
