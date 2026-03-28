// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";

import {
  createRunningBreakTimerState,
  createRunningFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";

import { FocusWidget } from "./focus-widget";

function createLocalStorageMock() {
  const storage = new Map<string, string>();

  return {
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

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

  function setupWidgetTest({ renderWidget = true } = {}) {
    resetFocusStore();
    class ResizeObserverMock {
      observe() {}
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
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createLocalStorageMock(),
    });
    localStorage.clear();
    const getTodayState = vi.fn().mockResolvedValue({
      date: "2026-03-10",
      habits: [],
      settings: {
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 15 * 60,
        focusShortBreakSeconds: 5 * 60,
        launchAtLogin: false,
        minimizeToTray: false,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
      },
      streak: {
        availableFreezes: 1,
        bestStreak: 3,
        currentStreak: 2,
        lastEvaluatedDate: "2026-03-09",
      },
    });
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
        getDesktopNotificationStatus: vi.fn(),
        getTodayState,
        onFocusSessionRecorded: vi.fn(() => vi.fn()),
        recordFocusSession: vi.fn((_input) => Promise.resolve()),
        releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
        resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
        showFocusWidget: vi.fn(() => Promise.resolve()),
        showNotification: vi.fn((_title, _body) => Promise.resolve()),
      },
    });

    if (renderWidget) {
      render(<FocusWidget />);
    }

    return { closeSpy, getTodayState };
  }

  it("renders a compact timer with icon controls and the activity ring", async () => {
    const { getTodayState } = setupWidgetTest();

    expect(screen.getByText("25:00")).toBeInTheDocument();

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });
  });

  it("supports start, pause, reset, and close controls", async () => {
    const { closeSpy, getTodayState } = setupWidgetTest();

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    });
    expect(useFocusStore.getState().timerState.status).toBe("running");

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
    expect(window.habits.recordFocusSession).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close widget" }));
    });
    expect(closeSpy.mock.calls).toHaveLength(1);
  });

  it("supports skipping an active short break", async () => {
    const { getTodayState } = setupWidgetTest({ renderWidget: false });
    const now = new Date();
    localStorage.setItem(
      "zucchini_focus_timer",
      JSON.stringify(
        createRunningBreakTimerState({
          breakDurationMs: 5 * 60 * 1000,
          breakVariant: "short",
          completedFocusCycles: 1,
          focusDurationMs: 25 * 60 * 1000,
          now,
          timerSessionId: "timer-session-widget-skip",
        })
      )
    );

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

  it("supports keyboard shortcuts for start, pause, resume, and reset", async () => {
    const { getTodayState } = setupWidgetTest();

    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });

    dispatchShortcut("Space", " ");
    expect(useFocusStore.getState().timerState.status).toBe("running");

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
    setupWidgetTest({ renderWidget: false });
    const now = new Date();

    localStorage.setItem(
      "zucchini_focus_timer",
      JSON.stringify({
        cycleId: "cycle-restore",
        endsAt: new Date(now.getTime() + 1_500_000).toISOString(),
        focusDurationMs: 1_500_000,
        lastUpdatedAt: now.toISOString(),
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: now.toISOString(),
        status: "running",
      })
    );

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
          breakDurationMs: 5 * 60 * 1000,
          breakVariant: "short",
          completedFocusCycles: 1,
          focusDurationMs: 25 * 60 * 1000,
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
          breakDurationMs: 15 * 60 * 1000,
          breakVariant: "long",
          completedFocusCycles: 4,
          focusDurationMs: 25 * 60 * 1000,
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
    setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore.getState().setTimerState({
        ...createRunningFocusTimerState(new Date("2026-03-08T09:00:00.000Z")),
        remainingMs: 15 * 60 * 1000,
        status: "paused",
      });
    });

    render(<FocusWidget />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Reset timer" }));
    });

    await waitFor(() => {
      expect(window.habits.recordFocusSession).toHaveBeenCalledWith(
        expect.objectContaining({
          durationSeconds: 10 * 60,
          entryKind: "partial",
        })
      );
      expect(useFocusStore.getState().timerState.status).toBe("idle");
    });
  });

  it("does not record a partial entry when resetting during a break", async () => {
    setupWidgetTest({ renderWidget: false });
    act(() => {
      useFocusStore.getState().setTimerState(
        createRunningBreakTimerState({
          breakDurationMs: 5 * 60 * 1000,
          breakVariant: "short",
          completedFocusCycles: 1,
          focusDurationMs: 25 * 60 * 1000,
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
    expect(window.habits.recordFocusSession).not.toHaveBeenCalled();
  });
});
