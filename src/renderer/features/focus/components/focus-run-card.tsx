import { Clock3, PauseCircle } from "lucide-react";

import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusRunView } from "@/renderer/features/focus/lib/focus-session-groups";
import { Badge } from "@/renderer/shared/ui/badge";

import { FocusRunTimeline } from "./focus-run-timeline";

function formatRunRange(startedAt: string, completedAt: string): string {
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

function formatRunWindow(runSpanMinutes: number): string {
  if (runSpanMinutes < 60) {
    return `${runSpanMinutes}m window`;
  }

  const hours = Math.floor(runSpanMinutes / 60);
  const minutes = runSpanMinutes % 60;

  if (minutes === 0) {
    return `${hours}h window`;
  }

  return `${hours}h ${minutes}m window`;
}

function formatSessionRange(startedAt: string, completedAt: string): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startedAt))} - ${formatter.format(new Date(completedAt))}`;
}

interface FocusRunCardProps {
  run: FocusRunView;
}

export function FocusRunCard({ run }: FocusRunCardProps) {
  const totalMinutes = formatFocusMinutes(run.totalDurationSeconds);

  return (
    <div
      className="space-y-4 rounded-[26px] border border-border/60 bg-muted/20 px-4 py-4"
      data-run-date={run.date}
      data-testid="focus-run-card"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {formatRunRange(run.startedAt, run.completedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRunWindow(run.runSpanMinutes)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full border-border/70">
            {getFocusMinutesLabel(totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            {run.sessionCount} session{run.sessionCount === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      <FocusRunTimeline run={run} />

      <div className="grid gap-2">
        {run.sessions.map((session, index) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/70 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock3 className="size-4 text-primary/80" />
              <span>
                {formatSessionRange(session.startedAt, session.completedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFocusMinutes(session.durationSeconds)} min</span>
              {index > 0 && run.idleGapMinutesBetweenSessions[index - 1] > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <PauseCircle className="size-3.5" />
                  {run.idleGapMinutesBetweenSessions[index - 1]}m gap
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
