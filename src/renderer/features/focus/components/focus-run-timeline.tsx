import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/ui/tooltip";

function formatSessionTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTimelineSegmentClassName(
  segment: FocusHistorySessionView["timelineSegments"][number]
): string {
  if (segment.kind === "break") {
    return "bg-amber-400/80 focus-visible:ring-amber-500/60";
  }

  if (segment.entryKind === "partial") {
    return "bg-primary/45 focus-visible:ring-primary/50";
  }

  return "bg-primary/85 focus-visible:ring-primary/60";
}

interface FocusRunTimelineProps {
  session: FocusHistorySessionView;
}

export function FocusRunTimeline({ session }: FocusRunTimelineProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div
        aria-label={`Focus timeline for ${session.completedLoopCount} completed loop${session.completedLoopCount === 1 ? "" : "s"}${session.hasPartialEntry ? " and a partial entry" : ""}${session.timelineSegments.some((segment) => segment.kind === "break") ? " with breaks" : ""}`}
        className="relative h-3 overflow-hidden rounded-full bg-muted/70"
      >
        {session.timelineSegments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <button
                aria-label={
                  segment.kind === "break"
                    ? `${segment.durationMinutes} minute break`
                    : `${segment.entryKind === "partial" ? "Partial " : ""}${formatSessionTime(segment.startedAt)} to ${formatSessionTime(segment.completedAt)}, ${getFocusMinutesLabel(formatFocusMinutes(segment.durationSeconds))}`
                }
                className={cn(
                  "absolute top-0 h-full rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2",
                  getTimelineSegmentClassName(segment)
                )}
                style={{
                  left: `${(segment.startOffsetMinutes / session.sessionSpanMinutes) * 100}%`,
                  width: `${segment.widthPercent * 100}%`,
                }}
                type="button"
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {segment.kind === "break"
                ? `${segment.durationMinutes} min break`
                : `${segment.entryKind === "partial" ? "Partial · " : ""}${formatSessionTime(segment.startedAt)} - ${formatSessionTime(segment.completedAt)} · ${formatFocusMinutes(segment.durationSeconds)} min`}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
