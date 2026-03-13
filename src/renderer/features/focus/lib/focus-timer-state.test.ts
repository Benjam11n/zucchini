import {
  createRunningBreakTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "./focus-timer-state";

describe("focus timer state", () => {
  it("pauses and resumes using end-time math", () => {
    const running = createRunningFocusTimerState(
      new Date("2026-03-08T09:00:00.000Z"),
      25 * 60 * 1000,
      2
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
    expect(resumed).toMatchObject({
      breakVariant: null,
      completedFocusCycles: 2,
      endsAt: "2026-03-08T09:27:00.000Z",
      status: "running",
    });
  });

  it("stores long-break metadata on a running break", () => {
    const runningBreak = createRunningBreakTimerState({
      breakDurationMs: 15 * 60 * 1000,
      breakVariant: "long",
      completedFocusCycles: 4,
      focusDurationMs: 25 * 60 * 1000,
      now: new Date("2026-03-08T09:00:00.000Z"),
      timerSessionId: "timer-session-long",
    });

    expect(runningBreak).toMatchObject({
      breakVariant: "long",
      completedFocusCycles: 4,
      phase: "break",
      remainingMs: 15 * 60 * 1000,
      status: "running",
    });
  });
});
