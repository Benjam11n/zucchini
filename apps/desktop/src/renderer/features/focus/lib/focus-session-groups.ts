import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { MS_PER_MINUTE } from "@/renderer/shared/lib/time";
import type {
  FocusSession,
  FocusSessionEntryKind,
} from "@/shared/domain/focus-session";

export interface FocusSessionEntryView {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  endMinuteOfDay: number;
  entryKind: FocusSessionEntryKind;
  id: number;
  startedAt: string;
  startMinuteOfDay: number;
  timerSessionId: string | null;
}

interface FocusHistorySessionTimelineSegmentBase {
  endOffsetMinutes: number;
  id: string;
  startOffsetMinutes: number;
  widthPercent: number;
}

export interface FocusHistorySessionEntryTimelineSegment extends FocusHistorySessionTimelineSegmentBase {
  completedAt: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  id: `${number}`;
  kind: "entry";
  startedAt: string;
}

export interface FocusHistorySessionBreakTimelineSegment extends FocusHistorySessionTimelineSegmentBase {
  durationMinutes: number;
  id: string;
  kind: "break";
}

export interface FocusHistorySessionPauseTimelineSegment extends FocusHistorySessionTimelineSegmentBase {
  durationMinutes: number;
  id: string;
  kind: "pause";
}

export type FocusHistorySessionTimelineSegment =
  | FocusHistorySessionBreakTimelineSegment
  | FocusHistorySessionEntryTimelineSegment
  | FocusHistorySessionPauseTimelineSegment;

export interface FocusHistorySessionView {
  completedAt: string;
  completedLoopCount: number;
  date: string;
  entries: FocusSessionEntryView[];
  hasPartialEntry: boolean;
  hasPausedTime: boolean;
  idleGapMinutesBetweenEntries: number[];
  sessionId: string;
  sessionSpanMinutes: number;
  startedAt: string;
  timelineSegments: FocusHistorySessionTimelineSegment[];
  totalDurationSeconds: number;
}

function getMinuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toEntryView(session: FocusSession): FocusSessionEntryView | null {
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
    entryKind: session.entryKind,
    id: session.id,
    startMinuteOfDay: getMinuteOfDay(startedAt),
    startedAt: session.startedAt,
    timerSessionId: session.timerSessionId,
  };
}

function sortEntriesByStartTime(
  entries: FocusSessionEntryView[]
): FocusSessionEntryView[] {
  return [...entries].toSorted((left, right) => {
    const timeDifference =
      Date.parse(left.startedAt) - Date.parse(right.startedAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.id - right.id;
  });
}

function getSessionGroupingKey(entry: FocusSessionEntryView): string {
  return entry.timerSessionId ?? `legacy-${entry.id}`;
}

function getTrailingBreakEndMs({
  activeTimerState,
  now,
  sessionId,
  sessionLastCompletedAt,
}: {
  activeTimerState?: PersistedFocusTimerState;
  now: Date;
  sessionId: string;
  sessionLastCompletedAt: string;
}): number | null {
  if (!activeTimerState) {
    return null;
  }

  const sessionLastCompletedAtMs = Date.parse(sessionLastCompletedAt);

  const completedBreak = activeTimerState.lastCompletedBreak;
  if (
    activeTimerState.status === "idle" &&
    completedBreak?.timerSessionId === sessionId &&
    completedBreak.completedAt > sessionLastCompletedAt
  ) {
    const completedBreakEndMs = Date.parse(completedBreak.completedAt);

    return completedBreakEndMs > sessionLastCompletedAtMs
      ? completedBreakEndMs
      : null;
  }

  if (
    activeTimerState.status !== "running" ||
    activeTimerState.timerSessionId !== sessionId
  ) {
    return null;
  }

  if (activeTimerState.phase === "focus" && activeTimerState.startedAt) {
    const activeFocusStartMs = Date.parse(activeTimerState.startedAt);

    return activeFocusStartMs > sessionLastCompletedAtMs
      ? activeFocusStartMs
      : null;
  }

  if (activeTimerState.phase === "break") {
    return now.getTime() > sessionLastCompletedAtMs ? now.getTime() : null;
  }

  return null;
}

function buildHistorySessionView(
  entries: FocusSessionEntryView[],
  {
    activeTimerState,
    now = new Date(),
  }: {
    activeTimerState?: PersistedFocusTimerState;
    now?: Date;
  } = {}
): FocusHistorySessionView {
  const sortedEntries = sortEntriesByStartTime(entries);
  const [firstEntry] = sortedEntries;
  const lastEntry = sortedEntries.at(-1);

  if (!firstEntry || !lastEntry) {
    throw new Error("Cannot build a session view from an empty entry list.");
  }
  const sessionStartMs = Date.parse(firstEntry.startedAt);
  const sessionId = getSessionGroupingKey(firstEntry);
  const trailingBreakEndMs = getTrailingBreakEndMs({
    activeTimerState,
    now,
    sessionId,
    sessionLastCompletedAt: lastEntry.completedAt,
  });
  const sessionEndMs = trailingBreakEndMs ?? Date.parse(lastEntry.completedAt);
  const sessionSpanMinutes = Math.max(
    1,
    Math.ceil((sessionEndMs - sessionStartMs) / MS_PER_MINUTE)
  );
  const totalDurationSeconds = sortedEntries.reduce(
    (total, entry) => total + entry.durationSeconds,
    0
  );
  const idleGapMinutesBetweenEntries = sortedEntries
    .slice(1)
    .map((entry, index) => {
      const previousEntry = sortedEntries[index];

      if (!previousEntry) {
        return 0;
      }

      return Math.max(
        0,
        Math.round(
          (Date.parse(entry.startedAt) -
            Date.parse(previousEntry.completedAt)) /
            MS_PER_MINUTE
        )
      );
    });

  return {
    completedAt: lastEntry.completedAt,
    completedLoopCount: sortedEntries.filter(
      (entry) => entry.entryKind === "completed"
    ).length,
    date: lastEntry.completedDate,
    entries: sortedEntries,
    hasPartialEntry: sortedEntries.some(
      (entry) => entry.entryKind === "partial"
    ),
    hasPausedTime: false,
    idleGapMinutesBetweenEntries,
    sessionId,
    sessionSpanMinutes,
    startedAt: firstEntry.startedAt,
    timelineSegments: (() => {
      const timelineSegments = sortedEntries.flatMap((entry, index) => {
        const segmentStartMinutes =
          (Date.parse(entry.startedAt) - sessionStartMs) / MS_PER_MINUTE;
        const entryEndMinutes =
          (Date.parse(entry.completedAt) - sessionStartMs) / MS_PER_MINUTE;
        const focusDurationMinutes = Math.max(
          Math.min(
            entry.durationSeconds / 60,
            entryEndMinutes - segmentStartMinutes
          ),
          0
        );
        const focusEndMinutes = segmentStartMinutes + focusDurationMinutes;
        const segments: FocusHistorySessionTimelineSegment[] = [
          {
            completedAt: entry.completedAt,
            durationSeconds: entry.durationSeconds,
            endOffsetMinutes: focusEndMinutes,
            entryKind: entry.entryKind,
            id: `${entry.id}`,
            kind: "entry",
            startOffsetMinutes: segmentStartMinutes,
            startedAt: entry.startedAt,
            widthPercent: Math.max(
              (focusEndMinutes - segmentStartMinutes) / sessionSpanMinutes,
              0.04
            ),
          } satisfies FocusHistorySessionEntryTimelineSegment,
        ];

        const pauseDurationMinutes = Math.max(
          0,
          Math.round(
            (Date.parse(entry.completedAt) -
              Date.parse(entry.startedAt) -
              entry.durationSeconds * 1000) /
              MS_PER_MINUTE
          )
        );

        if (pauseDurationMinutes > 0 && entryEndMinutes > focusEndMinutes) {
          segments.push({
            durationMinutes: pauseDurationMinutes,
            endOffsetMinutes: entryEndMinutes,
            id: `pause-${entry.id}`,
            kind: "pause",
            startOffsetMinutes: focusEndMinutes,
            widthPercent: Math.max(
              (entryEndMinutes - focusEndMinutes) / sessionSpanMinutes,
              0.02
            ),
          } satisfies FocusHistorySessionPauseTimelineSegment);
        }

        const nextEntry = sortedEntries[index + 1];

        if (!nextEntry) {
          return segments;
        }

        const breakStartMinutes = entryEndMinutes;
        const breakEndMinutes =
          (Date.parse(nextEntry.startedAt) - sessionStartMs) / MS_PER_MINUTE;
        const breakDurationMinutes = Math.max(
          0,
          Math.round(
            (Date.parse(nextEntry.startedAt) - Date.parse(entry.completedAt)) /
              MS_PER_MINUTE
          )
        );

        if (breakDurationMinutes <= 0 || breakEndMinutes <= breakStartMinutes) {
          return segments;
        }

        segments.push({
          durationMinutes: breakDurationMinutes,
          endOffsetMinutes: breakEndMinutes,
          id: `break-${entry.id}-${nextEntry.id}`,
          kind: "break",
          startOffsetMinutes: breakStartMinutes,
          widthPercent: Math.max(
            (breakEndMinutes - breakStartMinutes) / sessionSpanMinutes,
            0.02
          ),
        } satisfies FocusHistorySessionBreakTimelineSegment);

        return segments;
      });

      if (!trailingBreakEndMs) {
        return timelineSegments;
      }

      const trailingBreakStartMinutes =
        (Date.parse(lastEntry.completedAt) - sessionStartMs) / MS_PER_MINUTE;
      const trailingBreakEndMinutes =
        (trailingBreakEndMs - sessionStartMs) / MS_PER_MINUTE;
      const trailingBreakDurationMinutes = Math.max(
        0,
        Math.round(
          (trailingBreakEndMs - Date.parse(lastEntry.completedAt)) /
            MS_PER_MINUTE
        )
      );

      if (
        trailingBreakDurationMinutes > 0 &&
        trailingBreakEndMinutes > trailingBreakStartMinutes
      ) {
        timelineSegments.push({
          durationMinutes: trailingBreakDurationMinutes,
          endOffsetMinutes: trailingBreakEndMinutes,
          id: `break-${lastEntry.id}-active`,
          kind: "break",
          startOffsetMinutes: trailingBreakStartMinutes,
          widthPercent: Math.max(
            (trailingBreakEndMinutes - trailingBreakStartMinutes) /
              sessionSpanMinutes,
            0.02
          ),
        });
      }

      return timelineSegments;
    })(),
    totalDurationSeconds,
  };
}

export function buildFocusHistorySessions(
  sessions: FocusSession[],
  activeTimerState?: PersistedFocusTimerState
): FocusHistorySessionView[] {
  const groupedEntries = new Map<string, FocusSessionEntryView[]>();

  for (const session of sessions) {
    const entryView = toEntryView(session);

    if (!entryView) {
      continue;
    }

    const groupKey = getSessionGroupingKey(entryView);
    const existingEntries = groupedEntries.get(groupKey);

    if (existingEntries) {
      existingEntries.push(entryView);
      continue;
    }

    groupedEntries.set(groupKey, [entryView]);
  }

  return [...groupedEntries.values()]
    .map((entries) =>
      buildHistorySessionView(entries, {
        activeTimerState,
      })
    )
    .map((session) => ({
      ...session,
      hasPausedTime: session.timelineSegments.some(
        (segment) => segment.kind === "pause"
      ),
    }))
    .toSorted((left, right) => {
      const completedDifference =
        Date.parse(right.completedAt) - Date.parse(left.completedAt);

      if (completedDifference !== 0) {
        return completedDifference;
      }

      return Date.parse(right.startedAt) - Date.parse(left.startedAt);
    });
}
