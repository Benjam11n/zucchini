import { ChevronDown, Clock3, PauseCircle } from "lucide-react";
import { useId, useState } from "react";

import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { cn } from "@/renderer/shared/lib/class-names";
import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";

import { FocusRunTimeline } from "./focus-run-timeline";

function formatSessionRangeLabel(
  startedAt: string,
  completedAt: string
): string {
  const startDate = new Date(startedAt);
  const endDate = new Date(completedAt);

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(endDate);
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateLabel}, ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
}

function formatSessionWindow(sessionSpanMinutes: number): string {
  if (sessionSpanMinutes < 60) {
    return `${sessionSpanMinutes}m session window`;
  }

  const hours = Math.floor(sessionSpanMinutes / 60);
  const minutes = sessionSpanMinutes % 60;

  if (minutes === 0) {
    return `${hours}h session window`;
  }

  return `${hours}h ${minutes}m session window`;
}

function formatEntryRange(startedAt: string, completedAt: string): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startedAt))} - ${formatter.format(new Date(completedAt))}`;
}

interface FocusRunCardProps {
  session: FocusHistorySessionView;
}

export function FocusRunCard({ session }: FocusRunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const totalMinutes = formatFocusMinutes(session.totalDurationSeconds);
  const breakCount = session.idleGapMinutesBetweenEntries.filter(
    (gap) => gap > 0
  ).length;
  const pauseCount = session.timelineSegments.filter(
    (segment) => segment.kind === "pause"
  ).length;
  const [firstEntry] = session.entries;
  const lastEntry = session.entries.at(-1);

  if (!firstEntry || !lastEntry) {
    return null;
  }

  return (
    <div
      className="space-y-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-4"
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

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full border-border/70">
            {getFocusMinutesLabel(totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            {session.completedLoopCount} completed loop
            {session.completedLoopCount === 1 ? "" : "s"}
          </Badge>
          {session.hasPartialEntry ? (
            <Badge
              variant="outline"
              className="rounded-full border-amber-500/40"
            >
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
      </div>

      <FocusRunTimeline session={session} />

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {session.entries.length === 1
              ? formatEntryRange(firstEntry.startedAt, firstEntry.completedAt)
              : `${formatEntryRange(firstEntry.startedAt, lastEntry.completedAt)}`}
          </p>
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

        <Button
          aria-controls={detailsId}
          aria-expanded={isExpanded}
          className="shrink-0 rounded-full"
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
        <div className="grid gap-2" id={detailsId}>
          {session.entries.map((entry, index) => {
            const idleGap =
              session.idleGapMinutesBetweenEntries[index - 1] ?? 0;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock3 className="size-4 text-primary/80" />
                  <span>
                    {formatEntryRange(entry.startedAt, entry.completedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {entry.entryKind === "partial" ? "Partial · " : ""}
                    {formatFocusMinutes(entry.durationSeconds)} min
                  </span>
                  {index > 0 && idleGap > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <PauseCircle className="size-3.5" />
                      {idleGap}m gap
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
