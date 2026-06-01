import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { formatIsoTime } from "@/shared/domain/date-key";

interface FocusRunSummaryProps {
  breakCount: number;
  firstEntry: FocusHistorySessionView["entries"][number];
  lastEntry: FocusHistorySessionView["entries"][number];
  pauseCount: number;
  session: FocusHistorySessionView;
}

function formatEntryRange(startedAt: string, completedAt: string): string {
  return `${formatIsoTime(startedAt)} - ${formatIsoTime(completedAt)}`;
}

export function FocusRunSummary({
  breakCount,
  firstEntry,
  lastEntry,
  pauseCount,
  session,
}: FocusRunSummaryProps) {
  const rangeLabel =
    session.entries.length === 1
      ? formatEntryRange(firstEntry.startedAt, firstEntry.completedAt)
      : formatEntryRange(firstEntry.startedAt, lastEntry.completedAt);

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{rangeLabel}</p>
      <p className="text-xs text-muted-foreground">
        {session.completedLoopCount} completed loop
        {session.completedLoopCount === 1 ? "" : "s"}
        {session.hasPartialEntry ? " · 1 partial entry" : ""}
        {breakCount > 0
          ? ` · ${breakCount} break${breakCount === 1 ? "" : "s"}`
          : ""}
        {pauseCount > 0
          ? ` · ${pauseCount} pause${pauseCount === 1 ? "" : "s"}`
          : ""}
      </p>
    </div>
  );
}
