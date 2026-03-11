// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";

import { resetFocusStore } from "@/renderer/features/focus/store";

import { FocusWidget } from "./focus-widget";

describe("focus widget", () => {
  it("renders a compact timer with a ring snapshot", async () => {
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

    Object.defineProperty(window, "habits", {
      configurable: true,
      value: {
        claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
        claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
        getTodayState,
        recordFocusSession: vi.fn((_input) => Promise.resolve()),
        releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
        resizeFocusWidget: vi.fn((_width, _height) => Promise.resolve()),
        showNotification: vi.fn((_title, _body) => Promise.resolve()),
      },
    });

    render(<FocusWidget />);

    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    await waitFor(() => {
      expect(getTodayState.mock.calls[0]).toStrictEqual([]);
    });
  });
});
