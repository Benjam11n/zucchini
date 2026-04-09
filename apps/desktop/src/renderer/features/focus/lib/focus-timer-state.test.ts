import { minutesMs } from "@/test/fixtures/focus-test-utils";

import {
  createRunningBreakTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
  skipBreakFocusTimerState,
} from "./focus-timer-state";

describe("focus timer state", () => {
  it("pauses and resumes using end-time math", () => {
    const running = createRunningFocusTimerState(
      new Date("2026-03-08T09:00:00.000Z"),
      minutesMs(25),
      2
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
    expect(resumed).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 2,
      endsAt: "2026-03-08T09:27:00.000Z",
      status: "running",
    });
  });

  it("stores long-break metadata on a running break", () => {
    const runningBreak = createRunningBreakTimerState({
      breakDurationMs: minutesMs(15),
      breakVariant: "long",
      completedFocusCycles: 4,
      focusDurationMs: minutesMs(25),
      now: new Date("2026-03-08T09:00:00.000Z"),
      timerSessionId: "timer-session-long",
    });

    expect(runningBreak).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: 4,
      phase: "break",
      remainingMs: minutesMs(15),
      status: "running",
    });
  });

  it("keeps the completed cycle count when skipping a long break", () => {
    const runningBreak = createRunningBreakTimerState({
      breakDurationMs: minutesMs(15),
      breakVariant: "long",
      completedFocusCycles: 4,
      focusDurationMs: minutesMs(25),
      now: new Date("2026-03-08T09:00:00.000Z"),
      timerSessionId: "timer-session-long",
    });

    const skippedBreak = skipBreakFocusTimerState(
      runningBreak,
      minutesMs(25),
      new Date("2026-03-08T09:15:00.000Z")
    );

    expect(skippedBreak).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 4,
      phase: "focus",
      status: "running",
      timerSessionId: "timer-session-long",
    });
  });

  it("preserves the cycle count when skipping a short break", () => {
    const runningBreak = createRunningBreakTimerState({
      breakDurationMs: minutesMs(5),
      breakVariant: "short",
      completedFocusCycles: 2,
      focusDurationMs: minutesMs(25),
      now: new Date("2026-03-08T09:00:00.000Z"),
      timerSessionId: "timer-session-short",
    });

    const skippedBreak = skipBreakFocusTimerState(
      runningBreak,
      minutesMs(25),
      new Date("2026-03-08T09:05:00.000Z")
    );

    expect(skippedBreak).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 2,
      phase: "focus",
      status: "running",
      timerSessionId: "timer-session-short",
    });
  });
});
