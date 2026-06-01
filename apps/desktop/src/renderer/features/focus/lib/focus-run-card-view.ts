import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { formatIsoDateTime, formatIsoTime } from "@/shared/domain/date-key";

export function formatSessionRangeLabel(
  startedAt: string,
  completedAt: string
): string {
  const dateLabel = formatIsoDateTime(completedAt, {
    day: "numeric",
    month: "short",
  });

  return `${dateLabel}, ${formatIsoTime(startedAt)} - ${formatIsoTime(completedAt)}`;
}

export function formatSessionWindow(sessionSpanMinutes: number): string {
  return `${sessionSpanMinutes} min session window`;
}

export function getRunCounts(session: FocusHistorySessionView): {
  breakCount: number;
  pauseCount: number;
} {
  return {
    breakCount: session.idleGapMinutesBetweenEntries.filter((gap) => gap > 0)
      .length,
    pauseCount: session.timelineSegments.filter(
      (segment) => segment.kind === "pause"
    ).length,
  };
}
