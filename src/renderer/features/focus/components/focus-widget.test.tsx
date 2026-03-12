// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";

import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";

import { FocusWidget } from "./focus-widget";

describe("focus widget", () => {
  function setupWidgetTest() {
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
    const getTodayState = vi.fn().mockResolvedValue({
      date: "2026-03-10",
      habits: [],
      settings: {
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
        getTodayState,
        recordFocusSession: vi.fn((_input) => Promise.resolve()),
        releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
        resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
        showFocusWidget: vi.fn(() => Promise.resolve()),
        showNotification: vi.fn((_title, _body) => Promise.resolve()),
      },
    });

    render(<FocusWidget />);
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
    expect(useFocusStore.getState().timerState.status).toBe("idle");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close widget" }));
    });
    // eslint-disable-next-line vitest/prefer-called-once
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
