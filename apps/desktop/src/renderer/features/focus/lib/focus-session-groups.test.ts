import type { FocusSession } from "@/shared/domain/focus-session";

import { buildFocusHistorySessions } from "./focus-session-groups";

function createFocusSession(input: {
  completedAt: string;
  completedDate: string;
  durationSeconds?: number;
  entryKind?: FocusSession["entryKind"];
  id: number;
  startedAt: string;
  timerSessionId?: string;
}): FocusSession {
  return {
    completedAt: input.completedAt,
    completedDate: input.completedDate,
    durationSeconds: input.durationSeconds ?? 1500,
    entryKind: input.entryKind ?? "completed",
    id: input.id,
    startedAt: input.startedAt,
    timerSessionId: input.timerSessionId ?? `timer-session-${input.id}`,
  };
}

describe("focus session groups", () => {
  it("creates one history session from a single focus entry", () => {
    const sessions = buildFocusHistorySessions([
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
      }),
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      completedLoopCount: 1,
      hasPartialEntry: false,
      sessionSpanMinutes: 25,
      totalDurationSeconds: 1500,
    });
    expect(sessions[0]?.timelineSegments).toHaveLength(1);
  });

  it("groups entries by a shared timer session id even with long gaps", () => {
    const sessions = buildFocusHistorySessions([
      createFocusSession({
        completedAt: "2026-03-13T11:25:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T11:00:00.000Z",
        timerSessionId: "timer-session-shared",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
        timerSessionId: "timer-session-shared",
      }),
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.completedLoopCount).toBe(2);
    expect(sessions[0]?.idleGapMinutesBetweenEntries).toStrictEqual([95]);
  });

  it("never merges close entries from different timer session ids", () => {
    const sessions = buildFocusHistorySessions([
      createFocusSession({
        completedAt: "2026-03-13T09:55:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:30:00.000Z",
        timerSessionId: "timer-session-2",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
        timerSessionId: "timer-session-1",
      }),
    ]);

    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.completedLoopCount)).toStrictEqual(
      [1, 1]
    );
  });

  it("keeps newer history sessions before older ones", () => {
    const sessions = buildFocusHistorySessions([
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

    expect(sessions.map((session) => session.date)).toStrictEqual([
      "2026-03-13",
      "2026-03-12",
    ]);
  });

  it("drops malformed entries without crashing", () => {
    const sessions = buildFocusHistorySessions([
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

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.completedLoopCount).toBe(1);
  });

  it("derives timeline offsets for completed loops, breaks, and a partial ending", () => {
    const [session] = buildFocusHistorySessions([
      createFocusSession({
        completedAt: "2026-03-13T10:57:00.000Z",
        completedDate: "2026-03-13",
        durationSeconds: 720,
        entryKind: "partial",
        id: 3,
        startedAt: "2026-03-13T10:45:00.000Z",
        timerSessionId: "timer-session-mixed",
      }),
      createFocusSession({
        completedAt: "2026-03-13T10:15:00.000Z",
        completedDate: "2026-03-13",
        id: 2,
        startedAt: "2026-03-13T09:50:00.000Z",
        timerSessionId: "timer-session-mixed",
      }),
      createFocusSession({
        completedAt: "2026-03-13T09:25:00.000Z",
        completedDate: "2026-03-13",
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
        timerSessionId: "timer-session-mixed",
      }),
    ]);

    expect(session).toMatchObject({
      completedLoopCount: 2,
      hasPartialEntry: true,
      sessionSpanMinutes: 117,
    });
    expect(session?.timelineSegments).toMatchObject([
      {
        durationSeconds: 1500,
        endOffsetMinutes: 25,
        entryKind: "completed",
        kind: "entry",
        startOffsetMinutes: 0,
      },
      {
        durationMinutes: 25,
        endOffsetMinutes: 50,
        kind: "break",
        startOffsetMinutes: 25,
      },
      {
        durationSeconds: 1500,
        endOffsetMinutes: 75,
        entryKind: "completed",
        kind: "entry",
        startOffsetMinutes: 50,
      },
      {
        durationMinutes: 30,
        endOffsetMinutes: 105,
        kind: "break",
        startOffsetMinutes: 75,
      },
      {
        durationSeconds: 720,
        endOffsetMinutes: 117,
        entryKind: "partial",
        kind: "entry",
        startOffsetMinutes: 105,
      },
    ]);
    expect(
      session?.timelineSegments.every((segment) => segment.widthPercent > 0)
    ).toBeTruthy();
  });

  it("renders paused time as its own timeline segment", () => {
    const [session] = buildFocusHistorySessions([
      createFocusSession({
        completedAt: "2026-03-13T09:35:00.000Z",
        completedDate: "2026-03-13",
        durationSeconds: 1500,
        id: 1,
        startedAt: "2026-03-13T09:00:00.000Z",
        timerSessionId: "timer-session-paused",
      }),
    ]);

    expect(session).toMatchObject({
      hasPausedTime: true,
      sessionSpanMinutes: 35,
      totalDurationSeconds: 1500,
    });
    expect(session?.timelineSegments).toMatchObject([
      {
        durationSeconds: 1500,
        endOffsetMinutes: 25,
        kind: "entry",
        startOffsetMinutes: 0,
      },
      {
        durationMinutes: 10,
        endOffsetMinutes: 35,
        kind: "pause",
        startOffsetMinutes: 25,
      },
    ]);
  });

  it("shows a completed short break before the next focus is persisted", () => {
    const [session] = buildFocusHistorySessions(
      [
        createFocusSession({
          completedAt: "2026-03-13T09:25:00.000Z",
          completedDate: "2026-03-13",
          id: 1,
          startedAt: "2026-03-13T09:00:00.000Z",
          timerSessionId: "timer-session-active",
        }),
      ],
      {
        breakVariant: null,
        completedFocusCycles: 1,
        cycleId: "active-cycle",
        endsAt: "2026-03-13T09:55:00.000Z",
        focusDurationMs: 1_500_000,
        lastCompletedBreak: null,
        lastUpdatedAt: "2026-03-13T09:30:00.000Z",
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: "2026-03-13T09:30:00.000Z",
        status: "running",
        timerSessionId: "timer-session-active",
      }
    );

    expect(session).toMatchObject({
      completedLoopCount: 1,
      sessionSpanMinutes: 30,
    });
    expect(session?.timelineSegments).toMatchObject([
      {
        durationSeconds: 1500,
        endOffsetMinutes: 25,
        entryKind: "completed",
        kind: "entry",
        startOffsetMinutes: 0,
      },
      {
        durationMinutes: 5,
        endOffsetMinutes: 30,
        kind: "break",
        startOffsetMinutes: 25,
      },
    ]);
  });

  it("keeps the final long break in history after the set returns to idle", () => {
    const [session] = buildFocusHistorySessions(
      [
        createFocusSession({
          completedAt: "2026-03-13T09:25:00.000Z",
          completedDate: "2026-03-13",
          id: 1,
          startedAt: "2026-03-13T09:00:00.000Z",
          timerSessionId: "timer-session-final-break",
        }),
      ],
      {
        breakVariant: null,
        completedFocusCycles: 0,
        cycleId: null,
        endsAt: null,
        focusDurationMs: 1_500_000,
        lastCompletedBreak: {
          completedAt: "2026-03-13T09:40:00.000Z",
          timerSessionId: "timer-session-final-break",
          variant: "long",
        },
        lastUpdatedAt: "2026-03-13T09:40:00.000Z",
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: null,
        status: "idle",
        timerSessionId: null,
      }
    );

    expect(session).toMatchObject({
      completedLoopCount: 1,
      sessionSpanMinutes: 40,
    });
    expect(session?.timelineSegments).toMatchObject([
      {
        durationSeconds: 1500,
        endOffsetMinutes: 25,
        entryKind: "completed",
        kind: "entry",
        startOffsetMinutes: 0,
      },
      {
        durationMinutes: 15,
        endOffsetMinutes: 40,
        kind: "break",
        startOffsetMinutes: 25,
      },
    ]);
  });
});
