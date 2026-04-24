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
import type { HabitCommand, HabitQuery } from "@/shared/contracts/habits-ipc";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { createDefaultPomodoroTimerSettings } from "@/shared/domain/settings";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";
import {
  createTestPomodoroSettings,
  minutes,
  minutesMs,
} from "@/test/fixtures/focus-test-utils";

import { useFocusTimer } from "./use-focus-timer";

type FocusSessionRecordedListener = (session: {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  entryKind: "completed" | "partial";
  id: number;
  startedAt: string;
  timerSessionId: string;
}) => void;
type FocusTimerActionListener = (request: {
  action: "reset" | "toggle";
  source: "global-shortcut" | "main-window" | "widget";
}) => void;
type FocusTimerStateChangedListener = (state: PersistedFocusTimerState) => void;

const DEFAULT_TIMER_SETTINGS = createTestPomodoroSettings({
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: minutes(25),
  focusLongBreakSeconds: minutes(15),
  focusShortBreakSeconds: minutes(5),
});

function setupFocusTimerTest(
  persistedTimerState: PersistedFocusTimerState | null = null
) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-08T09:00:00.000Z"));
  resetFocusStore();
  let focusSessionRecordedListener: FocusSessionRecordedListener | null = null;
  let focusTimerActionListener: FocusTimerActionListener | null = null;
  let focusTimerStateChangedListener: FocusTimerStateChangedListener | null =
    null;
  const getFocusTimerState = vi.fn().mockResolvedValue(persistedTimerState);
  const saveFocusTimerState = vi.fn((state: PersistedFocusTimerState) =>
    Promise.resolve(state)
  );
  const showFocusWidget = vi.fn(() => Promise.resolve());
  Object.defineProperty(window, "habits", {
    configurable: true,
    value: {
      claimFocusTimerCycleCompletion: vi.fn().mockResolvedValue(true),
      claimFocusTimerLeadership: vi.fn().mockResolvedValue(true),
      command: vi.fn((command: HabitCommand) => {
        if (command.type === "focusTimer.saveState") {
          return saveFocusTimerState(command.payload);
        }

        return Promise.resolve(null);
      }),
      getDesktopNotificationStatus: vi.fn(),
      getFocusTimerState,
      onFocusSessionRecorded: vi.fn(
        (listener: FocusSessionRecordedListener) => {
          focusSessionRecordedListener = listener;
          return () => {
            focusSessionRecordedListener = null;
          };
        }
      ),
      onFocusTimerActionRequested: vi.fn(
        (listener: FocusTimerActionListener) => {
          focusTimerActionListener = listener;
          return () => {
            focusTimerActionListener = null;
          };
        }
      ),
      onFocusTimerStateChanged: vi.fn(
        (listener: FocusTimerStateChangedListener) => {
          focusTimerStateChangedListener = listener;
          return () => {
            focusTimerStateChangedListener = null;
          };
        }
      ),
      query: vi.fn((query: HabitQuery) => {
        if (query.type === "focusTimer.getState") {
          return getFocusTimerState();
        }

        return Promise.resolve(null);
      }),
      releaseFocusTimerLeadership: vi.fn((_instanceId) => Promise.resolve()),
      saveFocusTimerState,
      showFocusWidget,
      showNotification: vi.fn().mockResolvedValue(42),
    },
  });

  return {
    emitFocusSessionRecorded(
      session: Parameters<FocusSessionRecordedListener>[0]
    ) {
      focusSessionRecordedListener?.(session);
    },
    emitFocusTimerAction(request: Parameters<FocusTimerActionListener>[0]) {
      focusTimerActionListener?.(request);
    },
    emitFocusTimerStateChanged(
      state: Parameters<FocusTimerStateChangedListener>[0]
    ) {
      focusTimerStateChangedListener?.(state);
    },
    getFocusTimerState,
    saveFocusTimerState,
    showFocusWidget,
  };
}

function teardownFocusTimerTest() {
  cleanup();
  vi.useRealTimers();
}

function createRecordedFocusSession(): FocusSession {
  return {
    completedAt: "2026-03-08T09:25:00.000Z",
    completedDate: "2026-03-08",
    durationSeconds: 1500,
    entryKind: "completed",
    id: 42,
    startedAt: "2026-03-08T09:00:00.000Z",
    timerSessionId: "timer-session-recorded",
  };
}

function renderFocusTimerHook({
  clearFocusSaveError = vi.fn(),
  pomodoroSettings = DEFAULT_TIMER_SETTINGS,
  recordFocusSession = vi
    .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
    .mockResolvedValue(createRecordedFocusSession()),
  setFocusSaveErrorMessage = vi.fn(),
}: {
  clearFocusSaveError?: () => void;
  pomodoroSettings?: PomodoroTimerSettings | null;
  recordFocusSession?: (
    input: CreateFocusSessionInput
  ) => Promise<FocusSession>;
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
  it("initializes a fresh idle timer from the saved default focus duration", async () => {
    setupFocusTimerTest();

    renderFocusTimerHook({
      pomodoroSettings: {
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: minutes(30),
        focusLongBreakSeconds: minutes(15),
        focusShortBreakSeconds: minutes(5),
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState).toMatchObject({
      focusDurationMs: minutesMs(30),
      remainingMs: minutesMs(30),
      status: "idle",
    });
    teardownFocusTimerTest();
  });

  it("pauses and resumes using end-time math", () => {
    setupFocusTimerTest();

    const running = createRunningFocusTimerState(
      new Date("2026-03-08T09:00:00.000Z"),
      minutesMs(25)
    );
    const paused = pauseFocusTimerState(
      running,
      new Date("2026-03-08T09:10:00.000Z")
    );

    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(minutesMs(15));

    const resumed = resumeFocusTimerState(
      paused,
      new Date("2026-03-08T09:12:00.000Z")
    );

    expect(resumed.status).toBe("running");
    expect(resumed.endsAt).toBe("2026-03-08T09:27:00.000Z");
    teardownFocusTimerTest();
  });

  it("restores an in-progress timer from IPC persistence", async () => {
    const { getFocusTimerState, saveFocusTimerState } = setupFocusTimerTest({
      breakVariant: null,
      completedFocusCycles: 2,
      cycleId: "cycle-restore",
      endsAt: "2026-03-08T09:25:00.000Z",
      focusDurationMs: 1_500_000,
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1_500_000,
      startedAt: "2026-03-08T09:00:00.000Z",
      status: "running",
      timerSessionId: "timer-session-restore",
    });

    renderFocusTimerHook();

    await act(async () => {
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState.status).toBe("running");
    expect(useFocusStore.getState().timerState.remainingMs).toBe(1_500_000);
    expect(getFocusTimerState).toHaveBeenCalledTimes(1);
    expect(saveFocusTimerState).not.toHaveBeenCalled();
    teardownFocusTimerTest();
  });

  it("records one completed focus session and transitions into a short break", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: "cycle-1",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
      timerSessionId: "timer-session-1",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession.mock.calls).toHaveLength(1);
    expect(recordFocusSession).toHaveBeenCalledWith(
      expect.objectContaining({
        entryKind: "completed",
        timerSessionId: "timer-session-1",
      })
    );
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "short",
      completedFocusCycles: 1,
      phase: "break",
      remainingMs: minutesMs(5),
      status: "running",
      timerSessionId: "timer-session-1",
    });
    teardownFocusTimerTest();
  });

  it("starts a long break when the cycle threshold is reached", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 3,
      cycleId: "cycle-4",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
      timerSessionId: "timer-session-4",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession.mock.calls).toHaveLength(1);
    expect(recordFocusSession).toHaveBeenCalledWith(
      expect.objectContaining({
        entryKind: "completed",
        timerSessionId: "timer-session-4",
      })
    );
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: 4,
      phase: "break",
      remainingMs: minutesMs(15),
      status: "running",
      timerSessionId: "timer-session-4",
    });
    expect(window.habits.showNotification).toHaveBeenCalledWith(
      "Focus set complete",
      "Time for a long break."
    );
    teardownFocusTimerTest();
  });

  it("starts the next focus session after a short break completes", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());

    useFocusStore.getState().setTimerState({
      breakVariant: "short",
      completedFocusCycles: 2,
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
      timerSessionId: "timer-session-short-break",
    });

    renderFocusTimerHook({ recordFocusSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession).not.toHaveBeenCalled();
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 2,
      endsAt: "2026-03-08T09:25:01.000Z",
      focusDurationMs: minutesMs(25),
      lastUpdatedAt: "2026-03-08T09:00:01.000Z",
      phase: "focus",
      remainingMs: minutesMs(25),
      startedAt: "2026-03-08T09:00:01.000Z",
      status: "running",
      timerSessionId: "timer-session-short-break",
    });
    teardownFocusTimerTest();
  });

  it("resets the cycle count after a long break completes", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());

    useFocusStore.getState().setTimerState({
      breakVariant: "long",
      completedFocusCycles: 4,
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
      timerSessionId: "timer-session-long-break",
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
        minutesMs(25),
        0,
        {
          completedAt: "2026-03-08T09:00:01.000Z",
          timerSessionId: "timer-session-long-break",
          variant: "long",
        }
      )
    );
    expect(window.habits.showNotification).toHaveBeenCalledWith(
      "Long break complete",
      "Pomodoro set finished."
    );
    teardownFocusTimerTest();
  });

  it("starts the next focus session with the latest saved default duration after a short break", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());

    useFocusStore.getState().setTimerState({
      breakVariant: "short",
      completedFocusCycles: 2,
      cycleId: null,
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "break",
      remainingMs: 1000,
      startedAt: null,
      status: "running",
      timerSessionId: "timer-session-short-break-latest",
    });

    renderFocusTimerHook({
      pomodoroSettings: {
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: minutes(30),
        focusLongBreakSeconds: minutes(15),
        focusShortBreakSeconds: minutes(5),
      },
      recordFocusSession,
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recordFocusSession).not.toHaveBeenCalled();
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 2,
      endsAt: "2026-03-08T09:30:01.000Z",
      focusDurationMs: minutesMs(30),
      lastUpdatedAt: "2026-03-08T09:00:01.000Z",
      phase: "focus",
      remainingMs: minutesMs(30),
      startedAt: "2026-03-08T09:00:01.000Z",
      status: "running",
      timerSessionId: "timer-session-short-break-latest",
    });
    teardownFocusTimerTest();
  });

  it("uses the latest saved settings only for the next created break", async () => {
    setupFocusTimerTest();
    const clearFocusSaveError = vi.fn();
    const recordFocusSession = vi
      .fn<(input: CreateFocusSessionInput) => Promise<FocusSession>>()
      .mockResolvedValue(createRecordedFocusSession());
    const setFocusSaveErrorMessage = vi.fn();

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: "cycle-settings",
      endsAt: "2026-03-08T09:00:02.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 2000,
      startedAt: "2026-03-08T08:35:02.000Z",
      status: "running",
      timerSessionId: "timer-session-settings",
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
        focusDefaultDurationSeconds: minutes(25),
        focusLongBreakSeconds: minutes(20),
        focusShortBreakSeconds: minutes(7),
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "short",
      remainingMs: minutesMs(7),
      status: "running",
    });
    teardownFocusTimerTest();
  });

  it("falls back to default pomodoro settings before runtime settings load", async () => {
    setupFocusTimerTest();
    const recordFocusSession = vi.fn().mockResolvedValue(42);
    const defaultPomodoroSettings = createDefaultPomodoroTimerSettings();

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 1,
      cycleId: "cycle-stored",
      endsAt: "2026-03-08T09:00:01.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1000,
      startedAt: "2026-03-08T08:35:01.000Z",
      status: "running",
      timerSessionId: "timer-session-stored",
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

    expect(recordFocusSession.mock.calls).toHaveLength(1);
    expect(useFocusStore.getState().timerState).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: defaultPomodoroSettings.focusCyclesBeforeLongBreak,
      remainingMs: defaultPomodoroSettings.focusLongBreakSeconds * 1000,
      status: "running",
    });
    expect(window.habits.showNotification).toHaveBeenCalledWith(
      "Focus set complete",
      "Time for a long break."
    );
    teardownFocusTimerTest();
  });

  it("reopens the widget when a focus timer starts", async () => {
    const { showFocusWidget } = setupFocusTimerTest();
    renderFocusTimerHook();

    await act(async () => {
      useFocusStore.getState().setTimerState(createRunningFocusTimerState());
      await Promise.resolve();
    });

    expect(showFocusWidget.mock.calls).toHaveLength(1);
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
        entryKind: "completed",
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-broadcast",
      });
      emitFocusSessionRecorded({
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        entryKind: "completed",
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-broadcast",
      });
      await Promise.resolve();
    });

    expect(useFocusStore.getState().focusSessions).toStrictEqual([
      {
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        entryKind: "completed",
        id: 10,
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-broadcast",
      },
    ]);
    teardownFocusTimerTest();
  });

  it("toggles the timer in response to a global focus timer action", async () => {
    const { emitFocusTimerAction } = setupFocusTimerTest();

    renderFocusTimerHook();

    await act(async () => {
      emitFocusTimerAction({ action: "toggle", source: "global-shortcut" });
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState.status).toBe("running");
    teardownFocusTimerTest();
  });

  it("resets the timer in response to a global focus timer action", async () => {
    const { emitFocusTimerAction } = setupFocusTimerTest();

    useFocusStore.getState().setTimerState({
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: "cycle-reset",
      endsAt: "2026-03-08T09:10:00.000Z",
      focusDurationMs: minutesMs(25),
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: minutesMs(10),
      startedAt: "2026-03-08T09:00:00.000Z",
      status: "running",
      timerSessionId: "timer-session-reset",
    });

    renderFocusTimerHook();

    await act(async () => {
      emitFocusTimerAction({ action: "reset", source: "global-shortcut" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useFocusStore.getState().timerState.status).toBe("idle");
    teardownFocusTimerTest();
  });
});
