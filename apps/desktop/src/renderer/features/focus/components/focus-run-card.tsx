import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";
import { formatIsoDateTime, formatIsoTime } from "@/shared/utils/date";

import { FocusRunEntryRow } from "./focus-run-entry-row";
import { FocusRunTimeline } from "./focus-run-timeline";

function formatSessionRangeLabel(
  startedAt: string,
  completedAt: string
): string {
  const dateLabel = formatIsoDateTime(completedAt, {
    day: "numeric",
    month: "short",
  });

  return `${dateLabel}, ${formatIsoTime(startedAt)} - ${formatIsoTime(completedAt)}`;
}

function formatSessionWindow(sessionSpanMinutes: number): string {
  return `${sessionSpanMinutes} min session window`;
}

function formatEntryRange(startedAt: string, completedAt: string): string {
  return `${formatIsoTime(startedAt)} - ${formatIsoTime(completedAt)}`;
}

interface FocusRunCardProps {
  session: FocusHistorySessionView;
}

function getRunCounts(session: FocusHistorySessionView) {
  return {
    breakCount: session.idleGapMinutesBetweenEntries.filter((gap) => gap > 0)
      .length,
    pauseCount: session.timelineSegments.filter(
      (segment) => segment.kind === "pause"
    ).length,
  };
}

function FocusRunBadges({ session }: { session: FocusHistorySessionView }) {
  const totalMinutes = formatFocusMinutes(session.totalDurationSeconds);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="rounded-full border-border/70">
        {getFocusMinutesLabel(totalMinutes)}
      </Badge>
      <Badge variant="secondary" className="rounded-full">
        {session.completedLoopCount} completed loop
        {session.completedLoopCount === 1 ? "" : "s"}
      </Badge>
      {session.hasPartialEntry ? (
        <Badge variant="outline" className="rounded-full border-amber-500/40">
          Interrupted
        </Badge>
      ) : null}
      {session.hasPausedTime ? (
        <Badge
          variant="outline"
          className="rounded-full border-slate-400/50 text-slate-600"
        >
          Paused
        </Badge>
      ) : null}
    </div>
  );
}

function FocusRunSummary({
  breakCount,
  firstEntry,
  lastEntry,
  pauseCount,
  session,
}: {
  breakCount: number;
  firstEntry: FocusHistorySessionView["entries"][number];
  lastEntry: FocusHistorySessionView["entries"][number];
  pauseCount: number;
  session: FocusHistorySessionView;
}) {
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

function FocusRunDetails({
  detailsId,
  session,
}: {
  detailsId: string;
  session: FocusHistorySessionView;
}) {
  return (
    <div className="grid gap-2" id={detailsId}>
      {session.entries.map((entry, index) => (
        <FocusRunEntryRow
          key={entry.id}
          completedAt={entry.completedAt}
          durationSeconds={entry.durationSeconds}
          entryKind={entry.entryKind}
          idleGap={session.idleGapMinutesBetweenEntries[index - 1] ?? 0}
          index={index}
          startedAt={entry.startedAt}
        />
      ))}
    </div>
  );
}

export function FocusRunCard({ session }: FocusRunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const { breakCount, pauseCount } = getRunCounts(session);
  const [firstEntry] = session.entries;
  const lastEntry = session.entries.at(-1);

  if (!firstEntry || !lastEntry) {
    return null;
  }

  return (
    <div
      className="space-y-4 rounded-md border border-border/60 bg-muted/20 px-4 py-4"
      data-session-date={session.date}
      data-testid="focus-session-card"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {formatSessionRangeLabel(session.startedAt, session.completedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatSessionWindow(session.sessionSpanMinutes)}
          </p>
        </div>
        <FocusRunBadges session={session} />
      </div>

      <FocusRunTimeline session={session} />

      <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2">
        <FocusRunSummary
          breakCount={breakCount}
          firstEntry={firstEntry}
          lastEntry={lastEntry}
          pauseCount={pauseCount}
          session={session}
        />

        <Button
          aria-controls={detailsId}
          aria-expanded={isExpanded}
          className="shrink-0"
          onClick={() => setIsExpanded((value) => !value)}
          size="sm"
          type="button"
          variant="outline"
        >
          {isExpanded ? "Hide details" : "Show details"}
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      </div>

      {isExpanded ? (
        <FocusRunDetails detailsId={detailsId} session={session} />
      ) : null}
    </div>
  );
}
