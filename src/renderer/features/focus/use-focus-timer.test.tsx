// @vitest-environment jsdom

import { cleanup, renderHook } from "@testing-library/react";
import { act } from "react";

import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/store";

import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
  useFocusTimer,
} from "./use-focus-timer";

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

function setupFocusTimerTest() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-08T09:00:00.000Z"));
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: createLocalStorageMock(),
  });
  localStorage.clear();
  resetFocusStore();
  Object.defineProperty(window, "habits", {
    configurable: true,
    value: {
      claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
      claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
      releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
      showNotification: vi.fn().mockResolvedValue(42),
    },
  });
}

function teardownFocusTimerTest() {
  cleanup();
  vi.useRealTimers();
}

describe("use focus timer", () => {
  it("pauses and resumes using end-time math", () => {
    setupFocusTimerTest();

    const running = createRunningFocusTimerState(
      new Date("2026-03-08T09:00:00.000Z")
    );
    const paused = pauseFocusTimerState(
      running,
      new Date("2026-03-08T09:10:00.000Z")
    );

    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(15 * 60 * 1000);

    const resumed = resumeFocusTimerState(
      paused,
      new Date("2026-03-08T09:12:00.000Z")
    );

    expect(resumed.status).toBe("running");
    expect(resumed.endsAt).toBe("2026-03-08T09:27:00.000Z");
    teardownFocusTimerTest();
  });

  it("restores an in-progress timer from localStorage", async () => {
    setupFocusTimerTest();
    localStorage.setItem(
      "zucchini_focus_timer",
      JSON.stringify({
        cycleId: "cycle-restore",
        endsAt: "2026-03-08T09:25:00.000Z",
        lastUpdatedAt: "2026-03-08T09:00:00.000Z",
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: "2026-03-08T09:00:00.000Z",
        status: "running",
      })
    );

    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn();
    const setFocusSaveErrorMessage = vi.fn();

    renderHook(() =>
      useFocusTimer({
        clearFocusSaveError,
        recordFocusSession,
        setFocusSaveErrorMessage,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState.status).toBe("running");
    expect(useFocusStore.getState().timerState.remainingMs).toBe(1_500_000);
    teardownFocusTimerTest();
  });

  it("records one completed focus session and transitions into a break", async () => {
    setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const setFocusSaveErrorMessage = vi.fn();

    useFocusStore.getState().setTimerState({
      cycleId: "cycle-1",
      endsAt: "2026-03-08T09:00:01.000Z",
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
    });

    renderHook(() =>
      useFocusTimer({
        clearFocusSaveError,
        recordFocusSession,
        setFocusSaveErrorMessage,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    // oxlint-disable-next-line vitest/prefer-called-once
    expect(recordFocusSession).toHaveBeenCalledTimes(1);
    expect(useFocusStore.getState().timerState.phase).toBe("break");
    expect(useFocusStore.getState().timerState.status).toBe("running");
    teardownFocusTimerTest();
  });

  it("completes a break without recording a focus session", async () => {
    setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const setFocusSaveErrorMessage = vi.fn();

    useFocusStore.getState().setTimerState({
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
    });

    renderHook(() =>
      useFocusTimer({
        clearFocusSaveError,
        recordFocusSession,
        setFocusSaveErrorMessage,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession).not.toHaveBeenCalled();
    expect(useFocusStore.getState().timerState).toStrictEqual(
      createIdleFocusTimerState(new Date("2026-03-08T09:00:01.000Z"))
    );
    teardownFocusTimerTest();
  });
});
