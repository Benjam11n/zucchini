// @vitest-environment jsdom

import { cleanup, renderHook } from "@testing-library/react";
import { act } from "react";

import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { writePomodoroTimerSettings } from "@/renderer/features/focus/lib/pomodoro-settings-storage";
import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/state/focus-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

import { useFocusTimer } from "./use-focus-timer";

type FocusSessionRecordedListener = (session: {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  id: number;
  startedAt: string;
}) => void;

const DEFAULT_TIMER_SETTINGS = {
  focusCyclesBeforeLongBreak: 4,
  focusLongBreakMinutes: 15,
  focusShortBreakMinutes: 5,
};

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

function renderFocusTimerHook({
  clearFocusSaveError = vi.fn(),
  pomodoroSettings = DEFAULT_TIMER_SETTINGS,
  recordFocusSession = vi
    .fn<(input: CreateFocusSessionInput) => Promise<unknown>>()
    .mockResolvedValue(42),
  setFocusSaveErrorMessage = vi.fn(),
}: {
  clearFocusSaveError?: () => void;
  pomodoroSettings?: PomodoroTimerSettings | null;
  recordFocusSession?: (input: CreateFocusSessionInput) => Promise<unknown>;
  setFocusSaveErrorMessage?: (message: string | null) => void;
} = {}) {
  renderHook(() =>
    useFocusTimer({
      clearFocusSaveError,
      pomodoroSettings,
      recordFocusSession,
      setFocusSaveErrorMessage,
    })
  );

  return {
    clearFocusSaveError,
    recordFocusSession,
    setFocusSaveErrorMessage,
  };
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
        breakVariant: null,
        completedFocusCycles: 2,
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

    renderFocusTimerHook();

    await act(async () => {
      await Promise.resolve();
    });

    const persistedTimerState = localStorage.getItem("zucchini_focus_timer");

    expect(useFocusStore.getState().timerState.status).toBe("running");
    expect(useFocusStore.getState().timerState.remainingMs).toBe(1_500_000);
    expect(persistedTimerState).not.toBeNull();
    expect(JSON.parse(persistedTimerState as string)).toMatchObject({
      completedFocusCycles: 2,
      cycleId: "cycle-restore",
      remainingMs: 1_500_000,
      status: "running",
    });
    teardownFocusTimerTest();
  });

  it("records one completed focus session and transitions into a short break", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: "cycle-1",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    // oxlint-disable-next-line vitest/prefer-called-once
    expect(recordFocusSession).toHaveBeenCalledTimes(1);
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "short",
      completedFocusCycles: 1,
      phase: "break",
      remainingMs: 5 * 60 * 1000,
      status: "running",
    });
    teardownFocusTimerTest();
  });

  it("starts a long break when the cycle threshold is reached", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 3,
      cycleId: "cycle-4",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    // oxlint-disable-next-line vitest/prefer-called-once
    expect(recordFocusSession).toHaveBeenCalledTimes(1);
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: 4,
      phase: "break",
      remainingMs: 15 * 60 * 1000,
      status: "running",
    });
    teardownFocusTimerTest();
  });

  it("completes a short break without recording a focus session", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);

    useFocusStore.getState().setTimerState({
      breakVariant: "short",
      completedFocusCycles: 2,
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession).not.toHaveBeenCalled();
    expect(useFocusStore.getState().timerState).toStrictEqual(
      createIdleFocusTimerState(
        new Date("2026-03-08T09:00:01.000Z"),
        25 * 60 * 1000,
        2
      )
    );
    teardownFocusTimerTest();
  });

  it("resets the cycle count after a long break completes", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);

    useFocusStore.getState().setTimerState({
      breakVariant: "long",
      completedFocusCycles: 4,
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession).not.toHaveBeenCalled();
    expect(useFocusStore.getState().timerState).toStrictEqual(
      createIdleFocusTimerState(
        new Date("2026-03-08T09:00:01.000Z"),
        25 * 60 * 1000
      )
    );
    teardownFocusTimerTest();
  });

  it("uses the latest saved settings only for the next created break", async () => {
    setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const setFocusSaveErrorMessage = vi.fn();

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: "cycle-settings",
      endsAt: "2026-03-08T09:00:02.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 2000,
      startedAt: "2026-03-08T08:35:02.000Z",
      status: "running",
    });

    const { rerender } = renderHook(
      ({ pomodoroSettings }) =>
        useFocusTimer({
          clearFocusSaveError,
          pomodoroSettings,
          recordFocusSession,
          setFocusSaveErrorMessage,
        }),
      {
        initialProps: {
          pomodoroSettings: DEFAULT_TIMER_SETTINGS,
        },
      }
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState.remainingMs).toBe(1000);

    rerender({
      pomodoroSettings: {
        focusCyclesBeforeLongBreak: 2,
        focusLongBreakMinutes: 20,
        focusShortBreakMinutes: 7,
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "short",
      remainingMs: 7 * 60 * 1000,
      status: "running",
    });
    teardownFocusTimerTest();
  });

  it("falls back to stored pomodoro settings before runtime settings load", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    writePomodoroTimerSettings({
      focusCyclesBeforeLongBreak: 2,
      focusLongBreakMinutes: 20,
      focusShortBreakMinutes: 7,
    });

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 1,
      cycleId: "cycle-stored",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: 25 * 60 * 1000,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
    });

    renderFocusTimerHook({
      pomodoroSettings: null,
      recordFocusSession,
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    // oxlint-disable-next-line vitest/prefer-called-once
    expect(recordFocusSession).toHaveBeenCalledTimes(1);
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: 2,
      remainingMs: 20 * 60 * 1000,
      status: "running",
    });
    expect(window.habits.showNotification).toHaveBeenCalledWith(
      "Focus complete",
      "Time for a long break."
    );
    teardownFocusTimerTest();
  });

  it("reopens the widget when a focus timer starts", async () => {
    setupFocusTimerTest();
    renderFocusTimerHook();

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
    renderFocusTimerHook();

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
