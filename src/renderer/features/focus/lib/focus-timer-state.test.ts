import {
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "./focus-timer-state";

describe("focus timer state", () => {
  it("pauses and resumes using end-time math", () => {
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
  });
});
