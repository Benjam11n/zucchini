import type { FocusSession } from "@/shared/domain/focus-session";

import { buildFocusRuns } from "./focus-session-groups";

function createFocusSession(input: {
  completedAt: string;
  completedDate: string;
  durationSeconds?: number;
  id: number;
  startedAt: string;
}): FocusSession {
  return {
    completedAt: input.completedAt,
    completedDate: input.completedDate,
    durationSeconds: input.durationSeconds ?? 1500,
    id: input.id,
    startedAt: input.startedAt,
  };
}

describe("focus session groups", () => {
  it("creates one run from a single session", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      runSpanMinutes: 25,
      sessionCount: 1,
      totalDurationSeconds: 1500,
    });
    expect(runs[0]?.timelineSegments).toHaveLength(1);
  });

  it("merges same-day sessions when the gap is within thirty minutes", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-13T10:15:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:50:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(runs).toHaveLength(1);
    expect(runs[0]?.sessionCount).toBe(2);
    expect(runs[0]?.idleGapMinutesBetweenSessions).toStrictEqual([25]);
  });

  it("splits runs when the gap is greater than thirty minutes", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-13T11:25:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T11:00:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(runs).toHaveLength(2);
    expect(runs.map((run) => run.sessionCount)).toStrictEqual([1, 1]);
  });

  it("never merges across different completed dates", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-14T00:10:00.000Z",
        completedDate: "2026-03-14",
        id: 2,
        startedAt: "2026-03-13T23:45:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T23:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T23:00:00.000Z",
      }),
    ]);

    expect(runs).toHaveLength(2);
  });

  it("normalizes unsorted input and keeps newest runs first", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-12T09:25:00.000Z",
        completedDate: "2026-03-12",
        id: 1,
        startedAt: "2026-03-12T09:00:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(runs.map((run) => run.date)).toStrictEqual([
      "2026-03-13",
      "2026-03-12",
    ]);
  });

  it("drops malformed sessions without crashing", () => {
    const runs = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:00:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:25:00.000Z",
      }),
    ]);

    expect(runs).toHaveLength(1);
    expect(runs[0]?.sessionCount).toBe(1);
  });

  it("derives timeline offsets and widths for a multi-session run", () => {
    const [run] = buildFocusRuns([
      createFocusSession({
        completedAt: "2026-03-13T10:45:00.000Z",
        completedDate: "2026-03-13",
        id: 3,
        startedAt: "2026-03-13T10:25:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T10:15:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:50:00.000Z",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(run?.runSpanMinutes).toBe(105);
    expect(
      run?.timelineSegments.map((segment) => ({
        end: segment.endOffsetMinutes,
        start: segment.startOffsetMinutes,
      }))
    ).toStrictEqual([
      { end: 25, start: 0 },
      { end: 75, start: 50 },
      { end: 105, start: 85 },
    ]);
    expect(
      run?.timelineSegments.every((segment) => segment.widthPercent > 0)
    ).toBeTruthy();
  });
});
