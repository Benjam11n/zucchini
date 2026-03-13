// @vitest-environment jsdom

import { cleanup, renderHook } from "@testing-library/react";
import { act } from "react";

import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";

import { useFocusTimer } from "./use-focus-timer";

type FocusSessionRecordedListener = (session: {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  id: number;
  startedAt: string;
}) => void;

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
  let focusSessionRecordedListener: FocusSessionRecordedListener | null = null;
  Object.defineProperty(window, "habits", {
    configurable: true,
    value: {
      claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
      claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
      onFocusSessionRecorded: vi.fn(
        (listener: FocusSessionRecordedListener) => {
          focusSessionRecordedListener = listener;
          return () => {
            focusSessionRecordedListener = null;
          };
        }
      ),
      releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
      showFocusWidget: vi.fn(() => Promise.resolve()),
      showNotification: vi.fn().mockResolvedValue(42),
    },
  });

  return {
    emitFocusSessionRecorded(
      session: Parameters<FocusSessionRecordedListener>[0]
    ) {
      focusSessionRecordedListener?.(session);
    },
  };
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
        focusDurationMs: 1_500_000,
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

    const persistedTimerState = localStorage.getItem("zucchini_focus_timer");

    expect(useFocusStore.getState().timerState.status).toBe("running");
    expect(useFocusStore.getState().timerState.remainingMs).toBe(1_500_000);
    expect(persistedTimerState).not.toBeNull();
    expect(JSON.parse(persistedTimerState as string)).toMatchObject({
      cycleId: "cycle-restore",
      remainingMs: 1_500_000,
      status: "running",
    });
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
      focusDurationMs: 25 * 60 * 1000,
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
      focusDurationMs: 25 * 60 * 1000,
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

  it("reopens the widget when a focus timer starts", async () => {
    setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const setFocusSaveErrorMessage = vi.fn();

    renderHook(() =>
      useFocusTimer({
        clearFocusSaveError,
        recordFocusSession,
        setFocusSaveErrorMessage,
      })
    );

    await act(async () => {
      useFocusStore.getState().setTimerState(createRunningFocusTimerState());
      await Promise.resolve();
    });

    // eslint-disable-next-line vitest/prefer-called-once
    expect(window.habits.showFocusWidget).toHaveBeenCalledTimes(1);
    teardownFocusTimerTest();
  });

  it("prepends broadcast focus sessions once per unique id", async () => {
    const { emitFocusSessionRecorded } = setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const setFocusSaveErrorMessage = vi.fn();

    renderHook(() =>
      useFocusTimer({
        clearFocusSaveError,
        recordFocusSession,
        setFocusSaveErrorMessage,
      })
    );

    await act(async () => {
      emitFocusSessionRecorded({
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
      });
      emitFocusSessionRecorded({
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
      });
      await Promise.resolve();
    });

    expect(useFocusStore.getState().focusSessions).toStrictEqual([
      {
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
      },
    ]);
    teardownFocusTimerTest();
  });
});
