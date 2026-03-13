import type { FocusSession } from "@/shared/domain/focus-session";

const MS_PER_MINUTE = 60 * 1000;
const RUN_GAP_THRESHOLD_MINUTES = 30;
const RUN_GAP_THRESHOLD_MS = RUN_GAP_THRESHOLD_MINUTES * MS_PER_MINUTE;

export interface FocusSessionView {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  endMinuteOfDay: number;
  id: number;
  startedAt: string;
  startMinuteOfDay: number;
}

export interface FocusRunTimelineSegment {
  completedAt: string;
  durationSeconds: number;
  endOffsetMinutes: number;
  id: number;
  startOffsetMinutes: number;
  startedAt: string;
  widthPercent: number;
}

export interface FocusRunView {
  completedAt: string;
  date: string;
  idleGapMinutesBetweenSessions: number[];
  runId: string;
  runSpanMinutes: number;
  sessionCount: number;
  sessions: FocusSessionView[];
  startedAt: string;
  timelineSegments: FocusRunTimelineSegment[];
  totalDurationSeconds: number;
}

function getMinuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toSessionView(session: FocusSession): FocusSessionView | null {
  const startedAt = new Date(session.startedAt);
  const completedAt = new Date(session.completedAt);

  if (
    Number.isNaN(startedAt.getTime()) ||
    Number.isNaN(completedAt.getTime()) ||
    completedAt.getTime() < startedAt.getTime()
  ) {
    return null;
  }

  return {
    completedAt: session.completedAt,
    completedDate: session.completedDate,
    durationSeconds: session.durationSeconds,
    endMinuteOfDay: getMinuteOfDay(completedAt),
    id: session.id,
    startMinuteOfDay: getMinuteOfDay(startedAt),
    startedAt: session.startedAt,
  };
}

function sortSessionsByStartTime(
  sessions: FocusSessionView[]
): FocusSessionView[] {
  return [...sessions].toSorted((left, right) => {
    const timeDifference =
      Date.parse(left.startedAt) - Date.parse(right.startedAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.id - right.id;
  });
}

function buildRunView(sessions: FocusSessionView[]): FocusRunView {
  const sortedSessions = sortSessionsByStartTime(sessions);
  const firstSession = sortedSessions[0]!;
  const lastSession = sortedSessions.at(-1)!;
  const runStartMs = Date.parse(firstSession.startedAt);
  const runEndMs = Date.parse(lastSession.completedAt);
  const runSpanMinutes = Math.max(
    1,
    Math.ceil((runEndMs - runStartMs) / MS_PER_MINUTE)
  );
  const totalDurationSeconds = sortedSessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );
  const idleGapMinutesBetweenSessions = sortedSessions
    .slice(1)
    .map((session, index) => {
      const previousSession = sortedSessions[index]!;

      return Math.max(
        0,
        Math.round(
          (Date.parse(session.startedAt) -
            Date.parse(previousSession.completedAt)) /
            MS_PER_MINUTE
        )
      );
    });

  return {
    completedAt: lastSession.completedAt,
    date: lastSession.completedDate,
    idleGapMinutesBetweenSessions,
    runId: `${lastSession.completedDate}-${firstSession.id}-${lastSession.id}`,
    runSpanMinutes,
    sessionCount: sortedSessions.length,
    sessions: sortedSessions,
    startedAt: firstSession.startedAt,
    timelineSegments: sortedSessions.map((session) => {
      const segmentStartMinutes =
        (Date.parse(session.startedAt) - runStartMs) / MS_PER_MINUTE;
      const segmentEndMinutes =
        (Date.parse(session.completedAt) - runStartMs) / MS_PER_MINUTE;

      return {
        completedAt: session.completedAt,
        durationSeconds: session.durationSeconds,
        endOffsetMinutes: segmentEndMinutes,
        id: session.id,
        startOffsetMinutes: segmentStartMinutes,
        startedAt: session.startedAt,
        widthPercent: Math.max(
          (segmentEndMinutes - segmentStartMinutes) / runSpanMinutes,
          0.04
        ),
      };
    }),
    totalDurationSeconds,
  };
}

export function buildFocusRuns(sessions: FocusSession[]): FocusRunView[] {
  const sortedSessions = [...sessions].toSorted((left, right) => {
    const completedDifference =
      Date.parse(right.completedAt) - Date.parse(left.completedAt);

    if (completedDifference !== 0) {
      return completedDifference;
    }

    return right.id - left.id;
  });

  const runs: FocusRunView[] = [];
  let currentRunSessions: FocusSessionView[] = [];

  for (const session of sortedSessions) {
    const sessionView = toSessionView(session);

    if (!sessionView) {
      if (currentRunSessions.length > 0) {
        runs.push(buildRunView(currentRunSessions));
        currentRunSessions = [];
      }

      continue;
    }

    const [latestRunSession] = currentRunSessions;

    if (!latestRunSession) {
      currentRunSessions = [sessionView];
      continue;
    }

    const latestRunStartMs = Date.parse(latestRunSession.startedAt);
    const sameDate =
      sessionView.completedDate === latestRunSession.completedDate;
    const gapMs = latestRunStartMs - Date.parse(sessionView.completedAt);
    const shouldJoinCurrentRun =
      sameDate && gapMs >= 0 && gapMs <= RUN_GAP_THRESHOLD_MS;

    if (shouldJoinCurrentRun) {
      currentRunSessions.unshift(sessionView);
      continue;
    }

    runs.push(buildRunView(currentRunSessions));
    currentRunSessions = [sessionView];
  }

  if (currentRunSessions.length > 0) {
    runs.push(buildRunView(currentRunSessions));
  }

  return runs;
}
